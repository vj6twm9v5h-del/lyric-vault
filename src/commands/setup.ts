import chalk from 'chalk';
import { OllamaClient } from '../ai/ollama.js';
import { LyricDatabase } from '../db/database.js';
import { loadConfig, saveConfig, getConfigDir } from '../utils/config.js';
import { formatSuccess, formatError, formatWarning, formatHeader } from '../utils/formatting.js';

/**
 * Setup command for first-run initialization
 * Tests Ollama connection, initializes database, and saves config
 */
export async function setupCommand(): Promise<void> {
  console.log(formatHeader('Lyric Vault Setup'));

  // Load current config (or defaults)
  const config = loadConfig();
  console.log(chalk.cyan('\nConfiguration:'));
  console.log(`  Data directory: ${chalk.white(getConfigDir())}`);
  console.log(`  Ollama URL: ${chalk.white(config.ollama_url)}`);
  console.log(`  Ollama model: ${chalk.white(config.ollama_model)}`);

  // Test Ollama connection
  console.log(chalk.cyan('\nTesting Ollama connection...'));
  const ollamaClient = new OllamaClient(config);
  const isConnected = await ollamaClient.testConnection();

  if (isConnected) {
    console.log(formatSuccess('Ollama is running'));

    // Check if the configured model is available
    const { available, models } = await ollamaClient.checkModelAvailable();
    if (available) {
      console.log(formatSuccess(`Model '${config.ollama_model}' is available`));
    } else {
      console.log(formatWarning(`Model '${config.ollama_model}' not found`));
      if (models.length > 0) {
        console.log(chalk.gray(`  Available models: ${models.slice(0, 5).join(', ')}${models.length > 5 ? '...' : ''}`));
      }
      console.log(chalk.yellow(`  To install: ${chalk.white(`ollama pull ${config.ollama_model}`)}`));
    }
  } else {
    console.log(formatError('Cannot connect to Ollama'));
    console.log(chalk.yellow('\nTo fix this:'));
    console.log(chalk.white('  1. Install Ollama: https://ollama.com'));
    console.log(chalk.white('  2. Start Ollama: ollama serve'));
    console.log(chalk.white(`  3. Pull the model: ollama pull ${config.ollama_model}`));
    console.log(chalk.gray('\nLyric Vault will work without Ollama, but AI features will be unavailable.'));
  }

  // Initialize database
  console.log(chalk.cyan('\nInitializing database...'));
  let db: LyricDatabase | null = null;
  try {
    db = new LyricDatabase(config.database_path);
    const stats = db.getStats();
    console.log(formatSuccess('Database ready'));
    console.log(chalk.gray(`  Location: ${config.database_path}`));
    console.log(chalk.gray(`  Total lyrics: ${stats.total}`));
    if (stats.oldestDate) {
      console.log(chalk.gray(`  Oldest entry: ${stats.oldestDate}`));
    }
  } catch (error) {
    console.log(formatError(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
  } finally {
    if (db) {
      db.close();
    }
  }

  // Save config
  console.log(chalk.cyan('\nSaving configuration...'));
  try {
    saveConfig(config);
    console.log(formatSuccess('Configuration saved'));
  } catch (error) {
    console.log(formatError(`Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }

  // Summary
  console.log(chalk.cyan('\n' + '─'.repeat(40)));
  if (isConnected) {
    console.log(formatSuccess('Setup complete! You can now start adding lyrics.'));
    console.log(chalk.gray('\nQuick start:'));
    console.log(chalk.white('  lyric add "your lyric text here"'));
    console.log(chalk.white('  lyric list'));
    console.log(chalk.white('  lyric suggest "find matching lyrics"'));
  } else {
    console.log(formatWarning('Setup complete with warnings.'));
    console.log(chalk.gray('\nStart Ollama to enable AI features, then run setup again.'));
  }
}
