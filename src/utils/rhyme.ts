/**
 * Rhyme Pattern Utilities
 *
 * Provides functions for extracting rhyme patterns from text,
 * matching rhymes, and calculating rhyme scores between lyrics.
 */

/**
 * Extract the ending sounds (rhyme patterns) from words in text.
 * Returns the last 3-4 characters of significant words that could rhyme.
 *
 * @param text - The lyric text to extract rhyme patterns from
 * @returns Array of ending sounds (lowercase)
 */
export function extractRhymePatterns(text: string): string[] {
  // Split text into words, remove punctuation, filter short words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s']/g, '') // Keep apostrophes for contractions
    .split(/\s+/)
    .filter(word => word.length >= 3); // Only consider words with 3+ chars

  const patterns: string[] = [];
  const seen = new Set<string>();

  for (const word of words) {
    // Get the last 3-4 characters as the rhyme pattern
    // Prefer 4 chars for more distinctive matching, fallback to 3
    const ending = word.length >= 4
      ? word.slice(-4)
      : word.slice(-3);

    // Avoid duplicates
    if (!seen.has(ending)) {
      seen.add(ending);
      patterns.push(ending);
    }
  }

  return patterns;
}

/**
 * Check if two rhyme patterns match (sound similar).
 * Patterns match if:
 * - They're identical
 * - They end with the same 2-3 characters
 * - They have similar vowel patterns
 *
 * @param pattern1 - First rhyme pattern
 * @param pattern2 - Second rhyme pattern
 * @returns True if the patterns rhyme
 */
export function rhymeMatch(pattern1: string, pattern2: string): boolean {
  const p1 = pattern1.toLowerCase();
  const p2 = pattern2.toLowerCase();

  // Exact match
  if (p1 === p2) {
    return true;
  }

  // Check if they share the same ending (last 2-3 chars)
  const ending2 = p1.slice(-2);
  const ending3 = p1.slice(-3);

  if (p2.endsWith(ending3) || p2.endsWith(ending2)) {
    return true;
  }

  // Check vowel sound matching (simplified phonetic matching)
  const vowels = /[aeiou]+/g;
  const p1Vowels = p1.match(vowels)?.join('') || '';
  const p2Vowels = p2.match(vowels)?.join('') || '';

  // If they have the same vowel pattern at the end, they might rhyme
  if (p1Vowels.length >= 2 && p2Vowels.length >= 2) {
    const p1LastVowels = p1Vowels.slice(-2);
    const p2LastVowels = p2Vowels.slice(-2);
    if (p1LastVowels === p2LastVowels) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate a rhyme score between two arrays of rhyme patterns.
 * The score represents how well the patterns rhyme with each other.
 *
 * @param patterns1 - First array of rhyme patterns
 * @param patterns2 - Second array of rhyme patterns
 * @returns Score between 0 and 1 (0 = no matches, 1 = perfect rhymes)
 */
export function calculateRhymeScore(patterns1: string[], patterns2: string[]): number {
  if (patterns1.length === 0 || patterns2.length === 0) {
    return 0;
  }

  let matches = 0;
  const checked = new Set<number>(); // Track which patterns2 indices were matched

  for (const p1 of patterns1) {
    for (let i = 0; i < patterns2.length; i++) {
      if (!checked.has(i) && rhymeMatch(p1, patterns2[i])) {
        matches++;
        checked.add(i);
        break; // Move to next p1 after finding a match
      }
    }
  }

  // Calculate score based on proportion of matches
  // Use the smaller array length as denominator to favor quality matches
  const minLength = Math.min(patterns1.length, patterns2.length);
  const score = matches / minLength;

  return Math.min(score, 1); // Cap at 1
}

/**
 * Find the best rhyming words from text that match a given pattern.
 * Useful for showing which words rhyme.
 *
 * @param text - The text to search for rhyming words
 * @param targetPattern - The pattern to match against
 * @returns Array of words from text that rhyme with the target pattern
 */
export function findRhymingWords(text: string, targetPattern: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s']/g, '')
    .split(/\s+/)
    .filter(word => word.length >= 3);

  const rhyming: string[] = [];
  const seen = new Set<string>();

  for (const word of words) {
    const ending = word.length >= 4 ? word.slice(-4) : word.slice(-3);

    if (!seen.has(word) && rhymeMatch(ending, targetPattern)) {
      seen.add(word);
      rhyming.push(word);
    }
  }

  return rhyming;
}
