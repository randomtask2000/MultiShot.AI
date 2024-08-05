
export interface LlmProvider {
  model: string;
  provider: string;
  title: string;
  icon: string;
  subtitle: string;
  systemMessage: string;
  apiKeyName: string;
  local?: boolean;
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

export interface DataObject {
  item: string;
}

export interface ChatHistoryItem {
  id: number;
  text: string;
  tokenHistory: Token[];
  llmProvider: LlmProvider;
}

// unplugin-icons  https://github.com/unplugin/unplugin-icons
// icons can be found here: https://icon-sets.iconify.design/
export const LlmProviderList: LlmProvider[] = [
    {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "title": "GPT-4o-mini",
      "icon": "simple-icons:openai",
      "subtitle": "Faster for everyday tasks",
      "systemMessage": "You are a highly skilled AI assistant specializing in Svelte, JavaScript, Python, LangChain, LangGraph, and TypeScript. Your role involves guiding developers in setting up and configuring projects, creating and optimizing code, debugging issues, and providing best practices. You offer well-commented and formatted code snippets, in baby language for someone that doesn't like to read, and relevant references.",
      "apiKeyName": "OPENAI_API",
      "local": false
    },
    {
      "provider": "openai",
      "model": "gpt-4o",
      "title": "GPT-4o",
      "icon": "simple-icons:openai",
      "subtitle": "Best for complex tasks",
      "systemMessage": "You are a highly skilled AI assistant specializing in Svelte, JavaScript, Python, LangChain, LangGraph, and TypeScript. Your role involves guiding developers in setting up and configuring projects, creating and optimizing code, debugging issues, and providing best practices. You offer well-commented and formatted code snippets, in baby language for someone that doesn't like to read, and relevant references.",
      "apiKeyName": "OPENAI_API",
      "local": false
    },
    {
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "title": "GPT-3.5 Turbo",
      "icon": "simple-icons:openai",
      "subtitle": "Legacy model",
      "systemMessage": "You are a highly skilled AI assistant specializing in Svelte, JavaScript, Python, LangChain, LangGraph, and TypeScript. Your role involves guiding developers in setting up and configuring projects, creating and optimizing code, debugging issues, and providing best practices. You offer well-commented and formatted code snippets, in baby language for someone that doesn't like to read, and relevant references.",
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
      "apiKeyName": "GROQ_API",
      "local": false
    },
    {
      "provider": "groq",
      "model": "llama3-70b-8192",
      "title": "Llama 70b",
      "icon": "fluent-emoji-high-contrast:llama",
      "subtitle": "Best for complex tasks",
      "systemMessage": "You are a highly skilled AI assistant specializing in Svelte, JavaScript, Python, LangChain, LangGraph, and TypeScript. Your role involves guiding developers in setting up and configuring projects, creating and optimizing code, debugging issues, and providing best practices. You offer well-commented and formatted code snippets, in baby language for someone that doesn't like to read, and relevant references.",
      "apiKeyName": "GROQ_API",
      "local": false
    },
    {
      "provider": "ollama",
      "model": "codestral:22b",
      "title": "ollama - codestral:22b",
      "icon": "material-symbols:skull",
      "subtitle": "Best for private tasks",
      "systemMessage": "You are a highly skilled AI assistant specializing in Svelte, JavaScript, Python, LangChain, LangGraph, and TypeScript. Your role involves guiding developers in setting up and configuring projects, creating and optimizing code, debugging issues, and providing best practices. You offer well-commented and formatted code snippets, in baby language for someone that doesn't like to read, and relevant references.",
      "apiKeyName": "OLLAMA_API",
      "local": true
    }
  ];
