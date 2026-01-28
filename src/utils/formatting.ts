import chalk from 'chalk';
import { Lyric, LyricSuggestion } from '../types/index.js';

/**
 * Format a lyric for terminal display
 */
export function formatLyric(lyric: Lyric): string {
  const lines: string[] = [];

  // Header with ID and date
  lines.push(chalk.cyan.bold(`#${lyric.id}`) + chalk.gray(` (${formatDate(lyric.created_at)})`));

  // Lyric text
  lines.push(chalk.white(`"${lyric.lyric_text}"`));

  // Metadata
  if (lyric.themes && lyric.themes.length > 0) {
    lines.push(chalk.cyan('Themes: ') + lyric.themes.join(', '));
  }

  if (lyric.mood) {
    lines.push(chalk.cyan('Mood: ') + lyric.mood);
  }

  if (lyric.rhyme_patterns && lyric.rhyme_patterns.length > 0) {
    lines.push(chalk.cyan('Rhymes: ') + lyric.rhyme_patterns.join(', '));
  }

  if (lyric.imagery_tags && lyric.imagery_tags.length > 0) {
    lines.push(chalk.cyan('Imagery: ') + lyric.imagery_tags.join(', '));
  }

  return lines.join('\n');
}

/**
 * Format a lyric suggestion for terminal display
 */
export function formatSuggestion(suggestion: LyricSuggestion, index?: number): string {
  const lines: string[] = [];

  // Header with ranking and score
  const rankPrefix = index !== undefined ? `${index + 1}. ` : '';
  const scorePercent = Math.round(suggestion.match_score * 100);
  lines.push(chalk.yellow.bold(`${rankPrefix}Match: ${scorePercent}%`));

  // Original lyric
  lines.push(chalk.white(`"${suggestion.lyric.lyric_text}"`));
  lines.push(chalk.gray(`  ID: #${suggestion.lyric.id} | ${formatDate(suggestion.lyric.created_at)}`));

  // Match reasons
  if (suggestion.match_reasons && suggestion.match_reasons.length > 0) {
    lines.push(chalk.cyan('Why it matches: ') + suggestion.match_reasons.join(', '));
  }

  // Suggested adaptation
  if (suggestion.suggested_adaptation) {
    lines.push(chalk.green.bold('Suggested adaptation:'));
    lines.push(chalk.green(`  "${suggestion.suggested_adaptation}"`));
  }

  return lines.join('\n');
}

/**
 * Format a success message
 */
export function formatSuccess(message: string): string {
  return chalk.green('✓ ') + message;
}

/**
 * Format an error message
 */
export function formatError(message: string): string {
  return chalk.red('✗ ') + message;
}

/**
 * Format a warning message
 */
export function formatWarning(message: string): string {
  return chalk.yellow('⚠ ') + message;
}

/**
 * Format a date string for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a section header
 */
export function formatHeader(title: string): string {
  return chalk.bold.cyan(`\n${title}\n${'─'.repeat(title.length)}`);
}

/**
 * Format a divider line
 */
export function formatDivider(): string {
  return chalk.gray('─'.repeat(40));
}
