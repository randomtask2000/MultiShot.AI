// markdownUtils.ts
import { marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import CodeBlock from './CodeBlock.svelte';
import { StreamParserNoCursor } from './markupUtils';

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
  const parser = new StreamParserNoCursor(outputElement);
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

// StreamParser
export class StreamParser {
  private content: string = '';
  private isCompleted: boolean = false;
  private onCompleteCallback: () => void = () => {};
  private cursorElement: HTMLSpanElement;
  private styleElement: HTMLStyleElement;
  private cursorInterval: number | null = null;
  private inCodeBlock: boolean = false;
  private codeBlockComponent: CodeBlock | null = null;
  private codeBlockContent: string = '';
  private currentLanguage: string = '';
  private outputElement: HTMLElement;
  private contentFragments: Array<{type: 'text' | 'code', content: string, language?: string}> = [];

  constructor(private container: HTMLElement) {
    this.outputElement = container;
    this.cursorElement = document.createElement('span');
    this.cursorElement.className = 'cursor';
    this.cursorElement.textContent = '    ▋';//' █';//' ▋';
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
    }, 250);
  }

  public processChunk(chunk: string): void {
    // if (chunk.includes('`')) {
    //   console.log(`found: "${chunk}"`);
    //   //chunk = '``' + chunk;
    // }
    if (chunk.includes('``')) {
      //console.log('------------Code block detected');
      if (this.inCodeBlock) {
        // End of code block
        this.contentFragments.push({
          type: 'code',
          content: this.codeBlockContent.trim(),
          language: this.currentLanguage
        });
        this.inCodeBlock = false;
        this.codeBlockContent = '';
        this.currentLanguage = '';
      } else {
        // Start of code block
        this.currentLanguage = chunk.slice(3).trim() || 'python';
        this.inCodeBlock = true;
        // Push any accumulated regular content
        if (this.content) {
          this.contentFragments.push({
            type: 'text',
            content: this.content
          });
          this.content = '';
        }
      }
    } else if (this.inCodeBlock) {
      // Inside code block
      this.codeBlockContent += chunk;
    } else {
      // Regular markdown content
      this.content += chunk.replace('`','');
    }

    this.updateDOM();
  }

  private updateDOM(): void {
    // Clear the container
    this.container.innerHTML = '';

    // Render all content fragments
    for (const fragment of this.contentFragments) {
      if (fragment.type === 'text') {
        const parsedContent = marked.parse(fragment.content);
        const sanitizedContent = this.basicSanitize(parsedContent);
        const tempElement = document.createElement('div');
        tempElement.innerHTML = sanitizedContent;
        while (tempElement.firstChild) {
          this.container.appendChild(tempElement.firstChild);
        }
      } else if (fragment.type === 'code') {
        const wrapper = document.createElement('div');
        this.container.appendChild(wrapper);
        new CodeBlock({
          target: wrapper,
          props: {
            content: fragment.content,
            language: fragment.language || 'python'
          }
        });
      }
    }

    // Render current content (if any)
    if (this.content || this.codeBlockContent) {
      let currentContent = this.content;
      if (this.inCodeBlock) {
        const wrapper = document.createElement('div');
        this.container.appendChild(wrapper);
        this.codeBlockComponent = new CodeBlock({
          target: wrapper,
          props: {
            content: this.codeBlockContent,
            language: this.currentLanguage || 'python'
          }
        });
        currentContent = this.codeBlockContent;
      } else {
        const parsedContent = marked.parse(this.content);
        const sanitizedContent = this.basicSanitize(parsedContent);
        const tempElement = document.createElement('div');
        tempElement.innerHTML = sanitizedContent;
        while (tempElement.firstChild) {
          this.container.appendChild(tempElement.firstChild);
        }
      }

      const lastTextNode = this.findLastTextNode(this.container);
      if (lastTextNode && lastTextNode.parentNode) {
        const textAfterCursor = lastTextNode.splitText(lastTextNode.length);
        lastTextNode.parentNode.insertBefore(this.cursorElement, textAfterCursor);
      } else {
        this.container.appendChild(this.cursorElement);
      }
    } else {
      // If there's no current content, append the cursor to the container
      this.container.appendChild(this.cursorElement);
    }

    // Scroll to the bottom to keep the cursor in view
    this.container.scrollTop = this.container.scrollHeight;
  }

  public finish(): void {
    if (this.cursorInterval !== null) {
      clearInterval(this.cursorInterval);
    }

    // Push any remaining content
    if (this.inCodeBlock) {
      // this.contentFragments.push({
      //   type: 'code',
      //   content: this.codeBlockContent.trim(),
      //   language: this.currentLanguage
      // });
    } else if (this.content) {
      // this.contentFragments.push({
      //   type: 'text',
      //   content: this.content
      // });
    }

    this.updateDOM();
    this.cursorElement.remove();
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