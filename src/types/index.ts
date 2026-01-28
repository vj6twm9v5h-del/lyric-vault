export interface Lyric {
  id: number;
  lyric_text: string;
  created_at: string;
  themes: string[];
  rhyme_patterns: string[];
  mood: string;
  imagery_tags: string[];
  raw_analysis: string;
}

export interface LyricAnalysis {
  themes: string[];
  rhyme_patterns: string[];
  mood: string;
  imagery_tags: string[];
}

export interface LyricSuggestion {
  lyric: Lyric;
  match_score: number;
  match_reasons: string[];
  suggested_adaptation?: string;
}

export interface SearchQuery {
  theme?: string;
  rhyme?: string;
  mood?: string;
}

export interface Config {
  ollama_model: string;
  ollama_url: string;
  database_path: string;
}
