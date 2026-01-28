import { Lyric, LyricAnalysis } from '../types/index.js';

/**
 * Generates an analysis prompt for a lyric fragment.
 * Returns ONLY valid JSON with themes, rhyme patterns, mood, and imagery tags.
 *
 * @param lyricText - The lyric text to analyze
 * @returns The prompt string for Ollama
 */
export const ANALYSIS_PROMPT = (lyricText: string): string => `You are analyzing a lyric fragment. Return ONLY valid JSON (no markdown, no explanation):
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

/**
 * Generates a suggestion prompt for adapting a stored lyric to match the user's current context.
 * The AI should create an adaptation that flows naturally from/with the user's lyric.
 *
 * @param userLyric - The lyric the user is currently working on
 * @param userAnalysis - Analysis of the user's lyric (themes, mood, etc.)
 * @param storedLyric - A previously stored lyric that matches
 * @param matchReasons - Why this lyric was selected as a match
 * @returns The prompt string for Ollama
 */
export const SUGGESTION_PROMPT = (
  userLyric: string,
  userAnalysis: LyricAnalysis,
  storedLyric: Lyric,
  matchReasons: string[]
): string => `You are a creative lyric writer helping adapt a stored lyric fragment to fit with a new lyric.

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

/**
 * Generates a prompt for suggesting how to continue or develop a lyric.
 *
 * @param lyricText - The lyric to suggest continuations for
 * @param analysis - Analysis of the lyric
 * @returns The prompt string for Ollama
 */
export const CONTINUATION_PROMPT = (lyricText: string, analysis: LyricAnalysis): string => `You are a creative lyric writer. Based on the following lyric fragment, suggest a natural continuation.

LYRIC:
"${lyricText}"

Analysis:
- Themes: ${analysis.themes.join(', ') || 'none identified'}
- Mood: ${analysis.mood || 'unknown'}
- Rhyme patterns: ${analysis.rhyme_patterns.join(', ') || 'none identified'}
- Imagery: ${analysis.imagery_tags.join(', ') || 'none identified'}

Suggest a 1-2 line continuation that:
1. Maintains consistent theme and mood
2. Attempts to rhyme with the established patterns
3. Extends the imagery naturally

Return ONLY the continuation (1-2 lines), no explanation.`;
