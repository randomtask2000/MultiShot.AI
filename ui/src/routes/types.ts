
export interface llmProvider {
  model: string;
  provider: string;
  title: string;
  icon: string;
  subtitle: string;
}

export interface DataObject {
  item: string;
}

// unplugin-icons  https://github.com/unplugin/unplugin-icons
// icons can be found here: https://icon-sets.iconify.design/
export const Items: llmProvider[] = [
    {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "title": "GPT-4o-mini",
      "icon": "simple-icons:openai",
      "subtitle": "Faster for everyday tasks"
    },
    {
      "provider": "openai",
      "model": "gpt-4o",
      "title": "GPT-4o",
      "icon": "simple-icons:openai",
      "subtitle": "Best for complex tasks"
    },
    {
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "title": "GPT-3.5 Turbo",
      "icon": "simple-icons:openai",
      "subtitle": "Legacy model"
    },
    {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20240620",
      "title": "Claude 3.5 Sonnet",
      "icon": "simple-icons:anthropic",
      "subtitle": "Best for coding tasks"
    },
    {
      "provider": "groq",
      "model": "llama-3.1-405b-reasoning",
      "title": "Llama 405b",
      "icon": "fluent-emoji-high-contrast:llama",
      "subtitle": "Not provided yet"
    },
    {
      "provider": "groq",
      "model": "llama3-70b-8192",
      "title": "Llama 70b",
      "icon": "fluent-emoji-high-contrast:llama",
      "subtitle": "Best for complex tasks"
    },
    {
      "provider": "ollama",
      "model": "codestral:22b",
      "title": "ollama - codestral:22b",
      "icon": "material-symbols:skull",
      "subtitle": "Best for private tasks"
    }
  ];
