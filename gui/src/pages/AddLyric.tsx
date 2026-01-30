import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AddLyric.module.css';

interface LyricAnalysis {
  themes: string[];
  rhyme_patterns: string[];
  mood: string;
  imagery_tags: string[];
}

export default function AddLyric() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<LyricAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await window.lyricVault.analyzeLyric(text);
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze lyric');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setError(null);

    try {
      await window.lyricVault.addLyricWithAnalysis(text);
      navigate('/browse');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lyric');
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Add New Lyric</h1>
        <p className={styles.subtitle}>Capture your lyrical idea and let AI analyze it</p>
      </header>

      <div className={styles.inputSection}>
        <textarea
          className={styles.textarea}
          placeholder="Enter your lyric idea..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />

        <div className={styles.actions}>
          <button
            className={styles.buttonSecondary}
            onClick={handleAnalyze}
            disabled={!text.trim() || analyzing}
          >
            {analyzing ? (
              <>
                <span className={styles.spinner} />
                Analyzing...
              </>
            ) : (
              'Preview Analysis'
            )}
          </button>
          <button
            className={styles.buttonPrimary}
            onClick={handleSave}
            disabled={!text.trim() || saving}
          >
            {saving ? (
              <>
                <span className={styles.spinner} />
                Saving...
              </>
            ) : (
              'Save to Vault'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {analysis && (
        <div className={styles.analysisPreview}>
          <h2>Analysis Preview</h2>
          <div className={styles.analysisGrid}>
            <div className={styles.analysisItem}>
              <label>Themes</label>
              <div className={styles.badges}>
                {analysis.themes.map((theme) => (
                  <span key={theme} className={styles.badge}>
                    {theme}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.analysisItem}>
              <label>Mood</label>
              <p>{analysis.mood}</p>
            </div>
            <div className={styles.analysisItem}>
              <label>Rhyme Patterns</label>
              <div className={styles.badges}>
                {analysis.rhyme_patterns.map((pattern) => (
                  <span key={pattern} className={styles.badgeGray}>
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.analysisItem}>
              <label>Imagery</label>
              <div className={styles.badges}>
                {analysis.imagery_tags.map((tag) => (
                  <span key={tag} className={styles.badgeGray}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
