import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// Types (matching src/types/index.ts)
// ============================================================================

interface Lyric {
  id: number;
  lyric_text: string;
  created_at: string;
  themes: string[];
  rhyme_patterns: string[];
  mood: string;
  imagery_tags: string[];
  raw_analysis: string;
}

interface LyricAnalysis {
  themes: string[];
  rhyme_patterns: string[];
  mood: string;
  imagery_tags: string[];
}

interface LyricSuggestion {
  lyric: Lyric;
  match_score: number;
  match_reasons: string[];
  suggested_adaptation?: string;
}

interface SearchQuery {
  theme?: string;
  rhyme?: string;
  mood?: string;
}

interface Config {
  ollama_model: string;
  ollama_url: string;
  database_path: string;
}

// ============================================================================
// Constants
// ============================================================================

const CONFIG_DIR = path.join(os.homedir(), '.lyric-vault');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const DEFAULT_DB_PATH = path.join(CONFIG_DIR, 'lyrics.db');

const DEFAULT_CONFIG: Config = {
  ollama_model: 'llama3.2',
  ollama_url: 'http://localhost:11434',
  database_path: DEFAULT_DB_PATH,
};

// ============================================================================
// Config Functions
// ============================================================================

function loadConfig(): Config {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG };
    }
    const fileContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const loadedConfig = JSON.parse(fileContent) as Partial<Config>;
    return { ...DEFAULT_CONFIG, ...loadedConfig };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// ============================================================================
// Database Functions
// ============================================================================

