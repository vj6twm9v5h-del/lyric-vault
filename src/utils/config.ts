import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config } from '../types/index.js';

const CONFIG_DIR = path.join(os.homedir(), '.lyric-vault');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: Config = {
  ollama_model: 'llama3.2',
  ollama_url: 'http://localhost:11434',
  database_path: path.join(CONFIG_DIR, 'lyrics.db')
};

/**
 * Loads configuration from ~/.lyric-vault/config.json
 * Returns default config if file doesn't exist
 */
export function loadConfig(): Config {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG };
    }

    const fileContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const loadedConfig = JSON.parse(fileContent) as Partial<Config>;

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_CONFIG,
      ...loadedConfig
    };
  } catch (error) {
    // Return defaults if any error occurs during loading
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Saves configuration to ~/.lyric-vault/config.json
 * Creates the config directory if it doesn't exist
 */
export function saveConfig(config: Config): void {
  // Ensure config directory exists
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Write config as formatted JSON
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Returns the default configuration
 */
export function getDefaultConfig(): Config {
  return { ...DEFAULT_CONFIG };
}

/**
 * Returns the config directory path
 */
export function getConfigDir(): string {
  return CONFIG_DIR;
}

/**
 * Returns the config file path
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}
