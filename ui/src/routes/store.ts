import { writable } from 'svelte/store';
import type { ChatHistoryItem } from './types';

function createListStore() {
  const { subscribe, set, update } = writable<ChatHistoryItem[]>([]);

  let initialized = false;

  function init() {
    if (initialized) return;
    if (typeof window === 'undefined') return;

    const storedItems = localStorage.getItem('listItems');
    const initialItems: ChatHistoryItem[] = storedItems ? JSON.parse(storedItems) : [];
    set(initialItems);
    initialized = true;
  }

  return {
    subscribe,
    addItem: (item: ChatHistoryItem) => {
      update(items => {
        const updatedItems = [...items, item];
        if (typeof window !== 'undefined') {
          localStorage.setItem('listItems', JSON.stringify(updatedItems));
        }
        return updatedItems;
      });
    },
    clearList: () => {
      set([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('listItems');
      }
    },
    init
  };
}

export const listStore = createListStore();

