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
  private cursorElement: HTMLSpanElement;
  private styleElement: HTMLStyleElement;
  private cursorInterval: number | null = null;

  constructor(private container: HTMLElement) {
    this.cursorElement = document.createElement('span');
    this.cursorElement.className = 'cursor';
    this.cursorElement.textContent = '  ▋';

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      .cursor {
        display: inline-block;
        width: 0.1em;
        height: 1.2em;
        animation: blink 1s step-end infinite;
        vertical-align: middle;
        margin-left: 2px;
        font-weight: normal;
        color: inherit;
      }
      @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(this.styleElement);
    this.startCursorAnimation();
  }

  private startCursorAnimation(): void {
    this.cursorInterval = window.setInterval(() => {
      this.cursorElement.style.visibility =
        this.cursorElement.style.visibility === 'hidden' ? 'visible' : 'hidden';
    }, 1000);
  }

  public processChunk(chunk: string): void {
    this.content += chunk;

    // Parse and sanitize the entire content
    const parsedContent = marked.parse(this.content);
    const sanitizedContent = this.basicSanitize(parsedContent);

    // Create a temporary element to hold the content
    const tempElement = document.createElement('div');
    tempElement.innerHTML = sanitizedContent;

    // Find the last text node
    const lastTextNode = this.findLastTextNode(tempElement);

    if (lastTextNode && lastTextNode.parentNode) {
      // Split the text node and insert the cursor
      const textAfterCursor = lastTextNode.splitText(lastTextNode.length);
      lastTextNode.parentNode.insertBefore(this.cursorElement, textAfterCursor);
    } else {
      // If no text node found, just append the cursor
      tempElement.appendChild(this.cursorElement);
    }

    // Update the main container
    this.container.innerHTML = tempElement.innerHTML;

    // Scroll to the bottom to keep the cursor in view
    this.container.scrollTop = this.container.scrollHeight;
  }

  private findLastTextNode(node: Node): Text | null {
    if (node.nodeType === Node.TEXT_NODE && node.textContent!.trim() !== '') {
      return node as Text;
    }
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      const lastTextNode = this.findLastTextNode(node.childNodes[i]);
      if (lastTextNode) {
        return lastTextNode;
      }
    }
    return null;
  }

  public finish(): void {
    if (this.cursorInterval !== null) {
      clearInterval(this.cursorInterval);
    }

    // Parse and sanitize the final content without the cursor
    const parsedContent = marked.parse(this.content);
    const sanitizedContent = this.basicSanitize(parsedContent);

    // Update the container with the final content (without cursor)
    this.container.innerHTML = sanitizedContent;

    this.styleElement.remove();
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
