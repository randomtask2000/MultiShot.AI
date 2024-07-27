import { type ListItem } from './store';
import { marked } from 'marked';
import hljs from 'highlight.js';
import BubbleUser from './BubbleUser.svelte';
import BubbleSystem from './BubbleSystem.svelte';
import CodeBlock from './CodeBlock.svelte';
import type { llmProvider } from './types';

export interface Token {
    role: string;
    content: string;
}

export interface GenericReader {
  read(): Promise<{ done: boolean; value: Uint8Array | undefined }>;
}

export function storeTokenHistory(
    tokenHistory: Token[],
    listItems: ListItem[],
    addItem: (item: ListItem) => void,
    clearResult: () => void
): void {
    if (tokenHistory.length > 0) {
        const rawTitle = tokenHistory[0].content.substring(0, 30);
        const title = marked.parse(rawTitle).replace(/<[^>]*>/g, ''); // Strip HTML tags
        const newItem: ListItem = {
            id: Date.now(),
            text: title,
            tokenHistory: tokenHistory.map(token => ({
                role: token.role,
                content: token.content // Store original markdown content
            }))
        };
        addItem(newItem);
        clearResult();
    }
}


export function scrollChatBottom(resultDiv: HTMLDivElement, behavior: ScrollBehavior = 'auto'): void {
    resultDiv.lastElementChild?.scrollIntoView({ behavior, block: 'end' });
}

export function handleScroll(elemChat: HTMLDivElement): boolean {
    const bottomThreshold = 20; // pixels from bottom
    if (elemChat) {
        return elemChat.scrollHeight - elemChat.scrollTop - elemChat.clientHeight <= bottomThreshold;
    }
    return false;
}

/**
 * Creates and appends a new bubble to the resultDiv based on the given person and type.
 *
 * @param {HTMLDivElement} resultDiv - The div element to append the bubble to.
 * @param {string} person - The name of the person associated with the bubble.
 * @param {"user" | "ai"} type - The type of bubble, either "user" or "ai".
 * @returns {{ bubbleId: string, pid: string }} - An object containing the bubbleId and pid of the newly created bubble.
 * @throws {Error} - If an unsupported type is provided.
 */
export function addBubble(resultDiv: HTMLDivElement, person: string, type: "user" | "ai"): { bubbleId: string, pid: string } {
    if (!resultDiv) {
        console.error('resultDiv is not initialized');
        return { bubbleId: '', pid: '' };
    }
    if (!person) person = "person";
    const parentDiv = document.createElement('div');
    const bubbleData = {
        color: 'variant-soft-primary',
        name: person,
        timestamp: new Date().toLocaleTimeString(),
        message: "",
        avatar: `https://i.pravatar.cc/?img=${type === "user" ? Math.floor(Math.random() * 11) + 10 : Math.floor(Math.random() * 11) + 10}`,
        pid: `pid${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    let bubble;
    switch (type) {
        case "user":
            bubble = new BubbleUser({ target: parentDiv, props: { bubble: bubbleData } });
            break;
        case "ai":
            bubble = new BubbleSystem({ target: parentDiv, props: { bubble: bubbleData } });
            break;
        default:
            throw new Error("Unsupported type");
    }
    const bubbleId = `div${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    bubble.id = bubbleId;
    resultDiv.appendChild(parentDiv);
    return { bubbleId, pid: bubbleData.pid };
}

export function printMessage(pid: string, tokens: string): void {
    const element = document.getElementById(pid);
    if (element) {
        element.innerHTML += tokens;
    }
}


/**
 * Fetches AI response from the server by sending a chat history and selected item model
 *
 * @param {Token[]} history - The chat history as an array of Token objects
 * @param {llmProvider} selectedItem - The selected item model for AI chat
 *
 * @returns {Promise<Response>} - The response from the server
 */
export async function fetchAi(history: Token[], selectedItem: llmProvider) {
    const content = JSON.stringify({ messages: history, llm: selectedItem.model });
    return await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: content
    });
}

class CustomRenderer extends marked.Renderer {
  // codeStart(language: string): string {
  //   const validLanguage = language && hljs.getLanguage(language) ? language : 'python';
  //   return `<pre><code class="hljs language-${validLanguage}">`;
  // }
  //
  codeStart(language: string): string {
    const validLanguage = language && hljs.getLanguage(language) ? language : 'python';
    //return `<pre><code class="hljs language-${validLanguage}" style="background-color: black; color: white">`;
    return ``;
  }

