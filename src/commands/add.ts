import chalk from 'chalk';
import { LyricDatabase } from '../db/database.js';
import { OllamaClient } from '../ai/ollama.js';
import { formatSuccess, formatError, formatLyric } from '../utils/formatting.js';

/**
 * Add a new lyric to the vault with AI analysis
 * @param text - The lyric text to add
 */
export async function addCommand(text: string): Promise<void> {
  const db = new LyricDatabase();

  try {
    console.log(chalk.cyan('Analyzing lyric with Ollama...'));

    // Create Ollama client and analyze the lyric
    const ollama = new OllamaClient();
    const { analysis, rawResponse } = await ollama.analyzeLyric(text);

    // Save to database
    const id = db.insertLyric(text, analysis, rawResponse);

    // Display success message
    console.log(formatSuccess(`Lyric captured (#${id})`));
    console.log('');

    // Retrieve and display the saved lyric with all metadata
    const savedLyric = db.getLyric(id);
    if (savedLyric) {
      console.log(formatLyric(savedLyric));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log(formatError(`Failed to add lyric: ${message}`));
    process.exit(1);
  } finally {
    db.close();
  }
}
