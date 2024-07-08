// store.ts
import { writable } from 'svelte/store';

export interface ListItem {
  id: number;
  text: string;
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
    addItem: (text: string) => {
      update(items => {
        const newItem: ListItem = {
          id: items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1,
          text
        };
        const updatedItems = [...items, newItem];
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
