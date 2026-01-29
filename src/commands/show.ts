import { LyricDatabase } from '../db/database.js';
import { formatLyric, formatError, formatHeader } from '../utils/formatting.js';

/**
 * Show full details of a specific lyric by ID
 */
export function showCommand(id: string): void {
  const db = new LyricDatabase();

  try {
    const lyricId = parseInt(id, 10);

    if (isNaN(lyricId) || lyricId <= 0) {
      console.log(formatError(`Invalid ID: "${id}". Please provide a positive integer.`));
      return;
    }

    const lyric = db.getLyric(lyricId);

    if (!lyric) {
      console.log(formatError(`Lyric #${lyricId} not found.`));
      console.log('Use "lyric list" to see all lyrics in your vault.');
      return;
    }

    console.log(formatHeader(`Lyric #${lyricId}`));
    console.log(formatLyric(lyric));
    console.log('');
  } finally {
    db.close();
  }
}
