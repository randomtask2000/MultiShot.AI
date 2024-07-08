<script lang="ts">
  // https://www.skeleton.dev/elements/chat
  import BubbleSystem from "./BubbleSystem.svelte";
  import BubbleUser from "./BubbleUser.svelte";
  import { onMount } from 'svelte';
  import type { llmProvider } from './types';
  import { listStore, type ListItem } from './store';
  import { marked } from 'marked';
  import hljs from 'highlight.js';

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

  function handleAddItem() {
    listStore.addItem("New Item " + (listItems.length + 1));
  }

  function handleClearList() {
    listStore.clearList();
  }

  // Configure marked to use highlight.js for code syntax highlighting
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

    let divIdUser = addBubble("User", "user");
    await printMessage(divIdUser, token).then(() => {
      //scrollToBottomOfDiv();
    });

    const response = await fetchAi(tokenHistory);

    if (!response.body) {
      throw new Error('Response body is null');
    }

    await printResponse(response.body.getReader(), new TextDecoder('utf-8'), addBubble("AI", "ai")).then(content => {
      tokenHistory.push({ role: "assistant", content });
      //scrollToBottomOfDiv();
    });
    clearToken();
  }

  async function printMessage(bubbleId: string, tokens: string) {
    document.getElementById(bubbleId)!.innerHTML += tokens;
  }

  async function fetchAi(history: { role: string, content: string }[]) {
    let content = JSON.stringify({ messages: history, llm: selectedItem.selector });
    return await fetch('http://localhost:8000/stream_history/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: content
    });
  }

  async function printResponse(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder,
    responseDiv: string
  ): Promise<string> {
    let lastResponse = '';
    const outputElement = document.getElementById(responseDiv)!;
    const parser = new StreamParser(outputElement);

    async function processResult(result: ReadableStreamReadResult<Uint8Array>): Promise<void> {
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
    setTimeout(() => { scrollChatBottom('smooth'); }, 0);
    return lastResponse;
  }

  const random14 = Math.floor(Math.random() * 11) + 10; // generate a random number between 10 and 20
  const random47 = Math.floor(Math.random() * 11) + 10; // generate another random number between 10 and 20
  const addBubble = (person: string, type: "user" | "ai") => {
    if (!person) person = "person";
    const parentDiv = document.createElement('div');
    let bubbleData = {
      color: 'variant-soft-primary',
      name: person,
      timestamp: new Date().toLocaleTimeString(),
      message: "",
      avatar: `https://i.pravatar.cc/?img=${type === "user" ? random14 : random47 }`,
      pid: `pid${Date.now()}`
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

    bubble.id = `div${Date.now()}`;
    resultDiv!.appendChild(parentDiv);
    return bubbleData.pid;
  };

  let elemChat: HTMLElement;
  //export let selectedItem = writable<llmProvider | null>(null);
  //export let selectedItem = writable<llmProvider | null>(null);
  function scrollChatBottom(behavior?: ScrollBehavior): void {
    elemChat.scrollTo({ top: elemChat.scrollHeight, behavior });
  }

  $: if (selectedItem != null) {
    console.log("MultiShotChat: selectedItem has changed:", selectedItem);
    // Place your logic here
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
<div class="container p-4 w-full min-w-350 bg-surface-500/30">
  <div class="grid grid-cols-[150px_1fr] h-full">
    <div id="search" class="grid grid-rows-[1fr_auto] gap-0 hide-on-small">
      <div class="bg-surface-600/30 p-4">(search)</div>
      <div class="bg-surface-600/30 p-4">
        {#each listItems as item (item.id)}
          <div>{item.text}</div>
        {/each}
      </div>
      <div class="bg-surface-600/30 p-4">
        <button on:click={handleClearList}>Clear List</button>
      </div>
      <div class="bg-surface-600/30 p-4">(footer)</div>
    </div>
    <div id="chat" class="grid grid-rows-[1fr_auto] gap-0">
      <div id="resultOuter" bind:this={elemChat} class="bg-surface-800/30 p-4 overflow-y-auto h-[60vh]">
        <div id="result" bind:this={resultDiv} class="h-full" />
      </div>
      <div class="bg-surface-500/30 p-4">
        <div class="input-group input-group-divider grid-cols-[auto_1fr_auto_auto] rounded-container-token">
          <button class="input-group-shim" on:click={sendUserTokenAiHistory}>+</button>
          <textarea
            bind:value={tokenVar}
            class="font-nunito bg-transparent border-0 ring-0"
            name="tokenInput"
            id="tokenInput"
            placeholder="Write a message..."
            rows="1"
            on:keydown={checkForReturnKey}
          />
          <button class="font-nunito variant-filled-secondary" on:click={handleAddItem}>New</button>
          <button class="font-nunito variant-filled-primary" on:click={sendUserTokenAiHistory}>Send</button>
        </div>
      </div>
    </div>
  </div>
</div>
