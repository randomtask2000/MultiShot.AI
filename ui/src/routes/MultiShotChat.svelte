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
    fetchAi,
    printResponse,
    renderMarkdownWithCodeBlock,
    initializeWebLLM,
    initializeWebLLMWithForce
  } from './tokenUtils';
  import Icon from '@iconify/svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import ChatHistorySidebar from './ChatHistorySidebar.svelte';
  import { get } from 'svelte/store';
  import AppHeader from './AppHeader.svelte';
  import * as webllm from "@mlc-ai/web-llm";
  import handleSelectItem from './AppBarContent.svelte'
 
  // Declare selectedItem as a prop
  export let selectedLlmProvider: LlmProvider | null = null;

  let isLoadingLlmResponse = false;
  let progressPercentage = 0;
  let downloadStatus = '';
  let loadbubbleBussy = false;
  let loadingBubblePid: string = "";
  let loadingInputBubbleDiv: HTMLDivElement | null = null;
  //let timeSpanElement: HTMLDivElement | null = null;
  //let lastSelectedLlmProvider: LlmProvider | null = null;

  /**
   * Initializes the progress callback for loading a machine learning model. Writes system bubble.
   *
   * @param {webllm.InitProgressReport} report - The progress report containing the status and progress percentage.
   * @return {Promise<void>} A promise that resolves when the progress has been updated successfully.
   */
  async function initProgressCallback(report: webllm.InitProgressReport) {
    if (selectedLlmProvider) {
      progressPercentage = Math.round(report.progress * 100);
      downloadStatus = `Please wait model ${selectedLlmProvider?.model} to initialize. ${report.text}`;
      //console.log(progressPercentage);
      // Update the progress percentage and status at the start
      if (progressPercentage < 100) {
        isLoadingLlmResponse = true;
        if (!selectedLlmProvider) {
          console.error('No LLM provider selected');
        } else if (!loadbubbleBussy) {
          // Add user input bubble
          const { pid } = addBubble(selectedLlmProvider, resultDiv, "System", "ai");
          // we created the bubble and after only refer to it as a pid
          loadingBubblePid = pid;
          loadbubbleBussy = true;

          // find the element by pid and update the text
          const loadingInputBubbleElement = document.getElementById(loadingBubblePid);
          loadingInputBubbleDiv = loadingInputBubbleElement as HTMLDivElement;
          if (loadingInputBubbleDiv) {
            loadingInputBubbleDiv.innerHTML = downloadStatus;
            // let pidTimeSpan:string = `${loadingBubblePid}-timespan`;
            // timeSpanElement = document.getElementById(pidTimeSpan) as HTMLDivElement;
            // updateTimespanElement(timeSpanElement);
          }
        } else {
          loadingInputBubbleDiv.innerHTML = downloadStatus;
        }
        // we are finished and we report the last message
      } else if (progressPercentage === 100) {
        const element = document.getElementById(loadingBubblePid);
        loadingInputBubbleDiv = element as HTMLDivElement;
        if (loadingInputBubbleDiv !== null) {
          loadingInputBubbleDiv.innerHTML = `Model ${selectedLlmProvider?.model} is loaded. You can start chatting now.`;
          isLoadingLlmResponse = false;
          try {
            handleSelectItem(selectedLlmProvider);
          } catch (error) {
            console.error(`Error handling selected ${selectedLlmProvider?.model}`);
          }
          setTimeout(() => {
            if (loadingInputBubbleDiv !== null) {
              scrollChatBottom(loadingInputBubbleDiv, 'smooth');
            }
          }, 500);
        }
        progressPercentage = 0;
        loadbubbleBussy = false;
        isLoadingLlmResponse = false;
      }
    } else {
      console.error('No LLM provider selected');
    }
  }

  onMount(() => {
    listStore.init();
    themeStore.init();
    llmProviderListStore.init();
    checkWindowSize();
    window.addEventListener('resize', checkWindowSize);

    return () => clearTimeout(timer);

    const providers: LlmProvider[] = get(LlmProviderList);
    if (providers && providers.length > 0) {
      selectedLlmProvider = selectedLlmProvider || providers[0];
      if (selectedLlmProvider.provider === "webllm") {
        initializeWebLLM(selectedLlmProvider.model, initProgressCallback);
      }
    } else {
      console.error('No LLM providers available');
    }

    return () => {
      window.removeEventListener('resize', checkWindowSize);
    };
  });

  let timer: number | ReturnType<typeof setTimeout>; // Compatible type for both environments

  $: if (isLoadingLlmResponse) {
    timer = setTimeout(() => {
      isLoadingLlmResponse = false;
    }, 60000);
  }

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
/**
 * Handles the selection of a chat history item.
 * @param item
 */
