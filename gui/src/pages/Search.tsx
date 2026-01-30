import { useState } from 'react';
import styles from './Search.module.css';

interface Lyric {
  id: number;
  lyric_text: string;
  created_at: string;
  themes: string[];
  rhyme_patterns: string[];
  mood: string;
  imagery_tags: string[];
}

type SearchType = 'theme' | 'mood' | 'rhyme';

export default function Search() {
  const [searchType, setSearchType] = useState<SearchType>('theme');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Lyric[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const query: { theme?: string; mood?: string; rhyme?: string } = {};
      query[searchType] = searchTerm;
      const data = await window.lyricVault.searchLyrics(query);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Search Lyrics</h1>
        <p className={styles.subtitle}>Find lyrics by theme, mood, or rhyme pattern</p>
      </header>

      <div className={styles.searchSection}>
        <div className={styles.searchTypeButtons}>
          {(['theme', 'mood', 'rhyme'] as SearchType[]).map((type) => (
            <button
              key={type}
              className={`${styles.typeButton} ${searchType === type ? styles.typeButtonActive : ''}`}
              onClick={() => setSearchType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <SearchIcon />
          <input
            type="text"
            placeholder={`Search by ${searchType}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={styles.searchButton}
            onClick={handleSearch}
            disabled={!searchTerm.trim() || loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className={styles.quickFilters}>
          <span>Quick:</span>
          {searchType === 'theme' && (
            <>
              <button onClick={() => { setSearchTerm('love'); }}>love</button>
              <button onClick={() => { setSearchTerm('loss'); }}>loss</button>
              <button onClick={() => { setSearchTerm('nostalgia'); }}>nostalgia</button>
              <button onClick={() => { setSearchTerm('hope'); }}>hope</button>
            </>
          )}
          {searchType === 'mood' && (
            <>
              <button onClick={() => { setSearchTerm('melancholic'); }}>melancholic</button>
              <button onClick={() => { setSearchTerm('hopeful'); }}>hopeful</button>
              <button onClick={() => { setSearchTerm('wistful'); }}>wistful</button>
            </>
          )}
          {searchType === 'rhyme' && (
            <>
              <button onClick={() => { setSearchTerm('ight'); }}>-ight</button>
              <button onClick={() => { setSearchTerm('ain'); }}>-ain</button>
              <button onClick={() => { setSearchTerm('ove'); }}>-ove</button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Searching...</p>
        </div>
      ) : searched ? (
        results.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No lyrics found matching "{searchTerm}"</p>
            <p className={styles.emptyHint}>Try a different search term</p>
          </div>
        ) : (
          <>
            <div className={styles.resultsHeader}>
              Found {results.length} lyric{results.length !== 1 ? 's' : ''}
            </div>
            <div className={styles.results}>
              {results.map((lyric) => (
                <div key={lyric.id} className={styles.resultCard}>
                  <p className={styles.resultText}>"{lyric.lyric_text}"</p>
                  <div className={styles.resultMeta}>
                    <div className={styles.badges}>
                      {lyric.themes.map((theme) => (
                        <span
                          key={theme}
                          className={`${styles.badge} ${
                            searchType === 'theme' && theme.toLowerCase().includes(searchTerm.toLowerCase())
                              ? styles.badgeHighlight
                              : ''
                          }`}
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                    <span className={styles.mood}>{lyric.mood}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      ) : null}
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
