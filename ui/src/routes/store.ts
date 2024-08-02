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