function restoreChat(item: ChatHistoryItem): void {
  tokenHistory = [...item.tokenHistory];

  //selectedLlmProvider = { ...item.llmProvider }; // Use the stored llmProvider
  let lastTokenInfo: LlmProvider | null = selectedLlmProvider;
  clearResultDiv();
  tokenHistory.forEach((token) => {
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
    lastTokenInfo = token.llmInfo;
  });
  if (lastTokenInfo.model !== selectedLlmProvider.model) {
    selectedLlmProvider = lastTokenInfo;
  }
}

let textAreaInputTokens: string = '';
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
  textAreaInputTokens = '';
};

const clearResultDiv = () => {
  if (resultDiv) {
    resultDiv.innerHTML = '';
  }
};

function getToken() {
  const temp = textAreaInputTokens;
  textAreaInputTokens = '';
  return temp;
}

/**
 * Sends the user's token to the AI history and processes the response.
 * 
 * This function handles the user's input token, adds it to the token history,
 * sends it to the AI for processing, and then handles the AI's response by
 * adding it to the token history and displaying it in the UI.
 * 
 * @throws {Error} If no LLM provider is selected.
 * @throws {Error} If the response body is null.
 */
  async function sendUserTokenAiHistory() {
    if (!selectedLlmProvider) {
      console.error('No LLM provider selected');
      return;
    }
    if (isLoadingLlmResponse) {
      return;
    }
    isLoadingLlmResponse = true;
    const token = getToken();
    tokenHistory.push({ role: "user", content: token, llmInfo: selectedLlmProvider });

    const response = await fetchAi(tokenHistory, selectedLlmProvider);
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    // Add response from LLM bubble
    let { pid: aiPid } = addBubble(selectedLlmProvider, resultDiv, "AI", "ai");
    const content = await printResponse(resultDiv, response.body.getReader() as GenericReader, new TextDecoder('utf-8'), aiPid);
    
    tokenHistory.push({ role: "assistant", content, llmInfo: selectedLlmProvider });
    clearToken();
    isLoadingLlmResponse = false;
    userBubbleIsBusy = false;
  }

  let chatResultOuterBinding: HTMLDivElement;

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

  let textareaElementBinding: HTMLTextAreaElement; // textarea for user input tokens
  let inputContainerBinding: HTMLDivElement; // this the area that contains the textarea for user input tokens
  let isResizing = false;
  let startY: number;
  let startHeight: number;

  function autoResizeTextarea() {
    if (textareaElementBinding) {
      textareaElementBinding.style.height = 'auto';
      textareaElementBinding.style.height = `${Math.min(textareaElementBinding.scrollHeight, 192)}px`; // 192px = 12rem
    }
  }

  function startResize(event: MouseEvent) {
    isResizing = true;
    startY = event.clientY;
    startHeight = textareaElementBinding.offsetHeight;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  }

  function resize(event: MouseEvent) {
    if (isResizing) {
      const newHeight = startHeight + startY - event.clientY;
      textareaElementBinding.style.height = `${Math.min(Math.max(newHeight, 40), 192)}px`; // 40px = 2.5rem, 192px = 12rem
    }
  }

  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }

    /**
     * Indicates whether the user's chat bubble is currently busy.
     *
     * @function userBubbleIsBusy
     * @returns {boolean} True if the user's chat bubble is busy, otherwise false.
     */
  let userBubbleIsBusy: boolean = false;
    /**
     * Filters a list of bubble objects based on a specific user PID (Process Identifier).
     *
     * @param {Array} bubbles - An array of bubble objects, where each bubble object contains
     *                            various properties including a user PID.
     * @param {number} userPid - The PID of the user for whom bubbles need to be filtered.
     * @returns {Array} - A filtered array of bubble objects belonging to the specified user PID.
     */
  let userBubblePid: string = "";
    /**
     * reactive svelte code that creates a new user chat bubble when the textAreaInputTokens
     * variable changes and a user bubble is not currently busy.
     */
  $: {
    if (textAreaInputTokens) {
      if (!selectedLlmProvider) {
        console.error('No LLM provider selected');
      } else if (!userBubbleIsBusy) {
        // Add user input bubble
        const { pid } = addBubble(selectedLlmProvider, resultDiv, "User", "user");

        userBubblePid = pid;
        userBubbleIsBusy = true;
      }
      const userInputBubbleElement = document.getElementById(userBubblePid);
      if (userInputBubbleElement) {
        userInputBubbleElement.innerHTML = textAreaInputTokens;
      }
    }
  }

  $: if (selectedLlmProvider !== null) {
    watchSelectedLlmProvider(selectedLlmProvider);
  }

  let initializationPromise: Promise<void> | null = null;

  async function watchSelectedLlmProvider(selectedProvider: LlmProvider) {
      if (initializationPromise) {
          console.log(`Initialization in progress for ${selectedProvider.model}. Ignoring this call.`);
          return;
      }

      if (selectedProvider.provider === "webllm") {
          initializationPromise = initializeWebLLMWithForce(selectedProvider.model, initProgressCallback, true)
              .then(() => {
                  console.log('Selected WebLLM Provider changed:', selectedProvider.model);
              })
              .finally(() => {
                  initializationPromise = null;
              });
      }
  }

  /**
   * Handles the 'Enter' key press event, ensuring that the default behavior (e.g., submitting a form) is prevented
   * if certain conditions are met. Specifically, if the 'Enter' key is pressed without the 'Shift' key and
   * the application is not currently in a loading state, the default action is prevented, and a function to send
   * user token AI history is called.
   *
   * @param {KeyboardEvent} event - The keyboard event triggered by a key press.
   */
  const checkForReturnKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !isLoadingLlmResponse) {
      event.preventDefault();
      sendUserTokenAiHistory();
    }
  };

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
        <div id="resultOuter" bind:this={chatResultOuterBinding}
             class="flex-grow bg-surface-800/30 p-4 overflow-y-auto">
          <div id="result" bind:this={resultDiv} class="min-h-full"></div>
        </div>
        <div
          bind:this={inputContainerBinding}
          id="inputContainer" class="bg-surface-500/30 p-4 flex-shrink-0 relative">
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
            <button class="input-group-shim" on:click={sendUserTokenAiHistory} disabled={isLoadingLlmResponse}>+</button>
            <button class="w-12 h-full bg-transparent border-none flex items-center justify-center" 
            on:click={handleAddItem} name="save" disabled={isLoadingLlmResponse}>
              <Icon icon="ic:twotone-save-alt" class="w-6 h-6" />
            </button>
            <textarea
              bind:value={textAreaInputTokens}
              bind:this={textareaElementBinding}
              on:input={autoResizeTextarea}
              on:keydown={checkForReturnKey}
              class="w-full font-nunito bg-transparent border-0 ring-0 
              red-selection auto-resize-textarea pr-10"
              name="tokenInput"
              id="tokenInput"
              placeholder="Write a message..."
              rows="1"
            ></textarea>
            {#if isLoadingLlmResponse}
              <div class="absolute -right-3 top-1 bottom-1 flex items-center justify-center">
                <ProgressRadial width="w-9" />
              </div>
            {:else}
              <button
                class="absolute -right-3 top-1 bottom-1 bg-transparent flex items-center 
                justify-center transition-all duration-300 ease-in-out hover:scale-110"
                on:click={sendUserTokenAiHistory}
                name="send"
                disabled={isLoadingLlmResponse}
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
