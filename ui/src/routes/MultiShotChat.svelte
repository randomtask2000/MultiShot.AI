<script lang="ts">
import BubbleSystem from "./BubbleSystem.svelte";
import BubbleUser from "./BubbleUser.svelte";
import { onMount } from 'svelte';
import type { llmProvider } from './types';
import { listStore, type ListItem } from './store';
import { marked } from 'marked';
import hljs from 'highlight.js';
import type { ReadableStreamReadResult } from 'stream/web';
//import type { ScrollBehavior } from 'csstype';
import type { ComponentProps } from 'svelte';

type ScrollIntoViewOptions = NonNullable<Parameters<Element['scrollIntoView']>[0]>;
type ScrollBehavior = ScrollIntoViewOptions['behavior'];
//import type { ScrollBehavior } from 'csstype';
//import type { ReadableStreamDefaultReader, ReadableStreamReadResult, ScrollBehavior } from 'node_modules/typescript/lib/lib.dom.d.ts';
import { afterUpdate } from 'svelte';

let listItems: ListItem[];
const unsubscribe = listStore.subscribe(value => {
  listItems = value;
});

onMount(() => {
  listStore.init();
  return () => {
    unsubscribe();
  };
});

function storeTokenHistory() {
  if (tokenHistory.length > 0) {
    const title = tokenHistory[0].content.substring(0,7) + `...(${listItems.length + 1})`
    const newItem: ListItem = {
      id: Date.now(),
      text: title,
      tokenHistory: [...tokenHistory]
    };
    listStore.addItem(newItem);
    tokenHistory = [];
    clearResult();
  }
}

function handleAddItem() {
  storeTokenHistory();
  clearToken();
}

function handleClearList() {
  listStore.clearList();
}

function restoreChat(item: ListItem): void {
  let tokenHistory: Array<{ role: string; content: string }> = [...item.tokenHistory];
  clearResult();
  tokenHistory.forEach((token) => {
    const type: 'user' | 'ai' = token.role === 'user' ? 'user' : 'ai';
    const { bubbleId, pid } = addBubble(type, type);
    if (bubbleId !== undefined && pid !== undefined) {
      printMessage(pid, token.content);
      setTimeout(() => {
        scrollChatBottom('smooth');
      }, 500);
    }
  });
}

marked.setOptions({
  highlight: function (code: string, lang: string) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
});

export let selectedItem: llmProvider;
let tokenVar: string = '';
let tokenHistory: { role: string, content: string }[] = [];
let resultDiv: HTMLDivElement;

class StreamParser {
  private outputElement: HTMLElement;
  private buffer: string = '';

  constructor(outputElement: HTMLElement) {
    this.outputElement = outputElement;
  }

  processChunk(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    while (lines.length > 1) {
      const line = lines.shift();
      if (line !== undefined) {
        this.processLine(line);
      }
    }
    this.buffer = lines[0];
  }

  private processLine(line: string): void {
    const html = marked(line);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    while (tempDiv.firstChild) {
      this.outputElement.appendChild(tempDiv.firstChild);
    }
  }

  finish(): void {
    if (this.buffer) {
      this.processLine(this.buffer);
      this.buffer = '';
    }
  }
}

const clearToken = () => {
  tokenVar = '';
};

const clearResult = () => {
  if (resultDiv) {
    resultDiv.innerHTML = '';
  }
};

const checkForReturnKey = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendUserTokenAiHistory();
  }
};

function getToken() {
  return tokenVar;
}

async function sendUserTokenAiHistory() {
  const token = getToken();
  tokenHistory.push({ role: "user", content: token });
  let { pid: divIdUser } = addBubble("User", "user");
  printMessage(divIdUser, token);
  const response = await fetchAi(tokenHistory);
  if (!response.body) {
    throw new Error('Response body is null');
  }
  let { pid: aiPid } = addBubble("AI", "ai");
  const content = await printResponse(response.body.getReader(), new TextDecoder('utf-8'), aiPid);
  tokenHistory.push({ role: "assistant", content });
  clearToken();
}

function printMessage(pid: string, tokens: string): void {
  document.getElementById(pid)!.innerHTML += tokens;
}

async function fetchAi(history: { role: string, content: string }[]) {
  let content = JSON.stringify({ messages: history, llm: selectedItem.selector });
  return await fetch('http://localhost:8000/stream_history/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: content
  });
}

