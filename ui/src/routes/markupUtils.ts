import { marked } from 'marked';
import hljs from 'highlight.js';
import CodeBlock from './CodeBlock.svelte';
//import { scrollChatBottom } from './tokenUtils';
//import type { GenericReader } from './tokenUtils';

class CustomRenderer extends marked.Renderer {
  codeStart(language: string): string {
    return ``;
  }
  codeEnd(): string {
    return ``;
  }
  code(code: string, language: string): string {
    const validLanguage = language && hljs.getLanguage(language) ? language : 'python';
    const highlightedCode = hljs.highlight(code, { language: validLanguage }).value;
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

/*export async function printResponse(
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
}*/