function getDatabase(): Database.Database {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const db = new Database(DEFAULT_DB_PATH);

  // Initialize schema
  db.exec(`
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
  db.exec(`CREATE INDEX IF NOT EXISTS idx_created_at ON lyrics(created_at)`);

  return db;
}

function rowToLyric(row: any): Lyric {
  return {
    id: row.id,
    lyric_text: row.lyric_text,
    created_at: row.created_at,
    themes: JSON.parse(row.themes || '[]'),
    rhyme_patterns: JSON.parse(row.rhyme_patterns || '[]'),
    mood: row.mood || '',
    imagery_tags: JSON.parse(row.imagery_tags || '[]'),
    raw_analysis: row.raw_analysis || '',
  };
}

// ============================================================================
// Ollama Functions
// ============================================================================

function buildAnalysisPrompt(lyricText: string): string {
  return `You are analyzing a lyric fragment. Return ONLY valid JSON (no markdown, no explanation):
{
  "themes": ["theme1", "theme2", "theme3", "theme4"],
  "rhyme_patterns": ["ending1", "ending2"],
  "mood": "brief mood description",
  "imagery_tags": ["tag1", "tag2", "tag3"]
}

Lyric: "${lyricText}"

Guidelines:
- Themes: Core concepts/emotions (max 4). Examples: love, loss, freedom, nostalgia
- Rhyme patterns: Last 3-4 characters of words that could rhyme
- Mood: 2-3 word emotional tone. Examples: "melancholic, reflective"
- Imagery tags: Sensory elements. Examples: visual, auditory, nature

Return ONLY the JSON.`;
}

function buildSuggestionPrompt(
  userLyric: string,
  userAnalysis: LyricAnalysis,
  storedLyric: Lyric,
  matchReasons: string[]
): string {
  return `You are a creative lyric writer helping adapt a stored lyric fragment to fit with a new lyric.

CURRENT LYRIC (what the user is writing):
"${userLyric}"

Current lyric analysis:
- Themes: ${userAnalysis.themes.join(', ') || 'none identified'}
- Mood: ${userAnalysis.mood || 'unknown'}
- Rhyme patterns: ${userAnalysis.rhyme_patterns.join(', ') || 'none identified'}

STORED LYRIC (from vault):
"${storedLyric.lyric_text}"

Stored lyric metadata:
- Themes: ${storedLyric.themes.join(', ') || 'none'}
- Mood: ${storedLyric.mood || 'unknown'}
- Rhyme patterns: ${storedLyric.rhyme_patterns.join(', ') || 'none'}

Match reasons: ${matchReasons.join(', ')}

TASK:
Create a short adaptation of the stored lyric that:
1. Maintains the essence of the stored lyric's imagery and emotion
2. Matches the rhyme scheme of the current lyric where possible
3. Flows naturally as a companion line or verse to the current lyric
4. Preserves the mood and thematic connection

Return ONLY the adapted lyric text (1-2 lines), no explanation or quotes.`;
}

function parseAnalysisResponse(rawResponse: string): LyricAnalysis {
  let jsonStr = rawResponse.trim();

  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  const parsed = JSON.parse(jsonStr);
  return {
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    rhyme_patterns: Array.isArray(parsed.rhyme_patterns) ? parsed.rhyme_patterns : [],
    mood: typeof parsed.mood === 'string' ? parsed.mood : 'unknown',
    imagery_tags: Array.isArray(parsed.imagery_tags) ? parsed.imagery_tags : [],
  };
}

async function analyzeLyric(
  text: string,
  config: Config
): Promise<{ analysis: LyricAnalysis; rawResponse: string }> {
  const prompt = buildAnalysisPrompt(text);

  const response = await axios.post(
    `${config.ollama_url}/api/generate`,
    {
      model: config.ollama_model,
      prompt: prompt,
      stream: false,
      options: { temperature: 0.3 },
    },
    { timeout: 60000 }
  );

  const rawResponse = response.data.response;
  const analysis = parseAnalysisResponse(rawResponse);
  return { analysis, rawResponse };
}

async function generateText(prompt: string, config: Config): Promise<string> {
  const response = await axios.post(
    `${config.ollama_url}/api/generate`,
    {
      model: config.ollama_model,
      prompt: prompt,
      stream: false,
      options: { temperature: 0.7 },
    },
    { timeout: 60000 }
  );
  return response.data.response;
}

// ============================================================================
// Rhyme Matching Functions
// ============================================================================

function rhymeMatch(pattern1: string, pattern2: string): boolean {
  const p1 = pattern1.toLowerCase();
  const p2 = pattern2.toLowerCase();

  if (p1 === p2) return true;

  const ending2 = p1.slice(-2);
  const ending3 = p1.slice(-3);
  if (p2.endsWith(ending3) || p2.endsWith(ending2)) return true;

  const vowels = /[aeiou]+/g;
  const p1Vowels = p1.match(vowels)?.join('') || '';
  const p2Vowels = p2.match(vowels)?.join('') || '';

  if (p1Vowels.length >= 2 && p2Vowels.length >= 2) {
    const p1LastVowels = p1Vowels.slice(-2);
    const p2LastVowels = p2Vowels.slice(-2);
    if (p1LastVowels === p2LastVowels) return true;
  }

  return false;
}

function calculateRhymeScore(patterns1: string[], patterns2: string[]): number {
  if (patterns1.length === 0 || patterns2.length === 0) return 0;

  let matches = 0;
  const checked = new Set<number>();

  for (const p1 of patterns1) {
    for (let i = 0; i < patterns2.length; i++) {
      if (!checked.has(i) && rhymeMatch(p1, patterns2[i])) {
        matches++;
        checked.add(i);
        break;
      }
    }
  }

  const minLength = Math.min(patterns1.length, patterns2.length);
  return Math.min(matches / minLength, 1);
}

function calculateMatchScore(
  inputAnalysis: LyricAnalysis,
  storedLyric: Lyric
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let totalScore = 0;
  let weights = 0;

  // Theme matching (35%)
  const themeWeight = 0.35;
  const sharedThemes = inputAnalysis.themes.filter((theme) =>
    storedLyric.themes.some(
      (storedTheme) =>
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

  // Rhyme matching (30%)
  const rhymeWeight = 0.3;
  const rhymeScore = calculateRhymeScore(inputAnalysis.rhyme_patterns, storedLyric.rhyme_patterns);
  if (rhymeScore > 0) {
    totalScore += rhymeScore * rhymeWeight;
    if (rhymeScore > 0.3) reasons.push('Compatible rhyme patterns');
  }
  weights += rhymeWeight;

  // Mood matching (25%)
  const moodWeight = 0.25;
  if (inputAnalysis.mood && storedLyric.mood) {
    const inputMoodWords = inputAnalysis.mood.toLowerCase().split(/[\s,]+/);
    const storedMoodWords = storedLyric.mood.toLowerCase().split(/[\s,]+/);
    const sharedMoodWords = inputMoodWords.filter((word) =>
      storedMoodWords.some((storedWord) => storedWord.includes(word) || word.includes(storedWord))
    );
    if (sharedMoodWords.length > 0) {
      const moodScore = Math.min(sharedMoodWords.length / Math.max(inputMoodWords.length, 1), 1);
      totalScore += moodScore * moodWeight;
      reasons.push(`Similar mood: ${storedLyric.mood}`);
    }
  }
  weights += moodWeight;

  // Imagery matching (10%)
  const imageryWeight = 0.1;
  const sharedImagery = inputAnalysis.imagery_tags.filter((tag) =>
    storedLyric.imagery_tags.some(
      (storedTag) =>
        storedTag.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(storedTag.toLowerCase())
    )
  );
  if (sharedImagery.length > 0) {
    const imageryScore = Math.min(
      sharedImagery.length / Math.max(inputAnalysis.imagery_tags.length, 1),
      1
    );
    totalScore += imageryScore * imageryWeight;
    reasons.push(`Matching imagery: ${sharedImagery.join(', ')}`);
  }
  weights += imageryWeight;

  return { score: weights > 0 ? totalScore / weights : 0, reasons };
}

// ============================================================================
// IPC Handler Registration
// ============================================================================

export function registerIpcHandlers(): void {
  // ========== Database Handlers ==========

  ipcMain.handle('db:getAllLyrics', async () => {
    const db = getDatabase();
    try {
      const stmt = db.prepare('SELECT * FROM lyrics ORDER BY created_at DESC');
      const rows = stmt.all() as any[];
      return rows.map(rowToLyric);
    } finally {
      db.close();
    }
  });

  ipcMain.handle('db:getRecentLyrics', async (_, limit: number) => {
    const db = getDatabase();
    try {
      const stmt = db.prepare('SELECT * FROM lyrics ORDER BY created_at DESC LIMIT ?');
      const rows = stmt.all(limit) as any[];
      return rows.map(rowToLyric);
    } finally {
      db.close();
    }
  });

  ipcMain.handle('db:getLyric', async (_, id: number) => {
    const db = getDatabase();
    try {
      const stmt = db.prepare('SELECT * FROM lyrics WHERE id = ?');
      const row = stmt.get(id);
      return row ? rowToLyric(row) : null;
    } finally {
      db.close();
    }
  });

  ipcMain.handle('db:deleteLyric', async (_, id: number) => {
    const db = getDatabase();
    try {
      const stmt = db.prepare('DELETE FROM lyrics WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } finally {
      db.close();
    }
  });

  ipcMain.handle('db:searchLyrics', async (_, query: SearchQuery) => {
    const db = getDatabase();
    try {
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
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params) as any[];
      return rows.map(rowToLyric);
    } finally {
      db.close();
    }
  });

  ipcMain.handle('db:getStats', async () => {
    const db = getDatabase();
    try {
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM lyrics');
      const countRow = countStmt.get() as { count: number };

      const oldestStmt = db.prepare(
        'SELECT created_at FROM lyrics ORDER BY created_at ASC LIMIT 1'
      );
      const oldestRow = oldestStmt.get() as { created_at: string } | undefined;

      return {
        total: countRow.count,
        oldestDate: oldestRow?.created_at || null,
      };
    } finally {
      db.close();
    }
  });

  // ========== AI Handlers ==========

  ipcMain.handle('ai:addLyricWithAnalysis', async (_, text: string) => {
    const config = loadConfig();
    const db = getDatabase();
    try {
      const { analysis, rawResponse } = await analyzeLyric(text, config);

      const stmt = db.prepare(`
        INSERT INTO lyrics (lyric_text, themes, rhyme_patterns, mood, imagery_tags, raw_analysis)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        text,
        JSON.stringify(analysis.themes),
        JSON.stringify(analysis.rhyme_patterns),
        analysis.mood,
        JSON.stringify(analysis.imagery_tags),
        rawResponse
      );

      return { id: Number(result.lastInsertRowid), analysis };
    } finally {
      db.close();
    }
  });

  ipcMain.handle('ai:analyzeLyric', async (_, text: string) => {
    const config = loadConfig();
    return analyzeLyric(text, config);
  });

  ipcMain.handle('ai:testConnection', async () => {
    const config = loadConfig();
    try {
      const response = await axios.get(`${config.ollama_url}/api/tags`, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  });

  ipcMain.handle('ai:checkModelAvailable', async () => {
    const config = loadConfig();
    try {
      const response = await axios.get(`${config.ollama_url}/api/tags`, { timeout: 5000 });
      const models: string[] =
        response.data?.models?.map((m: { name: string }) => m.name) ?? [];
      const available = models.some((name) => name.startsWith(config.ollama_model));
      return { available, models };
    } catch {
      return { available: false, models: [] };
    }
  });

  ipcMain.handle('ai:getSuggestions', async (_, text: string) => {
    const config = loadConfig();
    const db = getDatabase();

    try {
      // Get all lyrics
      const stmt = db.prepare('SELECT * FROM lyrics ORDER BY created_at DESC');
      const rows = stmt.all() as any[];
      const allLyrics = rows.map(rowToLyric);

      if (allLyrics.length === 0) {
        return [];
      }

      // Analyze input
      const { analysis: inputAnalysis } = await analyzeLyric(text, config);

      // Calculate match scores
      const suggestions: LyricSuggestion[] = [];
      for (const lyric of allLyrics) {
        const { score, reasons } = calculateMatchScore(inputAnalysis, lyric);
        if (score > 0.1 && reasons.length > 0) {
          suggestions.push({
            lyric,
            match_score: score,
            match_reasons: reasons,
          });
        }
      }

      // Sort by score
      suggestions.sort((a, b) => b.match_score - a.match_score);

      // Get top 5, generate adaptations for top 3
      const topSuggestions = suggestions.slice(0, 5);
      const adaptedSuggestions: LyricSuggestion[] = [];

      for (let i = 0; i < Math.min(3, topSuggestions.length); i++) {
        const suggestion = topSuggestions[i];
        try {
          const prompt = buildSuggestionPrompt(
            text,
            inputAnalysis,
            suggestion.lyric,
            suggestion.match_reasons
          );
          let adaptation = await generateText(prompt, config);
          adaptation = adaptation.trim();
          if (adaptation.startsWith('"') && adaptation.endsWith('"')) {
            adaptation = adaptation.slice(1, -1);
          }
          adaptedSuggestions.push({ ...suggestion, suggested_adaptation: adaptation });
        } catch {
          adaptedSuggestions.push(suggestion);
        }
      }

      // Merge with remaining suggestions
      return [...adaptedSuggestions, ...topSuggestions.slice(3)];
    } finally {
      db.close();
    }
  });

  // ========== Config Handlers ==========

  ipcMain.handle('config:get', async () => {
    return loadConfig();
  });

  ipcMain.handle('config:save', async (_, config: Config) => {
    saveConfig(config);
  });
}
