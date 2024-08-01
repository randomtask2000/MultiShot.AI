// tokenUtils.ts
import { type ListItem } from './store';
import BubbleUser from './BubbleUser.svelte';
import BubbleSystem from './BubbleSystem.svelte';
import { type Token, type GenericReader, type LlmProvider } from './types';
import {
  renderMarkdownWithCodeBlock,
  renderMarkdown,
  renderMarkdownHistory,
  StreamParser
} from './markdownUtils';

export function storeTokenHistory(
    tokenHistory: Token[],
    addItem: (item: ListItem) => void,
    clearResult: () => void
): void {
    if (tokenHistory.length > 0) {
        const lastToken = tokenHistory[tokenHistory.length - 1];
        const title = renderMarkdown(lastToken.content.substring(0, 30)).replace(/<[^>]*>/g, '');
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
    const bubbleId = `div${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
    parentDiv.id = bubbleId;
    resultDiv.appendChild(parentDiv);
    return { bubbleId, pid: bubbleData.pid };
}

export function printMessage(pid: string, tokens: string): void {
    const element = document.getElementById(pid);
    if (element) {
        const parser = new StreamParser(element);
        parser.processChunk(tokens);
        parser.finish();
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

            // Add a small delay to make the cursor blinking visible
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        return reader.read().then(processResult);
    }
    await reader.read().then(processResult);
    return lastResponse;
}

export { renderMarkdownWithCodeBlock, renderMarkdown, renderMarkdownHistory };
