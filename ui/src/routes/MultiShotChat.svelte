<!-- MultiShotChat.svelte -->
<script lang="ts">
import { onMount } from 'svelte';
import { type LlmProvider } from './types';
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
import Icon from '@iconify/svelte';
import { AppBar } from '@skeletonlabs/skeleton';
import ChatHistorySidebar from './ChatHistorySidebar.svelte';
import AppBarContent from './AppBarContent.svelte';
import { fade, fly } from 'svelte/transition';
import { spring } from 'svelte/motion';
import { cubicInOut } from 'svelte/easing';

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
  storeTokenHistory(tokenHistory, listStore.addItem, clearResultDiv);
  tokenHistory = [];
  clearToken();
}

function handleClearList() {
  listStore.clearList();
}

function restoreChat(item: ListItem): void {
  tokenHistory = [...item.tokenHistory];
  clearResultDiv();
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

export let selectedItem: LlmProvider;
let tokenVar: string = '';
let tokenHistory: Token[] = [];
let resultDiv: HTMLDivElement;
let sidebarVisible = true;

const clearToken = () => {
  tokenVar = '';
};

const clearResultDiv = () => {
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
  tokenHistory.push({ role: "user", content: token, llmInfo: selectedItem });
  let { pid: divIdUser } = addBubble(resultDiv, "User", "user");
  printMessage(divIdUser, token);
  const response = await fetchAi(tokenHistory, selectedItem);
  if (!response.body) {
    throw new Error('Response body is null');
  }
  let { pid: aiPid } = addBubble(resultDiv, "AI", "ai");
  const content = await printResponse(resultDiv, response.body.getReader() as GenericReader, new TextDecoder('utf-8'), aiPid);
  tokenHistory.push({ role: "assistant", content, llmInfo: selectedItem });
  clearToken();
}

let elemChat: HTMLDivElement;

afterUpdate(() => {
  scrollChatBottom(resultDiv);
});

function toggleSidebar() {
  sidebarVisible = !sidebarVisible;
}

function clearChat() {
  tokenHistory = [];
  clearResultDiv();
}

$: if (selectedItem != null) {
  console.log("MultiShotChat: selectedItem has changed:", selectedItem);
}

</script>

<!--<svelte:head>-->
<!--  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/styles/default.min.css">-->
<!--  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/highlight.min.js"></script>-->
<!--</svelte:head>-->

<div class="max-w-screen h-screen flex">
  <div
    class="h-screen sidebar-container transition-all duration-300 ease-in-out"
    style="width: {sidebarVisible ? '250px' : '0'}; overflow: hidden;"
  >
    <ChatHistorySidebar
      onRestoreChat={restoreChat}
      onClearList={handleClearList}
      {sidebarVisible}
    />
  </div>
  <div
    id="chat-container"
    class="flex flex-col transition-all duration-300 ease-in-out"
    style="flex-grow: 1; width: {sidebarVisible ? 'calc(100% - 250px)' : '100%'};"
  >
    <AppBar>
      <svelte:fragment slot="lead">
        <button class="btn btn-sm variant-ghost-surface rounded-md p-2 mr-4 h-8" on:click={toggleSidebar} id="openclosebtn">
          <Icon icon={sidebarVisible ? "mdi:menu-open" : "mdi:menu"} />
        </button>
        <button type="button" class="btn btn-sm variant-ghost-surface rounded-md h-8" on:click={clearChat}>
            <span>
               <Icon icon="mdi:delete-sweep" />
            </span>
            <span class="font-nunito">Clear Chat</span>
        </button>
      </svelte:fragment>
      <svelte:fragment slot="trail">
        <AppBarContent bind:selectedItem />
      </svelte:fragment>
    </AppBar>
<div id="chat" class="flex-1 flex flex-col h-full">
  <div id="resultOuter" bind:this={elemChat}
       class="flex-1 bg-surface-800/30 p-4 overflow-y-auto max-h-[calc(100vh-170px)]">
    <div id="result" bind:this={resultDiv} class="h-full"></div>
  </div>
      <div class="bg-surface-500/30 p-4">
        <div class="input-group input-group-divider grid-cols-[auto_auto_1fr_auto] rounded-full overflow-hidden pr-11 relative">
          <button class="input-group-shim" on:click={sendUserTokenAiHistory}>+</button>
          <button class="w-12 h-8 bg-transparent border-none pt-2" on:click={handleAddItem} name="save">
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
              class="w-8 h-8 transition-all duration-300 ease-in-out hover:text-variant-filled-primary hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] "
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
