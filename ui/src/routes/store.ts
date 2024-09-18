import { writable, type Writable } from 'svelte/store';
import type { ChatHistoryItem, LlmProvider } from './types';
import { AnimationType } from './types';

const isBrowser = typeof window !== 'undefined';

function createListStore() {
  const { subscribe, set, update } = writable<ChatHistoryItem[]>([]);

  return {
    subscribe,
    addItem: (item: ChatHistoryItem) => update(items => {
      const updatedItems = [...items, {
        ...item,
        llmProvider: { ...item.llmProvider }
      }];
      if (isBrowser) {
        localStorage.setItem('chatHistory', JSON.stringify(updatedItems));
      }
      return updatedItems;
    }),
    init: () => {
      if (isBrowser) {
        const stored = localStorage.getItem('chatHistory');
        if (stored) {
          const parsedItems = JSON.parse(stored);
          set(parsedItems.map((item: ChatHistoryItem) => ({
            ...item,
            llmProvider: { ...item.llmProvider }
          })));
        }
      }
    },
    clearList: () => {
      update(items => []);
    },
    addModel: (model: string) => {
      if (isBrowser) {
        const downloadedModels = JSON.parse(localStorage.getItem('downloadedModels') || '[]');
        if (!downloadedModels.includes(model)) {
          downloadedModels.push(model);
          localStorage.setItem('downloadedModels', JSON.stringify(downloadedModels));
        }
      }
    },
    getDownloadedModels: () => {
      return isBrowser ? JSON.parse(localStorage.getItem('downloadedModels') || '[]') : [];
    }
  };
}

export const listStore = createListStore();
export const defaultTheme = 'modern';

function createThemeStore() {
  const { subscribe, set } = writable(defaultTheme);

  return {
    subscribe,
    setTheme: (theme: string) => {
      set(theme);
      if (isBrowser) {
        localStorage.setItem('selectedTheme', theme);
      }
    },
    init: () => {
      if (isBrowser) {
        const storedTheme = localStorage.getItem('selectedTheme');
        if (storedTheme) {
          set(storedTheme);
        }
      }
    }
  };
}

export const themeStore = createThemeStore();

interface LlmProviderStore {
  subscribe: Writable<LlmProvider[]>['subscribe'];
  init: () => void;
  addProvider: (provider: LlmProvider) => void;
  removeProvider: (model: string) => void;
  setLocalWebLlm: (model: string, isLocal: boolean) => void;
}

function createLlmProviderListStore(): LlmProviderStore {
  const { subscribe, set, update } = writable<LlmProvider[]>([]);

  function persistToLocalStorage(providers: LlmProvider[]): void {
    if (isBrowser) {
      localStorage.setItem('llmProviderList', JSON.stringify(providers));
    }
  }

  return {
    subscribe,
    init: () => {
      if (isBrowser) {
        const stored = localStorage.getItem('llmProviderList');
        if (stored) {
          set(JSON.parse(stored) as LlmProvider[]);
        }
      }
    },
    addProvider: (provider: LlmProvider) => update((providers: LlmProvider[]) => {
      const existingProviderIndex = providers.findIndex(p => p.model === provider.model);
      let updatedProviders: LlmProvider[];
      if (existingProviderIndex !== -1) {
        updatedProviders = [
          ...providers.slice(0, existingProviderIndex),
          provider,
          ...providers.slice(existingProviderIndex + 1)
        ];
      } else {
        updatedProviders = [...providers, provider];
      }
      persistToLocalStorage(updatedProviders);
      return updatedProviders;
    }),
    removeProvider: (model: string) => update((providers: LlmProvider[]) => {
      const updatedProviders = providers.filter(p => p.model !== model);
      persistToLocalStorage(updatedProviders);
      return updatedProviders;
    }),
    setLocalWebLlm: (model: string, isLocal: boolean) => update((providers: LlmProvider[]) => {
      const updatedProviders = providers.map(provider => 
        provider.model === model ? { ...provider, local: isLocal } : provider
      );
      persistToLocalStorage(updatedProviders);
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
      if (isBrowser) {
        localStorage.setItem('selectedModel', model);
      }
    },
    init: () => {
      if (isBrowser) {
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
  const { subscribe, set } = writable(false);

  return {
    subscribe,
    setLocalWebLlm: (value: boolean) => {
      set(value);
      if (isBrowser) {
        localStorage.setItem('localwebLlm', value.toString());
      }
    },
    init: () => {
      if (isBrowser) {
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
  selectedModelStore.init();
  localWebLlmStore.init();
  selectedAnimationStore.init(); // Add this line
}

