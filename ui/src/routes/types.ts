import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface LlmProvider {
  model: string;
  provider: string;
  title: string;
  icon: string;
  subtitle: string;
  systemMessage: string;
  apiBase?: string;
  apiKeyName: string;
  local?: boolean;
}

export interface Bubble {
  color: string;
  name: string;
  timestamp: string;
  message: string;
  avatar: string;
  icon: string;
  llmProvider: LlmProvider;
  pid: string;
}

export interface DataObject {
  item: string;
}

export interface Token {
    role: string;
    content: string;
    llmInfo: LlmProvider;
}

export interface GenericReader {
  read(): Promise<{ done: boolean; value: Uint8Array | undefined }>;
}

export interface ChatHistoryItem {
  id: number;
  createdAt: Date;
  text: string;
  tokenHistory: Token[];
  llmProvider: LlmProvider;
}

export type WritableStore<T> = Writable<T>;

function createPersistentLlmProviderList() {
  const initialProviders = [
    {
      "provider": "webllm",
      "model": "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC-1k",
      "title": "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC-1k",
      "icon": "arcticons:microsoft-bing",
      "subtitle": "Faster for everyday tasks",
      "systemMessage": "You are a highly skilled AI assistant and I love to talk tech. Your role involves guiding developers in setting up and configuring projects, creating and optimizing code, debugging issues, and providing best practices. You offer well-commented and formatted code snippets, in baby language for someone that doesn't like to read, and relevant references.",
      "apiBase": "",
      "apiKeyName": "",
      "local": true
    },
    {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "title": "GPT-4o-mini",
      "icon": "simple-icons:openai",
      "subtitle": "Faster for everyday tasks",
      "systemMessage": "You are a highly skilled AI assistant specializing in Svelte, JavaScript, Python, LangChain, LangGraph, and TypeScript. Your role involves guiding developers in setting up and configuring projects, creating and optimizing code, debugging issues, and providing best practices. You offer well-commented and formatted code snippets, in baby language for someone that doesn't like to read, and relevant references.",
      "apiBase": "https://api.openai.com/v1",
      "apiKeyName": "OPENAI_API",
      "local": false
    },
    {
      "provider": "openai",
      "model": "gpt-4o",
      "title": "GPT-4o",
      "icon": "simple-icons:openai",
      "subtitle": "Best for complex tasks",
      "systemMessage": "You are a highly skilled AI assistant",
      "apiBase": "https://api.openai.com/v1",
      "apiKeyName": "OPENAI_API",
      "local": false
    },
    {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20240620",
      "title": "Claude 3.5 Sonnet",
      "icon": "simple-icons:anthropic",
      "subtitle": "Best for coding tasks",
      "systemMessage": "You are a highly skilled AI assistant specializing in Svelte, JavaScript, Python, LangChain, LangGraph, and TypeScript. Your role involves guiding developers in setting up and configuring projects, creating and optimizing code, debugging issues, and providing best practices. You offer well-commented and formatted code snippets, in baby language for someone that doesn't like to read, and relevant references.",
      "apiBase": "https://api.anthropic.com/v1",
      "apiKeyName": "ANTHROPIC_API",
      "local": false
    },
    {
      "model": "mistral-large-latest",
      "title": "Mistral large latest",
      "icon": "logos:mistral-ai-icon",
      "subtitle": "Large enough",
      "systemMessage": "You are a highly skilled AI assistant specializing in Svelte, JavaScript, Python, LangChain, LangGraph, and TypeScript. You only return the full code files and no explanations.",
      "provider": "mistral",
      "apiBase": "https://api.mistral.ai/v1/",
      "apiKeyName": "MISTRAL_API",
      "local": false
    },
    {
      "provider": "groq",
      "model": "llama-3.1-405b-reasoning",
      "title": "Llama 405b",
      "icon": "fluent-emoji-high-contrast:llama",
      "subtitle": "Not provided yet",
      "systemMessage": "You are a highly skilled AI assistant specializing in Svelte, JavaScript, Python, LangChain, LangGraph, and TypeScript. Your role involves guiding developers in setting up and configuring projects, creating and optimizing code, debugging issues, and providing best practices. You offer well-commented and formatted code snippets, in baby language for someone that doesn't like to read, and relevant references.",
      "apiBase": "https://api.groq.com/openai/v1/",
      "apiKeyName": "GROQ_API",
      "local": false
    },
    {
      "provider": "openai",
      "model": "perplexity/llama-3.1-sonar-huge-128k-online",
      "title": "Llama 3.1 Sonar 405B Online",
      "icon": "fluent-emoji-high-contrast:llama",
      "subtitle": "Best for complex tasks",
      "systemMessage": "You are a highly skilled AI assistant specializing in Svelte, JavaScript, Python, LangChain, LangGraph, and TypeScript. ",
      "apiBase": "https://openrouter.ai/api/v1",
      "apiKeyName": "OPENROUTER_API",
      "local": false
    }
  ];

  const storedProviders = typeof localStorage !== 'undefined'
? JSON.parse(localStorage.getItem('llmProviderList') || 'null')
    : null;

  const { subscribe, set, update } = writable(storedProviders || initialProviders);

  return {
    subscribe,
    set: (value: LlmProvider[]) => {
      localStorage.setItem('llmProviderList', JSON.stringify(value));
      set(value);
    },
    update: (updater: (value: LlmProvider[]) => LlmProvider[]) => {
      update(providers => {
        const updated = updater(providers);
        localStorage.setItem('llmProviderList', JSON.stringify(updated));
        return updated;
      });
    }
  };
}

export const LlmProviderList = createPersistentLlmProviderList();