// store.ts
import { writable, type Writable } from 'svelte/store';
import type { ChatHistoryItem, LlmProvider } from './types';
import { AnimationType } from './types';

function createListStore() {
  const { subscribe, set, update } = writable<ChatHistoryItem[]>([]);

  return {
    subscribe,
    addItem: (item: ChatHistoryItem) => update(items => {
      const updatedItems = [...items, {
        ...item,
        llmProvider: { ...item.llmProvider } // Ensure a deep copy is stored
      }];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('chatHistory', JSON.stringify(updatedItems));
      }
      return updatedItems;
    }),
    init: () => {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('chatHistory');
        if (stored) {
          const parsedItems = JSON.parse(stored);
          set(parsedItems.map((item: ChatHistoryItem) => ({
            ...item,
            llmProvider: { ...item.llmProvider } // Ensure a deep copy is retrieved
          })));
        }
      }
    },
    clearList: () => {
      update(items => []);
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
    removeProvider: (model: string) => update(providers => {
      const updatedProviders = providers.filter(p => p.model !== model);
      if (isBrowser) {
        localStorage.setItem('llmProviderList', JSON.stringify(updatedProviders));
      }
      return updatedProviders;
    }),
    updateAndPersist: (updater: (providers: LlmProvider[]) => LlmProvider[]) => update(providers => {
      const updatedProviders = updater(providers);
      if (isBrowser) {
        localStorage.setItem('llmProviderList', JSON.stringify(updatedProviders));
      }
      return updatedProviders;
    }),
  };
}

export const llmProviderListStore = createLlmProviderListStore();

function createSelectedModelStore() {
  const { subscribe, set } = writable<string | null>(null);

  return {
    subscribe,
    setSelectedModel: (model: string) => {
      set(model);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('selectedModel', model);
      }
    },
    init: () => {
      if (typeof localStorage !== 'undefined') {
        const storedModel = localStorage.getItem('selectedModel');
        if (storedModel) {
          set(storedModel);
        }
      }
    }
  };
}

export const selectedModelStore = createSelectedModelStore();

function createLocalWebLlmStore() {
  const { subscribe, set } = writable(
    typeof localStorage !== 'undefined' && localStorage.getItem('localwebLlm') === 'true'
  );

  return {
    subscribe,
    setLocalWebLlm: (value: boolean) => {
      set(value);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('localwebLlm', value.toString());
      }
    },
    init: () => {
      if (typeof localStorage !== 'undefined') {
        const storedValue = localStorage.getItem('localwebLlm');
        if (storedValue !== null) {
          set(storedValue === 'true');
        }
      }
    }
  };
}

export const localWebLlmStore = createLocalWebLlmStore();

function createSelectedAnimationStore() {
  const defaultAnimation = AnimationType.None;
  const { subscribe, set, update } = writable<AnimationType>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('selectedAnimation') as AnimationType) || defaultAnimation
  );

  let currentAnimation = defaultAnimation;

  return {
    subscribe,
    setAnimation: (animation: AnimationType) => {
      currentAnimation = animation;
      set(animation);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('selectedAnimation', animation);
      }
    },
    get: () => currentAnimation,
    init: () => {
      if (typeof localStorage !== 'undefined') {
        const storedAnimation = localStorage.getItem('selectedAnimation') as AnimationType;
        if (storedAnimation && Object.values(AnimationType).includes(storedAnimation)) {
          currentAnimation = storedAnimation;
          set(storedAnimation);
        } else {
          currentAnimation = defaultAnimation;
          set(defaultAnimation);
        }
      }
    }
  };
}

export const selectedAnimationStore = createSelectedAnimationStore();


// Initialize the stores only in the browser
if (typeof window !== 'undefined') {
  llmProviderListStore.init();
  localWebLlmStore.init();
  selectedAnimationStore.init(); // Add this line
}

