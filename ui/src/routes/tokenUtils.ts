import { type ListItem } from './store';
import { marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import BubbleUser from './BubbleUser.svelte';
import BubbleSystem from './BubbleSystem.svelte';
import CodeBlock from './CodeBlock.svelte';
import type { LlmProvider } from './types';

export interface Token {
    role: string;
    content: string;
    llmInfo: LlmProvider;
}

export interface GenericReader {
  read(): Promise<{ done: boolean; value: Uint8Array | undefined }>;
}

export function storeTokenHistory(
    tokenHistory: Token[],
    addItem: (item: ListItem) => void,
    clearResult: () => void
): void {
    if (tokenHistory.length > 0) {
        const lastToken = tokenHistory[tokenHistory.length - 1];
        const title = marked.parse(lastToken.content.substring(0, 30)).replace(/<[^>]*>/g, '');
        const newItem: ListItem = {
            id: Date.now(),
            text: title,
            tokenHistory: [...tokenHistory]
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

export async function fetchAi(history: Token[], selectedItem: LlmProvider) {
    const content = JSON.stringify({ messages: history, llm: selectedItem });
    return await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: content
    });
}

class CustomRenderer extends marked.Renderer {
  code(code: string, language: string): string {
    return `<pre><code data-highlighted="true" class="language-${language}">${code}</code></pre>`;
  }
}

const customRenderer = new CustomRenderer();

marked.use(
  markedHighlight({
    langPrefix: 'language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  }),
  {
    mangle: false,
    headerIds: false,
    renderer: customRenderer
  }
);

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

    let lastScrollTime = 0;

    async function processResult(result: { done: boolean; value: Uint8Array | undefined }): Promise<void> {
        const currentTime = Date.now();
        if (currentTime - lastScrollTime > 200) {
            scrollChatBottom(resultDiv, 'smooth');
            lastScrollTime = currentTime;
        }

        if (result.done) {
            parser.finish();
            scrollChatBottom(resultDiv, 'smooth');
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
