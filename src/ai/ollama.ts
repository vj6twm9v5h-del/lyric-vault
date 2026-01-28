import axios from 'axios';
import { LyricAnalysis, Config } from '../types/index.js';
import { loadConfig } from '../utils/config.js';
import { ANALYSIS_PROMPT } from './prompts.js';

/**
 * Client for interacting with Ollama API
 * Handles connection testing and lyric analysis
 */
export class OllamaClient {
  private model: string;
  private baseUrl: string;

  constructor(config?: Partial<Config>) {
    const fullConfig = loadConfig();
    this.model = config?.ollama_model ?? fullConfig.ollama_model;
    this.baseUrl = config?.ollama_url ?? fullConfig.ollama_url;
  }

  /**
   * Tests connection to Ollama API
   * @returns Promise<boolean> - true if connection successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if the configured model is available
   * @returns Promise<{available: boolean, models: string[]}>
   */
  async checkModelAvailable(): Promise<{ available: boolean; models: string[] }> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000
      });

      const models: string[] = response.data?.models?.map((m: { name: string }) => m.name) ?? [];
      const available = models.some(name => name.startsWith(this.model));

      return { available, models };
    } catch (error) {
      return { available: false, models: [] };
    }
  }

  /**
   * Analyzes a lyric fragment using Ollama
   * @param lyricText - The lyric text to analyze
   * @returns Promise<{analysis: LyricAnalysis, rawResponse: string}> - Parsed analysis and raw response
   * @throws Error if Ollama is unavailable or response is invalid
   */
  async analyzeLyric(lyricText: string): Promise<{ analysis: LyricAnalysis; rawResponse: string }> {
    const prompt = this.buildAnalysisPrompt(lyricText);

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          stream: false,
          options: { temperature: 0.3 }
        },
        { timeout: 60000 } // 60 second timeout for generation
      );

      const rawResponse = response.data.response;
      const analysis = this.parseAnalysisResponse(rawResponse);

      return { analysis, rawResponse };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Ollama is not running. Please start Ollama with: ollama serve');
        }
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
          throw new Error('Ollama request timed out. The model may be loading or the request is too complex.');
        }
        if (error.response?.status === 404) {
          throw new Error(`Model '${this.model}' not found. Please pull it with: ollama pull ${this.model}`);
        }
      }
      throw new Error(`Ollama analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates text using Ollama with a custom prompt
   * @param prompt - The prompt to send
   * @returns Promise<string> - The generated text
   */
  async generate(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          stream: false,
          options: { temperature: 0.7 }
        },
        { timeout: 60000 }
      );

      return response.data.response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Ollama is not running. Please start Ollama with: ollama serve');
        }
      }
      throw new Error(`Ollama generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Builds the analysis prompt for a lyric fragment
   * Uses the centralized ANALYSIS_PROMPT from prompts.ts
   */
  private buildAnalysisPrompt(lyricText: string): string {
    return ANALYSIS_PROMPT(lyricText);
  }

  /**
   * Parses the raw Ollama response into a LyricAnalysis object
   * Handles markdown code blocks and JSON extraction
   */
  private parseAnalysisResponse(rawResponse: string): LyricAnalysis {
    let jsonStr = rawResponse.trim();

    // Handle potential markdown code blocks
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    // Try to extract JSON if there's extra text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(jsonStr);

      // Validate and provide defaults for missing fields
      const analysis: LyricAnalysis = {
        themes: Array.isArray(parsed.themes) ? parsed.themes : [],
        rhyme_patterns: Array.isArray(parsed.rhyme_patterns) ? parsed.rhyme_patterns : [],
        mood: typeof parsed.mood === 'string' ? parsed.mood : 'unknown',
        imagery_tags: Array.isArray(parsed.imagery_tags) ? parsed.imagery_tags : []
      };

      return analysis;
    } catch (parseError) {
      throw new Error(`Failed to parse Ollama response as JSON: ${jsonStr.substring(0, 200)}`);
    }
  }

  /**
   * Gets the currently configured model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Gets the currently configured base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
