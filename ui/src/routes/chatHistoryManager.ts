// chatHistoryManager.ts
import { get } from 'svelte/store';
import { listStore } from './store';
import type { ChatHistoryItem, Token, LlmProvider } from './types';

export class ChatHistoryManager {
  static async exportChatHistory(): Promise<string> {
    const chatHistory = get(listStore);
    const blob = new Blob([JSON.stringify(chatHistory, null, 2)], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  static async importChatHistory(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);

          if (!Array.isArray(importedData)) {
            throw new Error('Imported data is not an array');
          }

          const validatedChatHistory: ChatHistoryItem[] = importedData.map((item, index) => {
            if (!ChatHistoryManager.isValidChatHistoryItem(item)) {
              throw new Error(`Invalid item at index ${index}`);
            }
            return item;
          });

          listStore.set(validatedChatHistory);
          localStorage.setItem('listItems', JSON.stringify(validatedChatHistory));
          resolve();
        } catch (error) {
          reject(new Error(`Invalid file format: ${ChatHistoryManager.getErrorMessage(error)}`));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }

  static clearChatHistory(): void {
    listStore.clearList();
  }

  private static isValidChatHistoryItem(item: unknown): item is ChatHistoryItem {
    if (typeof item !== 'object' || item === null) return false;

    const chatItem = item as Partial<ChatHistoryItem>;
    return (
      typeof chatItem.id === 'number' &&
      typeof chatItem.text === 'string' &&
      Array.isArray(chatItem.tokenHistory) &&
      chatItem.tokenHistory.every(ChatHistoryManager.isValidToken) &&
      ChatHistoryManager.isValidLlmProvider(chatItem.llmProvider)
    );
  }

  private static isValidToken(token: unknown): token is Token {
    if (typeof token !== 'object' || token === null) return false;

    const tokenItem = token as Partial<Token>;
    return (
      typeof tokenItem.role === 'string' &&
      typeof tokenItem.content === 'string' &&
      ChatHistoryManager.isValidLlmProvider(tokenItem.llmInfo)
    );
  }

  private static isValidLlmProvider(provider: unknown): provider is LlmProvider {
    if (typeof provider !== 'object' || provider === null) return false;

    const providerItem = provider as Partial<LlmProvider>;
    return (
      typeof providerItem.model === 'string' &&
      typeof providerItem.provider === 'string' &&
      typeof providerItem.title === 'string' &&
      typeof providerItem.icon === 'string' &&
      typeof providerItem.subtitle === 'string' &&
      typeof providerItem.systemMessage === 'string' &&
      typeof providerItem.apiKeyName === 'string'
    );
  }

  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
