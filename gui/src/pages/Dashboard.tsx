import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';

interface Stats {
  total: number;
  oldestDate: string | null;
}

interface Lyric {
  id: number;
  lyric_text: string;
  created_at: string;
  themes: string[];
  mood: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, oldestDate: null });
  const [recentLyrics, setRecentLyrics] = useState<Lyric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, lyricsData] = await Promise.all([
          window.lyricVault.getStats(),
          window.lyricVault.getRecentLyrics(5),
        ]);
        setStats(statsData);
        setRecentLyrics(lyricsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Welcome to Lyric Vault</h1>
        <p className={styles.subtitle}>Your personal lyric idea repository</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Lyrics</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{recentLyrics.length}</div>
          <div className={styles.statLabel}>Recent (5)</div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <Link to="/add" className={styles.actionButton}>
          <PlusIcon />
          Add New Lyric
        </Link>
        <Link to="/suggest" className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
          <SparkleIcon />
          Get Suggestions
        </Link>
      </div>

      <section className={styles.recentSection}>
        <h2>Recent Lyrics</h2>
        {recentLyrics.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No lyrics yet. Add your first lyric idea to get started!</p>
            <Link to="/add" className={styles.emptyLink}>
              Add your first lyric
            </Link>
          </div>
        ) : (
          <div className={styles.lyricsList}>
            {recentLyrics.map((lyric) => (
              <Link to={`/browse`} key={lyric.id} className={styles.lyricCard}>
                <p className={styles.lyricText}>"{lyric.lyric_text}"</p>
                <div className={styles.lyricMeta}>
                  <div className={styles.badges}>
                    {lyric.themes.slice(0, 2).map((theme) => (
                      <span key={theme} className={styles.badge}>
                        {theme}
                      </span>
                    ))}
                  </div>
                  <span className={styles.date}>
                    {new Date(lyric.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
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
