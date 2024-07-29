import { writable } from 'svelte/store';
import type { Token } from './tokenUtils';

export interface ListItem {
  id: number;
  text: string;
  tokenHistory: Token[];
}

function createListStore() {
  const { subscribe, set, update } = writable<ListItem[]>([]);

  let initialized = false;

  function init() {
    if (initialized) return;
    if (typeof window === 'undefined') return;

    const storedItems = localStorage.getItem('listItems');
    const initialItems: ListItem[] = storedItems ? JSON.parse(storedItems) : [];
    set(initialItems);
    initialized = true;
  }

  return {
    subscribe,
    addItem: (item: ListItem) => {
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
