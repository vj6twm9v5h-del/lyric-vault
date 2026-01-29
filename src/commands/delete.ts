import { LyricDatabase } from '../db/database.js';
import { formatSuccess, formatError } from '../utils/formatting.js';

/**
 * Delete a lyric from the vault by ID
 */
export function deleteCommand(id: string): void {
  const db = new LyricDatabase();

  try {
    const lyricId = parseInt(id, 10);

    if (isNaN(lyricId) || lyricId <= 0) {
      console.log(formatError(`Invalid ID: "${id}". Please provide a positive integer.`));
      return;
    }

    // Check if lyric exists before deleting
    const lyric = db.getLyric(lyricId);
    if (!lyric) {
      console.log(formatError(`Lyric #${lyricId} not found.`));
      console.log('Use "lyric list" to see all lyrics in your vault.');
      return;
    }

    // Delete the lyric
    const deleted = db.deleteLyric(lyricId);

    if (deleted) {
      console.log(formatSuccess(`Lyric #${lyricId} deleted.`));
      console.log(`  "${lyric.lyric_text.substring(0, 50)}${lyric.lyric_text.length > 50 ? '...' : ''}"`);
    } else {
      console.log(formatError(`Failed to delete lyric #${lyricId}.`));
    }
  } finally {
    db.close();
  }
}
