import { type ListItem } from './store';
import { marked } from 'marked';
import hljs from 'highlight.js';
import BubbleUser from './BubbleUser.svelte';
import BubbleSystem from './BubbleSystem.svelte';

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


export async function fetchAi(history: { role: string, content: string }[], selectedItem: { selector: string }) {
    const content = JSON.stringify({ messages: history, llm: selectedItem.selector });
    return await fetch('http://localhost:8000/stream_history/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: content
    });
}

// Function to safely render markdown
export function renderMarkdown(content: string) {
    return marked.parse(content);
}

// Configure marked with highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-'
});

export class StreamParser {
    private outputElement: HTMLElement;
    private buffer: string = '';
    private codeBlock: string | null = null;

    constructor(outputElement: HTMLElement) {
        this.outputElement = outputElement;
    }

    processChunk(chunk: string): void {
        this.buffer += chunk;
        this.processBuffer();
    }

    private processBuffer(): void {
        const lines = this.buffer.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
            this.processLine(lines[i]);
        }
        this.buffer = lines[lines.length - 1];
    }

    private processLine(line: string): void {
        if (this.codeBlock !== null) {
            if (line.trim() === '```') {
                this.renderCodeBlock();
                this.codeBlock = null;
            } else {
                this.codeBlock += line + '\n';
            }
        } else if (line.startsWith('```')) {
            this.codeBlock = line.slice(3) + '\n';
        } else {
            this.renderMarkdown(line);
        }
    }

    private renderMarkdown(line: string): void {
        const html = marked(line);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        while (tempDiv.firstChild) {
            this.outputElement.appendChild(tempDiv.firstChild);
        }
    }

    private renderCodeBlock(): void {
        if (this.codeBlock) {
            const html = marked('```' + this.codeBlock + '```');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            while (tempDiv.firstChild) {
                this.outputElement.appendChild(tempDiv.firstChild);
            }
        }
    }

    finish(): void {
        if (this.codeBlock !== null) {
            this.renderCodeBlock();
        } else if (this.buffer) {
            this.renderMarkdown(this.buffer);
        }
        this.buffer = '';
        this.codeBlock = null;
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

// ... rest of the code ...