async function printResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  responsePid: string
): Promise<string> {
  let lastResponse = '';
  const outputElement = document.getElementById(responsePid)!;
  const parser = new StreamParser(outputElement);

  async function processResult(result: ReadableStreamReadResult<Uint8Array>): Promise<void> {
    if (Date.now() % 2000 < 1000) {
      setTimeout(() => {
        scrollChatBottom('smooth');
      }, 0);
    }
    if (result.done) {
      parser.finish();
      return;
    }
    let token = decoder.decode(result.value);
    lastResponse += token;
    parser.processChunk(token);
    return reader.read().then(processResult);
  }
  await reader.read().then(processResult);
  return lastResponse;
}

const random14 = Math.floor(Math.random() * 11) + 10;
const random47 = Math.floor(Math.random() * 11) + 10;

const addBubble = (person: string, type: "user" | "ai"): { bubbleId: string, pid: string } => {
  if (!resultDiv) {
    console.error('resultDiv is not initialized');
    return { bubbleId: '', pid: '' };
  }
  if (!person) person = "person";
  const parentDiv = document.createElement('div');
  let bubbleData = {
    color: 'variant-soft-primary',
    name: person,
    timestamp: new Date().toLocaleTimeString(),
    message: "",
    avatar: `https://i.pravatar.cc/?img=${type === "user" ? random14 : random47}`,
    pid: `pid${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
  resultDiv!.appendChild(parentDiv);
  return { bubbleId, pid: bubbleData.pid };
};

let elemChat: HTMLDivElement;
let shouldScrollToBottom = true;

function scrollChatBottom(behavior: ScrollBehavior = 'auto'): void {
    resultDiv.lastElementChild?.scrollIntoView({ behavior, block: 'end' });
}

function handleScroll(): void {
  const bottomThreshold = 20; // pixels from bottom
  if (elemChat) {
    shouldScrollToBottom =
      elemChat.scrollHeight - elemChat.scrollTop - elemChat.clientHeight <= bottomThreshold;
  }
}

afterUpdate(() => {
  scrollChatBottom();
});

$: if (selectedItem != null) {
  console.log("MultiShotChat: selectedItem has changed:", selectedItem);
}

</script>

<svelte:head>
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.max.css" as="style">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.max.css">
</svelte:head>

<style>
.hide-on-small {
  display: none;
}
@media (min-width: 601px) {
  .hide-on-small {
    display: block;
  }
}
:global(.output pre) {
  background-color: #e4e4e4;
  padding: 0.5em;
  border-radius: 2px;
}
:global(.output code) {
  font-family: 'Courier New', Courier, monospace;
}
</style>

<div class="max-w-screen">
  <div class="grid grid-cols-[150px_1fr] h-[calc(100vh-74px)]">
    <div id="search" class="grid grid-rows-[1fr_auto] gap-0 hide-on-small">
      <div class="bg-surface-600/30 p-4 text-gray-500">(search)</div>
      <div class="bg-surface-600/30 p-4">
        {#each listItems as item (item.id)}
          <button class="font-nunito variant-filled-secondary p-1"
                  on:click={() => restoreChat(item)}
                  on:keydown={(e) => e.key === 'Enter' && restoreChat(item)}
                  title={item.tokenHistory[0].content.substring(0, 30)}>
            {item.text}
          </button>
        {/each}
      </div>
      <div class="bg-surface-600/30 p-4">
        <button class="btn variant-filled-primary" on:click={handleClearList} title="clear the list">Clear List</button>
      </div>
      <div class="bg-surface-600/30 p-4 text-gray-500">(footer)</div>
    </div>
    <div id="chat" class="grid grid-rows-[1fr_auto] gap-0">
      <div id="resultOuter" bind:this={elemChat}
           on:scroll={handleScroll}
           class="bg-surface-800/30 p-4 h-[calc(100vh-148px)] overflow-y-auto">
        <div id="result" bind:this={resultDiv}></div>
      </div>
      <div class="bg-surface-500/30 p-4">
        <div class="input-group input-group-divider grid-cols-[auto_1fr_auto_auto] rounded-container-token">
          <button class="input-group-shim" on:click={sendUserTokenAiHistory}>+</button>
          <textarea bind:value={tokenVar}
                    class="font-nunito bg-transparent border-0 ring-0"
                    name="tokenInput"
                    id="tokenInput"
                    placeholder="Write a message..."
                    rows="1"
                    on:keydown={checkForReturnKey} />
          <button class="font-nunito variant-filled-secondary" on:click={handleAddItem}>New</button>
          <button class="font-nunito variant-filled-primary" on:click={sendUserTokenAiHistory}>Send</button>
        </div>
      </div>
    </div>
  </div>
</div>
