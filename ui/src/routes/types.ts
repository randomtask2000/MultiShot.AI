import type { IconSource } from 'svelte-hero-icons';
import { Sparkles, Star, Check } from 'svelte-hero-icons';

export interface llmProvider {
  model: string;
  provider: string;
  title: string;
  icon: IconSource;
  subtitle: string;
}

export interface DataObject {
  item: string;
}

export const Items: llmProvider[] = [
    {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "title": "GPT-4o-mini",
      "icon": Sparkles,
      "subtitle": "Faster for everyday tasks"
    },
    {
      "provider": "openai",
      "model": "gpt-4o",
      "title": "GPT-4o",
      "icon": Sparkles,
      "subtitle": "Best for complex tasks"
    },
    {
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "title": "GPT-3.5 Turbo",
      "icon": Star,
      "subtitle": "Legacy model"
    },
    {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20240620",
      "title": "Claude 3.5 Sonnet",
      "icon": Star,
      "subtitle": "Best for coding tasks"
    },
    {
      "provider": "groq",
      "model": "llama-3.1-405b-reasoning",
      "title": "Llama 405b",
      "icon": Star,
      "subtitle": "Not provided yet"
    },
    {
      "provider": "groq",
      "model": "llama3-70b-8192",
      "title": "Llama 70b",
      "icon": Check,
      "subtitle": "Best for complex tasks"
    },
    {
      "provider": "ollama",
      "model": "codestral:22b",
      "title": "ollama - codestral:22b",
      "icon": Star,
      "subtitle": "Best for private tasks"
    }
  ];
