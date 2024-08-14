<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { type LlmProvider, 
    type Token, 
    type GenericReader, 
    LlmProviderList, 
    type ChatHistoryItem } from './types';
  import { listStore, themeStore, llmProviderListStore } from './store';
  import { ChatHistoryManager } from './chatHistoryManager';
  import {
    storeTokenHistory,
    scrollChatBottom,
    addBubble,
    printMessage,
    fetchAi,
    printResponse,
    renderMarkdownWithCodeBlock,
    initializeWebLLM
  } from './tokenUtils';
  import Icon from '@iconify/svelte';
  import { AppBar, ProgressRadial } from '@skeletonlabs/skeleton';
  import ChatHistorySidebar from './ChatHistorySidebar.svelte';
  import AppBarContent from './AppBarContent.svelte';
  import { get } from 'svelte/store';
  import AppHeader from './AppHeader.svelte';
  
  // Declare selectedItem as a prop
  export let selectedLlmProvider: LlmProvider | null = null;

  let isLoading = false;

onMount(() => {
  listStore.init();
  themeStore.init();
  llmProviderListStore.init();
  checkWindowSize();
  window.addEventListener('resize', checkWindowSize);

  const providers: LlmProvider[] = get(LlmProviderList);
  if (providers && providers.length > 0) {
    selectedLlmProvider = selectedLlmProvider || providers[0]; // Use existing selectedItem if available
    if (selectedLlmProvider.provider === "webllm") {
       initializeWebLLM(selectedLlmProvider.model);
    }
  } else {
    console.error('No LLM providers available');
  }

  return () => {
    window.removeEventListener('resize', checkWindowSize);
  };
});


function handleAddItem() {
  if (selectedLlmProvider) {
    storeTokenHistory(tokenHistory, listStore.addItem, clearResultDiv, selectedLlmProvider);
    tokenHistory = [];
    clearToken();
  } else {
    console.error('No LLM provider selected');
  }
}

function handleClearList() {
  ChatHistoryManager.clearChatHistory();
}

function restoreChat(item: ChatHistoryItem): void {
  tokenHistory = [...item.tokenHistory];
  selectedLlmProvider = { ...item.llmProvider }; // Use the stored llmProvider
  clearResultDiv();
  tokenHistory.forEach((token) => {
    if (selectedLlmProvider) {
      const type: 'user' | 'ai' = token.role === 'user' ? 'user' : 'ai';
      const { bubbleId, pid } = addBubble(token.llmInfo, resultDiv, type, type);
      if (bubbleId !== undefined && pid !== undefined) {
        const contentElement = document.getElementById(pid);
        if (contentElement) {
          renderMarkdownWithCodeBlock(token.content, contentElement);
        }
        setTimeout(() => {
          scrollChatBottom(resultDiv, 'smooth');
        }, 500);
      }
    } else {
      console.error('No LLM provider selected');
    }
  });
}

let tokenVar: string = '';
let tokenHistory: Token[] = [];
let resultDiv: HTMLDivElement;
let sidebarVisible = true;
let windowWidth: number;

const MOBILE_BREAKPOINT = 768;

function checkWindowSize() {
  windowWidth = window.innerWidth;
  sidebarVisible = windowWidth > MOBILE_BREAKPOINT;
}

const clearToken = () => {
  tokenVar = '';
};

const clearResultDiv = () => {
  if (resultDiv) {
    resultDiv.innerHTML = '';
  }
};

const checkForReturnKey = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey && !isLoading) {
    event.preventDefault();
    sendUserTokenAiHistory();
  }
};

function getToken() {
  return tokenVar;
}

