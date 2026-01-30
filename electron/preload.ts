import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for the API exposed to the renderer
export interface LyricVaultAPI {
  // Database operations
  getAllLyrics: () => Promise<any[]>;
  getRecentLyrics: (limit: number) => Promise<any[]>;
  getLyric: (id: number) => Promise<any | null>;
  deleteLyric: (id: number) => Promise<boolean>;
  searchLyrics: (query: { theme?: string; rhyme?: string; mood?: string }) => Promise<any[]>;
  getStats: () => Promise<{ total: number; oldestDate: string | null }>;

  // AI operations
  addLyricWithAnalysis: (text: string) => Promise<{ id: number; analysis: any }>;
  analyzeLyric: (text: string) => Promise<{ analysis: any; rawResponse: string }>;
  getSuggestions: (text: string) => Promise<any[]>;
  testOllamaConnection: () => Promise<boolean>;
  checkModelAvailable: () => Promise<{ available: boolean; models: string[] }>;

  // Config operations
  getConfig: () => Promise<any>;
  saveConfig: (config: any) => Promise<void>;
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('lyricVault', {
  // Database operations
  getAllLyrics: () => ipcRenderer.invoke('db:getAllLyrics'),
  getRecentLyrics: (limit: number) => ipcRenderer.invoke('db:getRecentLyrics', limit),
  getLyric: (id: number) => ipcRenderer.invoke('db:getLyric', id),
  deleteLyric: (id: number) => ipcRenderer.invoke('db:deleteLyric', id),
  searchLyrics: (query: { theme?: string; rhyme?: string; mood?: string }) =>
    ipcRenderer.invoke('db:searchLyrics', query),
  getStats: () => ipcRenderer.invoke('db:getStats'),

  // AI operations
  addLyricWithAnalysis: (text: string) => ipcRenderer.invoke('ai:addLyricWithAnalysis', text),
  analyzeLyric: (text: string) => ipcRenderer.invoke('ai:analyzeLyric', text),
  getSuggestions: (text: string) => ipcRenderer.invoke('ai:getSuggestions', text),
  testOllamaConnection: () => ipcRenderer.invoke('ai:testConnection'),
  checkModelAvailable: () => ipcRenderer.invoke('ai:checkModelAvailable'),

  // Config operations
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config: any) => ipcRenderer.invoke('config:save', config),
} as LyricVaultAPI);

// Type augmentation for window object
declare global {
  interface Window {
    lyricVault: LyricVaultAPI;
  }
}
