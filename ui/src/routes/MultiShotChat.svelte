<script lang="ts">
import { onMount } from 'svelte';
import { type llmProvider, Items } from './types';
import { listStore, type ListItem } from './store';
import { afterUpdate } from 'svelte';
import {
  storeTokenHistory,
  type Token,
  scrollChatBottom,
  addBubble,
  printMessage,
  fetchAi,
  printResponse,
  type GenericReader,
  renderMarkdownWithCodeBlock
} from './tokenUtils';
  import Icon from '@iconify/svelte'

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
  storeTokenHistory(tokenHistory, listItems, listStore.addItem, clearResult);
  clearToken();
}

function handleClearList() {
  listStore.clearList();
}

function restoreChat(item: ListItem): void {
  let tokenHistory: { role: string; content: string }[] = [...item.tokenHistory];
  clearResult();
  tokenHistory.forEach((token) => {
    const type: 'user' | 'ai' = token.role === 'user' ? 'user' : 'ai';
    const { bubbleId, pid } = addBubble(resultDiv, type, type);
    if (bubbleId !== undefined && pid !== undefined) {
      const contentElement = document.getElementById(pid);
      if (contentElement) {
        renderMarkdownWithCodeBlock(token.content, contentElement);
      }
      setTimeout(() => {
        scrollChatBottom(resultDiv, 'smooth');
      }, 500);
    }
  });
}

export let selectedItem: llmProvider;
let tokenVar: string = '';
let tokenHistory: Token[] = [];
let resultDiv: HTMLDivElement;

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
  let { pid: divIdUser } = addBubble(resultDiv, "User", "user");
  printMessage(divIdUser, token);
  const response = await fetchAi(tokenHistory, selectedItem);
  if (!response.body) {
    throw new Error('Response body is null');
  }
  let { pid: aiPid } = addBubble(resultDiv, "AI", "ai");
  const content = await printResponse(resultDiv, response.body.getReader() as GenericReader, new TextDecoder('utf-8'), aiPid);
  tokenHistory.push({ role: "assistant", content });
  clearToken();
}

let elemChat: HTMLDivElement;

afterUpdate(() => {
  scrollChatBottom(resultDiv);
});

$: if (selectedItem != null) {
  console.log("MultiShotChat: selectedItem has changed:", selectedItem);
}

</script>

<svelte:head>
<!--<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css" as="style">-->
<!--<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css">-->
<!--  -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/styles/default.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/highlight.min.js"></script>

</svelte:head>

<style>


</style>

<div class="max-w-screen">
  <div class="grid grid-cols-[150px_1fr] h-[calc(100vh-74px)]">
    <div id="search" class="grid grid-rows-[1fr_auto] gap-0 hide-on-small">
      <div class="bg-surface-600/30 p-4 text-gray-500">(search)</div>
      <div class="bg-surface-600/30 p-4">
        {#each listItems as item (item.id)}
          <button class="font-nunito variant-filled-secondary p-1 rounded-md"
                  on:click={() => restoreChat(item)}
                  on:keydown={(e) => e.key === 'Enter' && restoreChat(item)}
                  title={item.tokenHistory[0].content.substring(0, 30)}>
            {@html item.text}
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
           class="bg-surface-800/30 p-4 h-[calc(100vh-148px)] overflow-y-auto">
        <div id="result" bind:this={resultDiv}></div>
      </div>
      <div class="bg-surface-500/30 p-4">
        <div class="input-group input-group-divider grid-cols-[auto_auto_1fr_auto] rounded-full overflow-hidden pr-11 relative">
          <button class="input-group-shim" on:click={sendUserTokenAiHistory}>+</button>
          <button class="w-2/3 h-full bg-transparent border-none" on:click={handleAddItem} name="save">
            <Icon icon="ic:twotone-save-alt" class="w-full h-full" />
          </button>
          <textarea bind:value={tokenVar}
                    class="w-full font-nunito bg-transparent border-0 ring-0 right-5"
                    name="tokenInput"
                    id="tokenInput"
                    placeholder="Write a message..."
                    rows="1"
                    on:keydown={checkForReturnKey} />
          <button
            class="absolute -right-2.5 top-1 bottom-1 bg-transparent flex items-center justify-center transition-all duration-300 ease-in-out hover:scale-110"
            on:click={sendUserTokenAiHistory}
            name="send"
          >
            <Icon
              icon="ph:arrow-circle-up-fill"
              class="w-full h-full transition-all duration-300 ease-in-out hover:text-blue-400 hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
