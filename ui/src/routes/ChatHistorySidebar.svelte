<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { listStore } from './store';
  import { type ChatHistoryItem } from './types';
  import Icon from '@iconify/svelte';
  import { ChatHistoryManager } from './chatHistoryManager';
  import { get } from 'svelte/store';

  export let onRestoreChat: (item: ChatHistoryItem) => void;
  export let onClearList: () => void;
  export let sidebarVisible: boolean;

  $: sortedListStore = $listStore.sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  $: todayItems = sortedListStore.filter(item => {
    const itemDate = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
    const today = new Date();
    return itemDate.toDateString() === today.toDateString();
  });

  $: olderItems = sortedListStore.filter(item => {
    const itemDate = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
    const today = new Date();
    return itemDate.toDateString() !== today.toDateString();
  });

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

  function handleClearList() {
    // Clear the listStore
    onClearList();
    
    // Clear the localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('chatHistory');
    }
  }

  function deleteEntry(id: number) {
    const currentItems = get(listStore);
    const updatedItems = currentItems.filter(item => item.id !== id);
    listStore.clearList();
    updatedItems.forEach(item => listStore.addItem(item));
  }
</script>

<div
  class="h-screen w-61 p-4 shadow-md flex flex-col bg-gradient-to-t from-secondary-900/40 dark:from-secondary-300/20 to-transparent"
  transition:fly={{ x: -250, opacity: 1, duration: 300, easing: cubicInOut }}
>
  <strong
    class="font-nunito text-xl bg-gradient-to-br from-pink-500 to-violet-500 bg-clip-text
    text-transparent box-decoration-clone mb-4"
  >
    MultiShot.AI
  </strong>

  <div class="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent 
  hover:scrollbar-thumb-gray-300 transition-all duration-500">
    {#if sortedListStore.length === 0}
      <p class="text-white/50">No saved chats yet.</p>
    {:else}
      <h3 class="font-bold mb-2 text-white/50">Today</h3>
      <ul class="space-y-2 mb-4">
        {#each todayItems as item (item.id)}
          <li class="group relative">
            <button
              on:click={() => onRestoreChat(item)}
              class="flex items-center justify-between w-full p-2 text-left hover:bg-surface-500/30 rounded transition duration-300 font-nunito"
            >
              <span class="truncate">{@html item.text}</span>
              <div class="flex items-center relative">
                <Icon icon={item.llmProvider.icon} class="flex-shrink-0 mr-0" />
                <button
                  type="button"
                  class=" btn-icon btn-icon-sm bg-secondary-500/70 rounded-sm
                          opacity-0 group-hover:opacity-100 
                          transition-[opacity_0ms] group-hover:transition-[opacity_200ms]
                          absolute top-0 right-1 -mt-2 -mr-2"
                  on:click|stopPropagation={() => deleteEntry(item.id)}
                >
                  <Icon icon="mdi:close" class="w-4 h-4"/>
                </button>
              </div>
            </button>
          </li>
        {/each}
      </ul>

      {#if olderItems.length > 0}
        <h3 class="font-bold mb-2 text-white/50">Older</h3>
        <ul class="space-y-2">
          {#each olderItems as item (item.id)}
            <li class="group relative">
              <button
                on:click={() => onRestoreChat(item)}
                class="flex items-center justify-between w-full p-2 text-left hover:bg-surface-500/30 rounded transition duration-300 font-nunito"
              >
                <span class="truncate">{@html item.text}</span>
                <div class="flex items-center relative">
                  <Icon icon={item.llmProvider.icon} class="flex-shrink-0 mr-0" />
                  <button
                    type="button"
                    class=" btn-icon btn-icon-sm bg-secondary-500/70 rounded-sm
                            opacity-0 group-hover:opacity-100 
                            transition-[opacity_0ms] group-hover:transition-[opacity_200ms]
                            absolute top-0 right-1 -mt-2 -mr-2"
                    on:click|stopPropagation={() => deleteEntry(item.id)}
                  >
                    <Icon icon="mdi:close" class="w-4 h-4"/>
                  </button>
                </div>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>

  <div class="mt-4 space-y-2 sticky bottom-0 pt-2">
    <button
      on:click={handleExport}
      class="flex items-center justify-center w-full p-2 bg-surface-500/30 text-white rounded 
      hover:bg-secondary-600 transition duration-300 font-nunito"
    >
      <Icon icon="mdi:export" class="mr-2" />
      Export Chat History
    </button>
    <label
      class="flex items-center justify-center w-full p-2 bg-surface-500/30 text-white rounded 
      hover:bg-secondary-600 transition duration-300 font-nunito cursor-pointer"
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
      on:click={handleClearList}
      class="flex items-center justify-center w-full p-2 bg-surface-500/30 text-white rounded 
      hover:bg-secondary-600 transition duration-300 font-nunito"
    >
      <Icon icon="mdi:delete" class="mr-2" />
      Clear All
    </button>
  </div>
</div>