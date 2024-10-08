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
  private content: string = '';
  private isCompleted: boolean = false;
  private onCompleteCallback: () => void = () => {};

  constructor(private container: HTMLElement) {
    //this.onCompleteCallback = onComplete || (() => {});
  }

  public processChunk(chunk: string): void {
    this.content += chunk;
    const parsedHtml = marked.parse(this.content);
    const sanitizedHtml = this.basicSanitize(parsedHtml);
    this.container.innerHTML = sanitizedHtml;

    // Add blinking cursor
    const cursorSpan = document.createElement('span');
    cursorSpan.className = 'blinking-cursor';
    cursorSpan.textContent = '▋';
    this.container.appendChild(cursorSpan);
  }

  public finish(): void {
    const parsedHtml = marked.parse(this.content);
    const sanitizedHtml = this.basicSanitize(parsedHtml);
    this.container.innerHTML = sanitizedHtml;
    this.isCompleted = true;
    this.onCompleteCallback();
  }

  public isAnimationCompleted(): boolean {
    return this.isCompleted;
  }

  public setOnCompleteCallback(callback: () => void): void {
    this.onCompleteCallback = callback;
  }

  private basicSanitize(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const body = doc.body;

    // Remove potentially dangerous elements
    const dangerousElements = body.querySelectorAll('script, iframe, object, embed');
    dangerousElements.forEach(el => el.remove());

    // Remove potentially dangerous attributes
    const allElements = body.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      for (let j = 0; j < el.attributes.length; j++) {
        const attr = el.attributes[j];
        if (attr.name.startsWith('on') || attr.name === 'href' && attr.value.toLowerCase().startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      }
    }

    return body.innerHTML;
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
