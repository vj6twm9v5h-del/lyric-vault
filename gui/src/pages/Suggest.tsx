import { useState } from 'react';
import styles from './Suggest.module.css';

interface Lyric {
  id: number;
  lyric_text: string;
  themes: string[];
  mood: string;
}

interface Suggestion {
  lyric: Lyric;
  match_score: number;
  match_reasons: string[];
  suggested_adaptation?: string;
}

export default function Suggest() {
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const results = await window.lyricVault.getSuggestions(inputText);
      setSuggestions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Find Matching Lyrics</h1>
        <p className={styles.subtitle}>
          Enter your current lyric and get AI-powered suggestions from your vault
        </p>
      </header>

      <div className={styles.inputSection}>
        <label className={styles.label}>What are you working on?</label>
        <textarea
          className={styles.textarea}
          placeholder="Enter your lyric idea..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
        />
        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={!inputText.trim() || loading}
        >
          {loading ? (
            <>
              <span className={styles.spinner} />
              Finding matches...
            </>
          ) : (
            <>
              <SparkleIcon />
              Find Suggestions
            </>
          )}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinnerLarge} />
          <p>Analyzing your lyric and finding matches...</p>
          <p className={styles.loadingHint}>This may take a moment</p>
        </div>
      )}

      {!loading && searched && suggestions.length === 0 && !error && (
        <div className={styles.emptyState}>
          <p>No matching lyrics found in your vault</p>
          <p className={styles.emptyHint}>Try adding more lyrics with varied themes and moods</p>
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className={styles.results}>
          <h2>Found {suggestions.length} match{suggestions.length !== 1 ? 'es' : ''}</h2>
          <div className={styles.suggestionsList}>
            {suggestions.map((suggestion, index) => (
              <div key={suggestion.lyric.id} className={styles.suggestionCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.matchScore}>
                    <div
                      className={styles.scoreBar}
                      style={{ width: `${suggestion.match_score * 100}%` }}
                    />
                    <span>{Math.round(suggestion.match_score * 100)}% Match</span>
                  </div>
                  <span className={styles.rank}>#{index + 1}</span>
                </div>

                <p className={styles.lyricText}>"{suggestion.lyric.lyric_text}"</p>

                <div className={styles.matchReasons}>
                  <label>Why it matches:</label>
                  <ul>
                    {suggestion.match_reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>

                {suggestion.suggested_adaptation && (
                  <div className={styles.adaptation}>
                    <label>Suggested adaptation:</label>
                    <p>"{suggestion.suggested_adaptation}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