  codeEnd(): string {
    return ``;
  }

  code(code: string, language: string): string {
    const validLanguage = language && hljs.getLanguage(language) ? language : 'python';
    const highlightedCode = hljs.highlight(code, { language: validLanguage }).value;
    //return `<div class="bg-black p-4 rounded-md">` + this.codeStart(validLanguage) + highlightedCode + this.codeEnd() + `</div>`;
    return this.codeStart(validLanguage) + highlightedCode + this.codeEnd();
  }
}

const customRenderer = new CustomRenderer();

marked.setOptions({
  renderer: customRenderer,
  highlight: function(code, lang) {
    const language = lang && hljs.getLanguage(lang) ? lang : 'python';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'language-',
  breaks: true,
  gfm: true
});

marked.setOptions({
    //renderer: renderer,
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'python';
        return hljs.highlight(code, { language: language || 'python' }).value;
    },
    langPrefix: 'hljs language-',
    breaks: true,
    gfm: true
});

export function renderMarkdownWithCodeBlock(content: string, outputElement: HTMLElement) {
  const parser = new StreamParser(outputElement);
  parser.processChunk(content);
  parser.finish();
}
export function renderMarkdown(content: string) {
  const tempDiv = document.createElement('div');
  renderMarkdownWithCodeBlock(content, tempDiv);
  return tempDiv.innerHTML;
}

export function renderMarkdownHistory(content: string) {
  return renderMarkdown(content);
}

export class StreamParser {
  private outputElement: HTMLElement;
  private buffer: string = '';
  private inCodeBlock: boolean = false;
  private currentLanguage: string = '';
  private codeBlockComponent: CodeBlock | null = null;
  private codeBlockContent: string = '';

  constructor(outputElement: HTMLElement) {
    this.outputElement = outputElement;
  }

  private renderMarkdown(line: string): void {
    if (line.startsWith('```')) {
      if (this.inCodeBlock) {
        // End of code block
        if (this.codeBlockComponent) {
          this.codeBlockComponent.$set({ content: this.codeBlockContent.trim() });
          this.codeBlockComponent = null;
        }
        this.inCodeBlock = false;
        this.codeBlockContent = '';
      } else {
        // Start of code block
        this.currentLanguage = line.slice(3).trim() || 'python';
        this.inCodeBlock = true;
        const wrapper = document.createElement('div');
        this.outputElement.appendChild(wrapper);
        this.codeBlockComponent = new CodeBlock({
          target: wrapper,
          props: {
            content: '',
            language: this.currentLanguage
          }
        });
      }
    } else if (this.inCodeBlock) {
      // Inside code block
      this.codeBlockContent += line;
      if (this.codeBlockComponent) {
        this.codeBlockComponent.$set({ content: this.codeBlockContent });
      }
    } else {
      // Regular markdown content
      const html = marked(line);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      while (tempDiv.firstChild) {
        this.outputElement.appendChild(tempDiv.firstChild);
      }
    }
  }

  processChunk(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    while (lines.length > 1) {
      const line = lines.shift();
      if (line !== undefined) {
        this.renderMarkdown(line + '\n');
      }
    }
    this.buffer = lines[0];
  }

  finish(): void {
    if (this.buffer) {
      this.renderMarkdown(this.buffer);
      this.buffer = '';
    }
    if (this.inCodeBlock) {
      this.renderMarkdown('```');
    }
    this.codeBlockComponent = null;
    this.codeBlockContent = '';
  }
}


export async function printResponse(
    resultDiv: HTMLDivElement,
    reader: GenericReader,
    decoder: TextDecoder,
    responsePid: string
): Promise<string> {
    let lastResponse = '';
    const outputElement = document.getElementById(responsePid)!;
    const parser = new StreamParser(outputElement);

    async function processResult(result: { done: boolean; value: Uint8Array | undefined }): Promise<void> {
        if (Date.now() % 2000 < 1000) {
            setTimeout(() => {
                scrollChatBottom(resultDiv,'smooth');
            }, 0);
        }
        if (result.done) {
            parser.finish();
            return;
        }
        if (result.value) {
            const token = decoder.decode(result.value);
            lastResponse += token;
            parser.processChunk(token);
        }
        return reader.read().then(processResult);
    }
    await reader.read().then(processResult);
    return lastResponse;
}

