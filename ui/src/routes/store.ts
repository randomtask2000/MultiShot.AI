// store.ts
import { writable } from 'svelte/store';
import type { ChatHistoryItem, LlmProvider } from './types';

function createListStore() {
  const { subscribe, set, update } = writable<ChatHistoryItem[]>([]);

  return {
    subscribe,
    addItem: (item: ChatHistoryItem) => update(items => [...items, item]),
    clearList: () => set([]),
    init: () => {
      const stored = localStorage.getItem('chatHistory');
      if (stored) {
        set(JSON.parse(stored));
      }
    },
    addModel: (model: string) => {
      // This method doesn't modify the chat history,
      // but we can use it to store the downloaded models separately
      const downloadedModels = JSON.parse(localStorage.getItem('downloadedModels') || '[]');
      if (!downloadedModels.includes(model)) {
        downloadedModels.push(model);
        localStorage.setItem('downloadedModels', JSON.stringify(downloadedModels));
      }
    },
    getDownloadedModels: () => {
      return JSON.parse(localStorage.getItem('downloadedModels') || '[]');
    }
  };
}

export const listStore = createListStore();

// New theme store
function createThemeStore() {
  const defaultTheme = 'rocket';
  const { subscribe, set } = writable(
    (typeof localStorage !== 'undefined' && localStorage.getItem('selectedTheme')) || defaultTheme
  );

  return {
    subscribe,
    setTheme: (theme: string) => {
      set(theme);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('selectedTheme', theme);
      }
    },
    init: () => {
      const storedTheme = typeof localStorage !== 'undefined' && localStorage.getItem('selectedTheme');
      if (storedTheme) {
        set(storedTheme);
      }
    }
  };
}

export const themeStore = createThemeStore();
