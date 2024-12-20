// tokenUtils.ts
import { AnimationType, type ChatHistoryItem } from './types';
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
//import { ContextWindowSizeExceededError } from '@mlc-ai/web-llm/lib/error';

export let engine: webllm.MLCEngine | null = null;

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

/**
 * Adds a chat bubble to the specified result div element.
 * 
 * @param selectedLlm - The LLM provider to be associated with the bubble.
 * @param resultDiv - The HTMLDivElement where the bubble will be appended.
 * @param person - The name of the person associated with the bubble. Defaults to "person" if not provided.
 * @param type - Specifies whether the bubble is for a "user" or "ai".
 * 
 * @returns An object containing the bubbleId and pid of the created bubble.
 * 
 * @throws Will log an error to the console and return an empty bubbleId and pid if the resultDiv is not initialized.
 */
export function addBubble(selectedLlm: LlmProvider, resultDiv: HTMLDivElement, 
    person: string, type: "user" | "ai", 
    selectedAnimationMultiShot: AnimationType = AnimationType.None): 
    { bubbleId: string, pid: string } {

    if (!resultDiv) {
        console.error('resultDiv is not initialized');
        return { bubbleId: '', pid: '' };
    }
    person = person || "person";
    const parentDiv: HTMLDivElement = document.createElement('div');
    const bubbleId: string = `div${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const bubbleData: Bubble = {
        color: 'variant-soft-primary',
        name: person,
        timestamp: new Date().toLocaleTimeString(),
        message: "",
        avatar: `https://i.pravatar.cc/?img=${type === "user" ? Math.floor(Math.random() * 11) + 10 : Math.floor(Math.random() * 11) + 10}`,
        icon: selectedLlm.icon,
        llmProvider: selectedLlm,
        pid: `pid${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        animationType: selectedAnimationMultiShot
    };
    // leave this in or else it's not working
    const bubble: BubbleUser | BubbleSystem = type === "user" ? new BubbleUser({ target: parentDiv, props: { bubble: bubbleData } }) :
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

export function printUserMessage(pid: string, tokens: string): void {
    const element = document.getElementById(pid);
    if (element) {
        // set element innerHTML to tokens
        element.innerHTML = tokens;
    } else {
        console.warn(`Element with id ${pid} not found`);
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

function removeMessagesByLength(messages: Token[]): Token[] {
    return messages.filter(message => {
    if (message.content.length > 1024) {
        console.log(`Pruning message: ${message.content.substring(0, 50)}...`);
        return false;
    }
    return true;
});

  }
/**
 * Fetches AI response based on the provided history and selected LLM provider.
 * 
 * @param history - An array of tokens representing the chat history.
 * @param selectedLlmProvider - The LLM provider to use for generating the AI response.
 * 
 * @returns A promise that resolves to the AI response.
 * 
 * @throws Will attempt to retry the request if the provider is "webllm" up to a specified number of times.
 * For other providers, it will directly fetch the response from the specified endpoint.
 */
export async function fetchAi(history: Token[], selectedLlmProvider: LlmProvider) {
    if (selectedLlmProvider.provider === "webllm") {
        // Attempts to handle the request with retry mechanism for "webllm" provider.
        // if (history.length > 1) {
        //     //history = [history[0], history[history.length - 1]];
        //     //TODO: this is a hack to get around the context limit of .... tokens for webllm
        //     history = removeMessagesByLength(history);
        //     console.log("History length is being pruned to first and last to handle context limits");
        // }
        //return await handleWithRetry((attempt) => handleWebllmProvider(history, selectedLlmProvider, maxRetries, attempt), maxRetries);
        return await handleWebllmProvider(history, selectedLlmProvider, maxRetries, 0);
    } else {
        // Constructs the request payload and fetches the response from the local server for other providers.
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
const maxRetries: number = 3;
/**
 * Handles the AI response generation for the "webllm" provider.
 * 
 * @param history - An array of tokens representing the chat history.
 * @param selectedLlmProvider - The LLM provider to use for generating the AI response.
 * @param retries - The number of retries allowed for handling the request.
 * @param attempt - The current attempt number.
 * 
 * @returns A promise that resolves to an object simulating a ReadableStream for streaming the AI response.
 * 
 * @throws Will log a message and prune the history to the first and last elements if the attempt is greater than 0 and history length is more than 2.
 * If the engine is not initialized, it will initialize and reload the model specified by the selectedLlmProvider.
 */
async function handleWebllmProvider(
    history: Token[],
    selectedLlmProvider: LlmProvider,
    retries: number,
    attempt: number
  ) {
    try {
      // Prune the history to the first and last elements if conditions are met.
        //   if (attempt > 1 && history.length > 2) {
        //     history = [history[0], history[history.length - 1]];
        //     console.log("History length is being pruned to first and last to handle context limits");
        //   }
      // Extract messages from history while keeping the total content under 2056 characters.
      let extractedMessages: webllm.ChatCompletionMessageParam[] = [];
      extractedMessages = history.map(token => ({
        role: token.role as "system" | "user" | "assistant",
        content: token.content
      }));

      // Initialize the engine if it's not already initialized.
      if (!engine) {
        //initializeWebLLM(selectedLlmProvider.model);
        initializeWebLLMContextWindowSize(selectedLlmProvider.model);
      }

      // Create a stream for generating AI responses.
      const stream = await engine.chat.completions.create({
        messages: extractedMessages,
        stream: true,
        temperature: 0.9,
        top_p: 1
      });
      // Create an async iterator for the stream.
      const iterator = stream[Symbol.asyncIterator]();
      // Return an object simulating a ReadableStream for streaming the AI response.
      return createStreamResponse(iterator);
    } catch (error) {
      console.error('Error in handleWebllmProvider:', error);
      throw new CustomError('Error in handleWebllmProvider', error as Error);
    }
  }


function createStreamResponse(iterator: AsyncIterator<any>) {
    return {
      body: {
        getReader: () => ({
          async read() {
            try {
              const { done, value } = await iterator.next();
              if (done) return { done: true, value: undefined };
              return { done: false, value: value.choices[0].delta.content };
            } catch (error) {
              console.error('Context window size exceeded:', error);
              throw new CustomError('Context window size exceeded', error as Error);
            }
          }
        })
      }
    };
  }

  class CustomError extends Error {
    constructor(message: string, public originalError: Error) {
      super(message);
      this.name = 'CustomError';
    }
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

export async function initializeWebLLM(
    model: string,
    progressCallback?: (report: webllm.InitProgressReport) => void
) {
    let basicInit: boolean = true;
    if (!engine)
    {
        if (basicInit) 
        {
            engine = await webllm.CreateMLCEngine(
                model,
                {
                    initProgressCallback: progressCallback,
                    logLevel: "INFO",
                }
            );
        } 
        else 
        {
            initializeWebLLMContextWindowSize(model, progressCallback);
        }
    }
}

export async function initializeWebLLMContextWindowSize(
    model: string,
    progressCallback?: (report: webllm.InitProgressReport) => void,
    contextWindowSize: number = 4096
) {
    if (!engine) {
        engine = await webllm.CreateMLCEngine(
            model,
            {
                initProgressCallback: progressCallback,
                logLevel: "INFO",
            },
            {
                temperature: 0.0,
                top_p: 0.9,
                // context_window_size: 8192,
                context_window_size: -1,
                sliding_window_size: 4096,
                // sliding window with glued start
                attention_sink_size: 256,
            }

            
        );
    }
}

export async function initializeWebLLMWithForce(
    model: string,
    progressCallback?: (report: webllm.InitProgressReport) => void,
    forceRecreate: boolean = false
) {
    if (forceRecreate && engine) {
        await engine.unload();
        engine = null;
    }
    
    await initializeWebLLM(model, progressCallback);
}
