// store.ts
import { writable } from 'svelte/store';
import type { ChatHistoryItem } from './types';

function createListStore() {
  const { subscribe, set, update } = writable<ChatHistoryItem[]>([]);

  return {
    subscribe,
    set,
    addItem: (item: ChatHistoryItem) => {
      update(items => {
        const updatedItems = [...items, item];
        localStorage.setItem('listItems', JSON.stringify(updatedItems));
        return updatedItems;
      });
    },
    clearList: () => {
      set([]);
      localStorage.removeItem('listItems');
    },
    init: () => {
      const storedItems = localStorage.getItem('listItems');
      if (storedItems) {
        set(JSON.parse(storedItems));
      }
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
