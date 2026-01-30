import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import styles from './Settings.module.css';

interface Config {
  ollama_model: string;
  ollama_url: string;
  database_path: string;
}

interface Stats {
  total: number;
  oldestDate: string | null;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [config, setConfig] = useState<Config>({
    ollama_model: 'llama3.2',
    ollama_url: 'http://localhost:11434',
    database_path: '',
  });
  const [stats, setStats] = useState<Stats>({ total: 0, oldestDate: null });
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [configData, statsData] = await Promise.all([
        window.lyricVault.getConfig(),
        window.lyricVault.getStats(),
      ]);
      setConfig(configData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus('unknown');
    try {
      const connected = await window.lyricVault.testOllamaConnection();
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    } catch {
      setConnectionStatus('disconnected');
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await window.lyricVault.saveConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Settings</h1>
        <p className={styles.subtitle}>Configure Lyric Vault</p>
      </header>

      <section className={styles.section}>
        <h2>Ollama Configuration</h2>
        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="model">Model</label>
            <input
              id="model"
              type="text"
              value={config.ollama_model}
              onChange={(e) => setConfig({ ...config, ollama_model: e.target.value })}
              placeholder="llama3.2"
            />
            <span className={styles.hint}>The Ollama model to use for analysis</span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="url">URL</label>
            <input
              id="url"
              type="text"
              value={config.ollama_url}
              onChange={(e) => setConfig({ ...config, ollama_url: e.target.value })}
              placeholder="http://localhost:11434"
            />
            <span className={styles.hint}>Ollama API endpoint</span>
          </div>

          <div className={styles.connectionRow}>
            <div className={styles.statusIndicator}>
              <span
                className={`${styles.statusDot} ${
                  connectionStatus === 'connected'
                    ? styles.statusConnected
                    : connectionStatus === 'disconnected'
                    ? styles.statusDisconnected
                    : ''
                }`}
              />
              <span>
                {connectionStatus === 'unknown'
                  ? 'Not tested'
                  : connectionStatus === 'connected'
                  ? 'Connected'
                  : 'Not connected'}
              </span>
            </div>
            <button className={styles.testButton} onClick={testConnection} disabled={testing}>
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          <div className={styles.formActions}>
            <button className={styles.saveButton} onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Appearance</h2>
        <div className={styles.themeToggle}>
          <span>Theme</span>
          <div className={styles.themeButtons}>
            <button
              className={`${styles.themeButton} ${theme === 'light' ? styles.themeButtonActive : ''}`}
              onClick={() => setTheme('light')}
            >
              <SunIcon />
              Light
            </button>
            <button
              className={`${styles.themeButton} ${theme === 'dark' ? styles.themeButtonActive : ''}`}
              onClick={() => setTheme('dark')}
            >
              <MoonIcon />
              Dark
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Data</h2>
        <div className={styles.dataInfo}>
          <div className={styles.dataRow}>
            <label>Database</label>
            <span className={styles.dataPath}>{config.database_path || '~/.lyric-vault/lyrics.db'}</span>
          </div>
          <div className={styles.dataRow}>
            <label>Total Lyrics</label>
            <span>{stats.total}</span>
          </div>
          {stats.oldestDate && (
            <div className={styles.dataRow}>
              <label>Oldest Entry</label>
              <span>{new Date(stats.oldestDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
