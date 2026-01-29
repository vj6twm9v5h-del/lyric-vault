import chalk from 'chalk';
import { LyricDatabase } from '../db/database.js';
import { OllamaClient } from '../ai/ollama.js';
import { SUGGESTION_PROMPT } from '../ai/prompts.js';
import { calculateRhymeScore } from '../utils/rhyme.js';
import { formatSuccess, formatError, formatWarning, formatSuggestion, formatHeader, formatDivider } from '../utils/formatting.js';
import { Lyric, LyricAnalysis, LyricSuggestion } from '../types/index.js';

/**
 * Calculate match score between input analysis and a stored lyric
 * Returns score and reasons for the match
 */
function calculateMatchScore(
  inputAnalysis: LyricAnalysis,
  storedLyric: Lyric
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let totalScore = 0;
  let weights = 0;

  // Theme matching (weight: 0.35)
  const themeWeight = 0.35;
  const sharedThemes = inputAnalysis.themes.filter(theme =>
    storedLyric.themes.some(storedTheme =>
      storedTheme.toLowerCase().includes(theme.toLowerCase()) ||
      theme.toLowerCase().includes(storedTheme.toLowerCase())
    )
  );
  if (sharedThemes.length > 0) {
    const themeScore = Math.min(sharedThemes.length / Math.max(inputAnalysis.themes.length, 1), 1);
    totalScore += themeScore * themeWeight;
    reasons.push(`Shared themes: ${sharedThemes.join(', ')}`);
  }
  weights += themeWeight;

  // Rhyme pattern matching (weight: 0.30)
  const rhymeWeight = 0.30;
  const rhymeScore = calculateRhymeScore(
    inputAnalysis.rhyme_patterns,
    storedLyric.rhyme_patterns
  );
  if (rhymeScore > 0) {
    totalScore += rhymeScore * rhymeWeight;
    if (rhymeScore > 0.3) {
      reasons.push(`Compatible rhyme patterns`);
    }
  }
  weights += rhymeWeight;

  // Mood matching (weight: 0.25)
  const moodWeight = 0.25;
  if (inputAnalysis.mood && storedLyric.mood) {
    const inputMoodWords = inputAnalysis.mood.toLowerCase().split(/[\s,]+/);
    const storedMoodWords = storedLyric.mood.toLowerCase().split(/[\s,]+/);

    const sharedMoodWords = inputMoodWords.filter(word =>
      storedMoodWords.some(storedWord =>
        storedWord.includes(word) || word.includes(storedWord)
      )
    );

    if (sharedMoodWords.length > 0) {
      const moodScore = Math.min(sharedMoodWords.length / Math.max(inputMoodWords.length, 1), 1);
      totalScore += moodScore * moodWeight;
      reasons.push(`Similar mood: ${storedLyric.mood}`);
    }
  }
  weights += moodWeight;

  // Imagery matching (weight: 0.10)
  const imageryWeight = 0.10;
  const sharedImagery = inputAnalysis.imagery_tags.filter(tag =>
    storedLyric.imagery_tags.some(storedTag =>
      storedTag.toLowerCase().includes(tag.toLowerCase()) ||
      tag.toLowerCase().includes(storedTag.toLowerCase())
    )
  );
  if (sharedImagery.length > 0) {
    const imageryScore = Math.min(sharedImagery.length / Math.max(inputAnalysis.imagery_tags.length, 1), 1);
    totalScore += imageryScore * imageryWeight;
    reasons.push(`Matching imagery: ${sharedImagery.join(', ')}`);
  }
  weights += imageryWeight;

  // Normalize score
  const normalizedScore = weights > 0 ? totalScore / weights : 0;

  return { score: normalizedScore, reasons };
}

/**
 * Generate AI-powered adaptations for suggestions
 * @param userLyric - The input lyric from the user
 * @param userAnalysis - Analysis of the user's lyric
 * @param suggestions - Top suggestions to generate adaptations for
 * @param ollama - OllamaClient instance
 * @returns Updated suggestions with adaptations
 */
