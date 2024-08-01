// markdownUtils.ts
import { marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import CodeBlock from './CodeBlock.svelte';

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
      this.codeBlockContent += line + '\n';
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
        this.renderMarkdown(line + '');
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