async function sendUserTokenAiHistory() {
  if (!selectedLlmProvider) {
    console.error('No LLM provider selected');
    return;
  }

  if (isLoading) {
    return;
  }

  isLoading = true;
  const token = getToken();
  tokenHistory.push({ role: "user", content: token, llmInfo: selectedLlmProvider });
  let { pid: divIdUser } = addBubble(selectedLlmProvider, resultDiv, "User", "user");
  printMessage(divIdUser, token);
  const response = await fetchAi(tokenHistory, selectedLlmProvider);
  if (!response.body) {
    throw new Error('Response body is null');
  }
  let { pid: aiPid } = addBubble(selectedLlmProvider, resultDiv, "AI", "ai");
  const content = await printResponse(resultDiv, response.body.getReader() as GenericReader, new TextDecoder('utf-8'), aiPid);
  tokenHistory.push({ role: "assistant", content, llmInfo: selectedLlmProvider });
  clearToken();
  isLoading = false;
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

async function handleModelChange(newModel: LlmProvider) {
  if (newModel) {
    selectedLlmProvider = newModel;
    if (newModel.provider === "webllm") {
      await initializeWebLLM(newModel.model);
    }
  } else {
    console.error('Invalid model selected');
  }
}

let textareaElement: HTMLTextAreaElement;
let isResizing = false;
let startY: number;
let startHeight: number;

function autoResizeTextarea() {
  if (textareaElement) {
    textareaElement.style.height = 'auto';
    textareaElement.style.height = `${Math.min(textareaElement.scrollHeight, 192)}px`; // 192px = 12rem
  }
}

function startResize(event: MouseEvent) {
  isResizing = true;
  startY = event.clientY;
  startHeight = textareaElement.offsetHeight;
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
}

function resize(event: MouseEvent) {
  if (isResizing) {
    const newHeight = startHeight + startY - event.clientY;
    textareaElement.style.height = `${Math.min(Math.max(newHeight, 40), 192)}px`; // 40px = 2.5rem, 192px = 12rem
  }
}

function stopResize() {
  isResizing = false;
  document.removeEventListener('mousemove', resize);
  document.removeEventListener('mouseup', stopResize);
}

</script>

<style lang="postcss">
  .red-selection::selection {
    @apply bg-red-300/90;
  }

  .auto-resize-textarea {
    overflow-y: auto;
    resize: none;
    min-height: 2.5rem;
    max-height: 12rem;
  }

  .resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    cursor: ns-resize;
    background: transparent;
  }
</style>

<div class="max-w-screen h-screen flex flex-col">
  <div class="flex flex-grow overflow-hidden">
    <div
      class="h-full sidebar-container transition-all duration-300 ease-in-out"
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
      class="flex flex-col flex-grow overflow-hidden transition-all 
      duration-300 ease-in-out"
      style="width: {sidebarVisible ? 'calc(100% - 250px)' : '100%'};"
    >
      
          <AppHeader
          {sidebarVisible}
          bind:selectedItem={selectedLlmProvider}
          {toggleSidebar}
          {clearChat}
        />


      <div id="chat" class="flex flex-col flex-grow overflow-hidden">
        <div id="resultOuter" bind:this={elemChat}
             class="flex-grow bg-surface-800/30 p-4 overflow-y-auto">
          <div id="result" bind:this={resultDiv} class="min-h-full"></div>
        </div>
        <div id="inputContainer" class="bg-surface-500/30 p-4 flex-shrink-0 relative">
          <div id="resizeHandle" class="absolute left-0 right-0 top-0 h-2 cursor-ns-resize z-10" 
          on:mousedown={startResize}>&nbsp;</div>
          <div id="inputGroup" class="input-group input-group-divider border-1 
          grid-cols-[auto_auto_1fr_auto] rounded-full 
          overflow-hidden pr-11 relative
          transition-all duration-300 ease-in-out
          hover:shadow-[0_0_15px_rgba(var(--color-primary-500),0.7)] 
          hover:border-primary-500
          focus-within:shadow-[0_0_15px_rgba(var(--color-primary-500),0.7)] 
          focus-within:border-primary-500">
            <button class="input-group-shim" on:click={sendUserTokenAiHistory} disabled={isLoading}>+</button>
            <button class="w-12 h-full bg-transparent border-none flex items-center justify-center" 
            on:click={handleAddItem} name="save" disabled={isLoading}>
              <Icon icon="ic:twotone-save-alt" class="w-6 h-6" />
            </button>
            <textarea
              bind:value={tokenVar}
              bind:this={textareaElement}
              on:input={autoResizeTextarea}
              class="w-full font-nunito bg-transparent border-0 ring-0 
              red-selection auto-resize-textarea pr-10"
              name="tokenInput"
              id="tokenInput"
              placeholder="Write a message..."
              rows="1"
              on:keydown={checkForReturnKey}
              disabled={isLoading}
            ></textarea>
            {#if isLoading}
              <div class="absolute -right-3 top-1 bottom-1 flex items-center justify-center">
                <ProgressRadial width="w-9" />
              </div>
            {:else}
              <button
                class="absolute -right-3 top-1 bottom-1 bg-transparent flex items-center 
                justify-center transition-all duration-300 ease-in-out hover:scale-110"
                on:click={sendUserTokenAiHistory}
                name="send"
                disabled={isLoading}
              >
                <Icon
                  icon="ph:arrow-circle-up-fill"
                  class="w-9 h-9 transition-all duration-300 ease-in-out 
                  hover:text-variant-filled-red hover:drop-shadow-[0_0_20px_rgba(59,230,246,7)] "
                />
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
