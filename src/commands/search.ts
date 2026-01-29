import { LyricDatabase } from '../db/database.js';
import { SearchQuery } from '../types/index.js';
import { formatLyric, formatWarning, formatHeader, formatDivider } from '../utils/formatting.js';
import chalk from 'chalk';

/**
 * Parse a search query string into a SearchQuery object.
 * Supports format: "theme:X rhyme:Y mood:Z"
 */
function parseSearchQuery(queryString: string): SearchQuery {
  const query: SearchQuery = {};

  // Match patterns like "theme:value" or "theme:multi word value"
  // Handle both quoted and unquoted values
  const patterns = [
    { key: 'theme', regex: /theme:(?:"([^"]+)"|(\S+))/gi },
    { key: 'rhyme', regex: /rhyme:(?:"([^"]+)"|(\S+))/gi },
    { key: 'mood', regex: /mood:(?:"([^"]+)"|(\S+))/gi }
  ];

  for (const { key, regex } of patterns) {
    const match = regex.exec(queryString);
    if (match) {
      // Use quoted value if present, otherwise use unquoted
      const value = match[1] || match[2];
      query[key as keyof SearchQuery] = value;
    }
  }

  return query;
}

/**
 * Format the active search filters for display
 */
function formatActiveFilters(query: SearchQuery): string {
  const filters: string[] = [];

  if (query.theme) {
    filters.push(chalk.cyan('theme:') + query.theme);
  }
  if (query.rhyme) {
    filters.push(chalk.cyan('rhyme:') + query.rhyme);
  }
  if (query.mood) {
    filters.push(chalk.cyan('mood:') + query.mood);
  }

  return filters.length > 0 ? filters.join(' ') : chalk.gray('(no filters)');
}

/**
 * Search command - filter lyrics by theme, rhyme, or mood
 */
export function searchCommand(queryString: string): void {
  const db = new LyricDatabase();

  try {
    const query = parseSearchQuery(queryString);

    // Check if any filters were provided
    if (!query.theme && !query.rhyme && !query.mood) {
      console.log(formatWarning('No valid search filters found.'));
      console.log('');
      console.log(chalk.cyan('Usage:'));
      console.log('  lyric search "theme:love"');
      console.log('  lyric search "rhyme:ight"');
      console.log('  lyric search "mood:sad"');
      console.log('  lyric search "theme:love mood:melancholic"');
      return;
    }

    const lyrics = db.searchLyrics(query);

    console.log(formatHeader(`Search Results (${lyrics.length})`));
    console.log(chalk.gray('Filters: ') + formatActiveFilters(query));
    console.log('');

    if (lyrics.length === 0) {
      console.log(formatWarning('No lyrics match your search criteria.'));
      console.log('');
      console.log('Try:');
      console.log('  - Using broader search terms');
      console.log('  - Checking for typos in your query');
      console.log('  - Running "lyric list" to see what\'s in your vault');
      return;
    }

    lyrics.forEach((lyric, index) => {
      console.log(formatLyric(lyric));
      if (index < lyrics.length - 1) {
        console.log(formatDivider());
      }
    });

    console.log('');
  } finally {
    db.close();
  }
}
