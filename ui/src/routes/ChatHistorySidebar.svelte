<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { listStore } from './store';
  import { type ChatHistoryItem } from './types';
  import Icon from '@iconify/svelte';
  import { ChatHistoryManager } from './chatHistoryManager';

  export let onRestoreChat: (item: ChatHistoryItem) => void;
  export let onClearList: () => void;
  export let sidebarVisible: boolean;

  async function handleExport() {
    const url = await ChatHistoryManager.exportChatHistory();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_history.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImport(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      try {
        await ChatHistoryManager.importChatHistory(input.files[0]);
        alert('Chat history imported successfully');
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing chat history: ' + (error as Error).message);

        // Log more details about the file
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('File contents:', e.target?.result);
        };
        reader.readAsText(input.files[0]);
      }
    }
  }

  // function handleClearList() {
  //   ChatHistoryManager.clearChatHistory();
  // }
</script>

<div
  class="h-screen w-60 p-4 shadow-md overflow-y-auto"
  transition:fly={{ x: -250, opacity: 1, duration: 300, easing: cubicInOut }}
>
  <h2 class="font-nunito text-xl bg-gradient-to-br from-surface-500/30 to-violet-400 bg-clip-text text-transparent box-decoration-clone">Chat History</h2>
  <br/>
  {#if $listStore.length === 0}
    <p class="bg-surface-800/30">No saved chats yet.</p>
  {:else}
    <ul class="space-y-2">
      {#each $listStore as item (item.id)}
        <li>
          <button
            on:click={() => onRestoreChat(item)}
            class="flex items-center justify-between w-full p-2 text-left hover:bg-surface-500/30 rounded transition duration-300 font-nunito"
          >
            <span class="truncate">{@html item.text}</span>
            <Icon icon={item.llmProvider.icon} class="flex-shrink-0 ml-2" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
  <div class="mt-4 space-y-2">
    <button
      on:click={handleExport}
      class="flex items-center justify-center w-full p-2 bg-surface-500/30 text-white rounded hover:bg-blue-600 transition duration-300 font-nunito"
    >
      <Icon icon="mdi:export" class="mr-2" />
      Export Chat History
    </button>
    <label
      class="flex items-center justify-center w-full p-2 bg-surface-500/30 text-white rounded hover:bg-green-600 transition duration-300 font-nunito cursor-pointer"
    >
      <Icon icon="mdi:import" class="mr-2" />
      Import Chat History
      <input
        type="file"
        accept=".json"
        on:change={handleImport}
        class="hidden"
      />
    </label>
    <button
      on:click={onClearList}
      class="flex items-center justify-center w-full p-2 bg-surface-500/30 text-white rounded hover:bg-red-600 transition duration-300 font-nunito"
    >
      <Icon icon="mdi:delete" class="mr-2" />
      Clear All
    </button>
  </div>
</div>