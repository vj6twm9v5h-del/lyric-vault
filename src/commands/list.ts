import { LyricDatabase } from '../db/database.js';
import { formatLyric, formatWarning, formatHeader, formatDivider } from '../utils/formatting.js';

export interface ListOptions {
  recent?: number;
}

/**
 * List recent lyrics from the vault
 */
export function listCommand(options: ListOptions): void {
  const db = new LyricDatabase();

  try {
    const limit = options.recent ?? 10;
    const lyrics = db.getRecentLyrics(limit);

    if (lyrics.length === 0) {
      console.log(formatWarning('No lyrics found in your vault.'));
      console.log('Add some lyrics with: lyric add "your lyric here"');
      return;
    }

    console.log(formatHeader(`Recent Lyrics (${lyrics.length})`));

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
