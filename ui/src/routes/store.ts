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
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('chatHistory');
        if (stored) {
          set(JSON.parse(stored));
        }
      }
    },
    addModel: (model: string) => {
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

function createLlmProviderListStore() {
  const { subscribe, set, update } = writable<LlmProvider[]>([]);

  const isBrowser = typeof window !== 'undefined';

  return {
    subscribe,
    init: () => {
      if (isBrowser) {
        const stored = localStorage.getItem('llmProviderList');
        if (stored) {
          set(JSON.parse(stored));
        }
      }
    },
    addProvider: (provider: LlmProvider) => update(providers => {
      const updatedProviders = [...providers, provider];
      if (isBrowser) {
        localStorage.setItem('llmProviderList', JSON.stringify(updatedProviders));
      }
      return updatedProviders;
    }),
    removeProvider: (id: string) => update(providers => {
      const updatedProviders = providers.filter(p => p.id !== id);
      if (isBrowser) {
        localStorage.setItem('llmProviderList', JSON.stringify(updatedProviders));
      }
      return updatedProviders;
    }),
  };
}

export const llmProviderListStore = createLlmProviderListStore();

// Initialize the store only in the browser
if (typeof window !== 'undefined') {
  llmProviderListStore.init();
}