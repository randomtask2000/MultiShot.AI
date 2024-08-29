// tokenUtils.ts
import { type ChatHistoryItem } from './types';
import BubbleUser from './BubbleUser.svelte';
import BubbleSystem from './BubbleSystem.svelte';
import { type Token, type GenericReader, type LlmProvider, type Bubble } from './types';
import {
  renderMarkdownWithCodeBlock,
  renderMarkdown,
  renderMarkdownHistory,
  StreamParser
} from './markdownUtils';
import * as webllm from "@mlc-ai/web-llm";

let engine: webllm.MLCEngine | null = null;

export async function initializeWebLLM(model: string) {
    if (!engine) {
        engine = new webllm.MLCEngine();
        await engine.reload(model);
    }
}

export function storeTokenHistory(
    tokenHistory: Token[],
    addItem: (item: ChatHistoryItem) => void,
    clearResult: () => void,
    currentLlmProvider: LlmProvider
): void {
    if (tokenHistory.length > 0) {
        const lastToken = tokenHistory[tokenHistory.length - 1];
        const title = renderMarkdown(lastToken.content.substring(0, 30)).replace(/<[^>]*>/g, '');
        const newItem: ChatHistoryItem = {
            id: Date.now(),
            createdAt: new Date(),
            text: title,
            tokenHistory: [...tokenHistory],
            llmProvider: { ...currentLlmProvider }
        };
        addItem(newItem);
        clearResult();
    }
}

export function scrollChatBottom(resultDiv: HTMLDivElement, behavior: ScrollBehavior = 'auto'): void {
    resultDiv.lastElementChild?.scrollIntoView({ behavior, block: 'end' });
}

export function handleScroll(elemChat: HTMLDivElement): boolean {
    const bottomThreshold = 20;
    return elemChat ? (elemChat.scrollHeight - elemChat.scrollTop - elemChat.clientHeight <= bottomThreshold) : false;
}

export function addBubble(selectedLlm: LlmProvider, resultDiv: HTMLDivElement, person: string, type: "user" | "ai"): { bubbleId: string, pid: string } {
    if (!resultDiv) {
        console.error('resultDiv is not initialized');
        return { bubbleId: '', pid: '' };
    }
    person = person || "person";
    const parentDiv = document.createElement('div');
    const bubbleId = `div${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const bubbleData: Bubble = {
        color: 'variant-soft-primary',
        name: person,
        timestamp: new Date().toLocaleTimeString(),
        message: "",
        avatar: `https://i.pravatar.cc/?img=${type === "user" ? Math.floor(Math.random() * 11) + 10 : Math.floor(Math.random() * 11) + 10}`,
        icon: selectedLlm.icon,
        llmProvider: selectedLlm,
        pid: `pid${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    // leave this in or else it's not working
    const bubble = type === "user" ? new BubbleUser({ target: parentDiv, props: { bubble: bubbleData } }) :
                                     new BubbleSystem({ target: parentDiv, props: { bubble: bubbleData } });
    parentDiv.id = bubbleId;
    resultDiv.appendChild(parentDiv);
    return { bubbleId, pid: bubbleData.pid };
}    

/**
* Prints a message to a specific element identified by its pid.
* 
* @param pid - The unique identifier of the element where the message will be printed.
* @param tokens - The message content to be printed.
*/
export function printMessage(pid: string, tokens: string): void {
    const element = document.getElementById(pid);
    if (element) {
        const parser = new StreamParser(element);
        parser.processChunk(tokens);
        parser.finish();
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

    async function processResult(result: { done: boolean; value: any }): Promise<void> {
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
            let token;
            if (typeof result.value === 'string') {
                token = result.value;
            } else if (result.value instanceof Uint8Array) {
                token = decoder.decode(result.value);
            } else if (result.value.choices && result.value.choices[0].delta.content) {
                token = result.value.choices[0].delta.content;
            } else {
                return;
            }
            lastResponse += token;
            parser.processChunk(token);

            await new Promise(resolve => setTimeout(resolve, 10));
        }
        return reader.read().then(processResult);
    }
    await reader.read().then(processResult);
    return lastResponse;
}

export { renderMarkdownWithCodeBlock, renderMarkdown, renderMarkdownHistory };

/*
* fetch ai code!
*
*
* */


export async function fetchAi(history: Token[], selectedLlmProvider: LlmProvider) {
    if (selectedLlmProvider.provider === "webllm") {
        return await handleWithRetry((attempt) => handleWebllmProvider(history, selectedLlmProvider, 2, attempt), 2);
    } else {
        const content = JSON.stringify({ messages: history, llm: selectedLlmProvider });
        return await fetch('http://localhost:8000/chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: content
        });
    }
}

async function handleWebllmProvider(
  history: Token[],
  selectedLlmProvider: LlmProvider,
  retries: number,
  attempt: number
) {
    if (!engine) {
        engine = new webllm.MLCEngine();
        await engine.reload(selectedLlmProvider.model);
    }

    if (attempt > 0 && history.length > 2) {
        history = [history[0], history[history.length - 1]];
        console.log("History length is being pruned to first and last to handle context limits")
    }

    // Extract messages while keeping total content under 2056 characters
    let extractedMessages: webllm.ChatCompletionMessageParam[] = [];

    extractedMessages = history.map(token => ({
        role: token.role as "system" | "user" | "assistant",
        content: token.content
    }));

    const stream = await engine.chat.completions.create({
        messages: extractedMessages,
        stream: true,
        temperature: 1.0,
        top_p: 1
    });

    const iterator = stream[Symbol.asyncIterator]();

    return {
        body: {
            getReader: () => ({
                async read() {
                    const { done, value } = await iterator.next();
                    if (done) return { done: true, value: undefined };
                    return { done: false, value: value.choices[0].delta.content };
                }
            })
        }
    };
}

async function handleWithRetry(fn: (attempt: number) => Promise<any>, retries: number) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn(attempt);
        } catch (error) {
            if (attempt === retries) {
                throw error; // rethrow if it's the last attempt
            }
        }
    }
}
