-- Lyric Vault Database Schema
-- SQLite schema for storing lyric fragments with AI-generated analysis

CREATE TABLE IF NOT EXISTS lyrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lyric_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  themes TEXT,
  rhyme_patterns TEXT,
  mood TEXT,
  imagery_tags TEXT,
  raw_analysis TEXT
);

-- Index for efficient retrieval by date
CREATE INDEX IF NOT EXISTS idx_created_at ON lyrics(created_at);
