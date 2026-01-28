import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Lyric, LyricAnalysis, SearchQuery } from '../types/index.js';

const DEFAULT_DB_PATH = path.join(os.homedir(), '.lyric-vault', 'lyrics.db');

export class LyricDatabase {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath: string = DEFAULT_DB_PATH) {
    this.dbPath = dbPath;

    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.initialize();
  }

  /**
   * Initialize the database with schema
   */
  initialize(): void {
    // Create lyrics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS lyrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lyric_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        themes TEXT,
        rhyme_patterns TEXT,
        mood TEXT,
        imagery_tags TEXT,
        raw_analysis TEXT
      )
    `);

    // Create index for date-based queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_created_at ON lyrics(created_at)
    `);
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Convert a database row to a Lyric object
   */
  private rowToLyric(row: any): Lyric {
    return {
      id: row.id,
      lyric_text: row.lyric_text,
      created_at: row.created_at,
      themes: JSON.parse(row.themes || '[]'),
      rhyme_patterns: JSON.parse(row.rhyme_patterns || '[]'),
      mood: row.mood || '',
      imagery_tags: JSON.parse(row.imagery_tags || '[]'),
      raw_analysis: row.raw_analysis || ''
    };
  }

  /**
   * Insert a new lyric with analysis
   */
  insertLyric(lyricText: string, analysis: LyricAnalysis, rawAnalysis: string): number {
    const stmt = this.db.prepare(`
      INSERT INTO lyrics (lyric_text, themes, rhyme_patterns, mood, imagery_tags, raw_analysis)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      lyricText,
      JSON.stringify(analysis.themes),
      JSON.stringify(analysis.rhyme_patterns),
      analysis.mood,
      JSON.stringify(analysis.imagery_tags),
      rawAnalysis
    );

    return Number(result.lastInsertRowid);
  }

  /**
   * Get a lyric by ID
   */
  getLyric(id: number): Lyric | null {
    const stmt = this.db.prepare('SELECT * FROM lyrics WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.rowToLyric(row) : null;
  }

  /**
   * Get recent lyrics
   */
  getRecentLyrics(limit: number = 10): Lyric[] {
    const stmt = this.db.prepare(
      'SELECT * FROM lyrics ORDER BY created_at DESC LIMIT ?'
    );
    const rows = stmt.all(limit) as any[];
    return rows.map(row => this.rowToLyric(row));
  }

  /**
   * Get all lyrics
   */
  getAllLyrics(): Lyric[] {
    const stmt = this.db.prepare('SELECT * FROM lyrics ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToLyric(row));
  }

  /**
   * Search lyrics by theme, rhyme, or mood
   */
  searchLyrics(query: SearchQuery): Lyric[] {
    let sql = 'SELECT * FROM lyrics WHERE 1=1';
    const params: any[] = [];

    if (query.theme) {
      sql += ' AND themes LIKE ?';
      params.push(`%${query.theme}%`);
    }

    if (query.rhyme) {
      sql += ' AND rhyme_patterns LIKE ?';
      params.push(`%${query.rhyme}%`);
    }

    if (query.mood) {
      sql += ' AND mood LIKE ?';
      params.push(`%${query.mood}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.rowToLyric(row));
  }

  /**
   * Delete a lyric by ID
   */
  deleteLyric(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM lyrics WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get database statistics
   */
  getStats(): { total: number; oldestDate: string | null } {
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM lyrics');
    const countRow = countStmt.get() as { count: number };

    const oldestStmt = this.db.prepare(
      'SELECT created_at FROM lyrics ORDER BY created_at ASC LIMIT 1'
    );
    const oldestRow = oldestStmt.get() as { created_at: string } | undefined;

    return {
      total: countRow.count,
      oldestDate: oldestRow?.created_at || null
    };
  }
}