async function generateAdaptations(
  userLyric: string,
  userAnalysis: LyricAnalysis,
  suggestions: LyricSuggestion[],
  ollama: OllamaClient
): Promise<LyricSuggestion[]> {
  const adaptedSuggestions: LyricSuggestion[] = [];

  for (const suggestion of suggestions) {
    try {
      const prompt = SUGGESTION_PROMPT(
        userLyric,
        userAnalysis,
        suggestion.lyric,
        suggestion.match_reasons
      );

      const adaptation = await ollama.generate(prompt);

      // Clean up the adaptation response
      let cleanAdaptation = adaptation.trim();
      // Remove any quotes if the model wrapped the response
      if (cleanAdaptation.startsWith('"') && cleanAdaptation.endsWith('"')) {
        cleanAdaptation = cleanAdaptation.slice(1, -1);
      }
      if (cleanAdaptation.startsWith("'") && cleanAdaptation.endsWith("'")) {
        cleanAdaptation = cleanAdaptation.slice(1, -1);
      }

      adaptedSuggestions.push({
        ...suggestion,
        suggested_adaptation: cleanAdaptation
      });
    } catch {
      // If adaptation fails, still include the suggestion without adaptation
      adaptedSuggestions.push(suggestion);
    }
  }

  return adaptedSuggestions;
}

/**
 * Suggest command - Find matching lyrics from the vault
 * @param inputText - The input lyric to find matches for
 */
export async function suggestCommand(inputText: string): Promise<void> {
  const db = new LyricDatabase();

  try {
    // Check if vault is empty first
    const allLyrics = db.getAllLyrics();
    if (allLyrics.length === 0) {
      console.log(formatWarning('Your lyric vault is empty!'));
      console.log(chalk.gray('Add some lyrics first with: lyric add "your lyric text"'));
      return;
    }

    console.log(chalk.cyan('Analyzing your lyric with Ollama...'));

    // Analyze the input lyric
    const ollama = new OllamaClient();
    const { analysis: inputAnalysis } = await ollama.analyzeLyric(inputText);

    console.log(chalk.gray(`Found themes: ${inputAnalysis.themes.join(', ')}`));
    console.log(chalk.gray(`Detected mood: ${inputAnalysis.mood}`));
    console.log('');

    // Calculate match scores for all stored lyrics
    const suggestions: LyricSuggestion[] = [];

    for (const lyric of allLyrics) {
      const { score, reasons } = calculateMatchScore(inputAnalysis, lyric);

      // Only include suggestions with meaningful matches
      if (score > 0.1 && reasons.length > 0) {
        suggestions.push({
          lyric,
          match_score: score,
          match_reasons: reasons
        });
      }
    }

    // Sort by score (highest first)
    suggestions.sort((a, b) => b.match_score - a.match_score);

    // Display results
    if (suggestions.length === 0) {
      console.log(formatWarning('No matching lyrics found in your vault.'));
      console.log(chalk.gray('Try adding more lyrics with varied themes and moods.'));
      return;
    }

    // Show top suggestions (limit to 5, but generate adaptations for top 3)
    const topSuggestions = suggestions.slice(0, 5);
    const suggestionsForAdaptation = topSuggestions.slice(0, 3);

    console.log(chalk.cyan('Generating AI adaptations for top matches...'));
    console.log('');

    // Generate AI adaptations for top 3 suggestions
    const adaptedSuggestions = await generateAdaptations(
      inputText,
      inputAnalysis,
      suggestionsForAdaptation,
      ollama
    );

    // Merge adapted suggestions back with any remaining ones
    const finalSuggestions = [
      ...adaptedSuggestions,
      ...topSuggestions.slice(3)
    ];

    console.log(formatHeader(`Found ${suggestions.length} matching lyric${suggestions.length === 1 ? '' : 's'}`));
    console.log('');

    for (let i = 0; i < finalSuggestions.length; i++) {
      console.log(formatSuggestion(finalSuggestions[i], i));
      if (i < finalSuggestions.length - 1) {
        console.log(formatDivider());
      }
    }

    console.log('');
    console.log(formatSuccess(`Showing top ${finalSuggestions.length} of ${suggestions.length} matches`));

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log(formatError(`Failed to find suggestions: ${message}`));
    process.exit(1);
  } finally {
    db.close();
  }
}
