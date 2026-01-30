import { useState, useEffect } from 'react';
import styles from './Browse.module.css';

interface Lyric {
  id: number;
  lyric_text: string;
  created_at: string;
  themes: string[];
  rhyme_patterns: string[];
  mood: string;
  imagery_tags: string[];
}

export default function Browse() {
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [filteredLyrics, setFilteredLyrics] = useState<Lyric[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLyric, setSelectedLyric] = useState<Lyric | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadLyrics();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLyrics(lyrics);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredLyrics(
        lyrics.filter(
          (lyric) =>
            lyric.lyric_text.toLowerCase().includes(term) ||
            lyric.themes.some((t) => t.toLowerCase().includes(term)) ||
            lyric.mood.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, lyrics]);

  const loadLyrics = async () => {
    try {
      const data = await window.lyricVault.getAllLyrics();
      setLyrics(data);
      setFilteredLyrics(data);
    } catch (error) {
      console.error('Failed to load lyrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await window.lyricVault.deleteLyric(id);
      setLyrics((prev) => prev.filter((l) => l.id !== id));
      setDeleteConfirm(null);
      if (selectedLyric?.id === id) {
        setSelectedLyric(null);
      }
    } catch (error) {
      console.error('Failed to delete lyric:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading lyrics...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Browse Lyrics</h1>
          <p className={styles.subtitle}>{lyrics.length} lyrics in your vault</p>
        </div>
        <div className={styles.searchBox}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Filter lyrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {filteredLyrics.length === 0 ? (
        <div className={styles.emptyState}>
          {lyrics.length === 0 ? (
            <>
              <p>Your vault is empty</p>
              <p className={styles.emptyHint}>Add some lyrics to get started</p>
            </>
          ) : (
            <p>No lyrics match your search</p>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredLyrics.map((lyric) => (
            <div
              key={lyric.id}
              className={styles.card}
              onClick={() => setSelectedLyric(lyric)}
            >
              <p className={styles.cardText}>"{lyric.lyric_text}"</p>
              <div className={styles.cardMeta}>
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
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLyric && (
        <div className={styles.modalOverlay} onClick={() => setSelectedLyric(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedLyric(null)}>
              <CloseIcon />
            </button>
            <div className={styles.modalContent}>
              <p className={styles.modalText}>"{selectedLyric.lyric_text}"</p>
              <div className={styles.modalMeta}>
                <div className={styles.metaRow}>
                  <label>Themes</label>
                  <div className={styles.badges}>
                    {selectedLyric.themes.map((theme) => (
                      <span key={theme} className={styles.badge}>
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.metaRow}>
                  <label>Mood</label>
                  <p>{selectedLyric.mood}</p>
                </div>
                <div className={styles.metaRow}>
                  <label>Rhyme Patterns</label>
                  <div className={styles.badges}>
                    {selectedLyric.rhyme_patterns.map((pattern) => (
                      <span key={pattern} className={styles.badgeGray}>
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.metaRow}>
                  <label>Imagery</label>
                  <div className={styles.badges}>
                    {selectedLyric.imagery_tags.map((tag) => (
                      <span key={tag} className={styles.badgeGray}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.metaRow}>
                  <label>Added</label>
                  <p>{new Date(selectedLyric.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className={styles.modalActions}>
                {deleteConfirm === selectedLyric.id ? (
                  <>
                    <span className={styles.confirmText}>Delete this lyric?</span>
                    <button
                      className={styles.buttonDanger}
                      onClick={() => handleDelete(selectedLyric.id)}
                    >
                      Confirm
                    </button>
                    <button
                      className={styles.buttonSecondary}
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className={styles.buttonDanger}
                    onClick={() => setDeleteConfirm(selectedLyric.id)}
                  >
                    <TrashIcon />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
