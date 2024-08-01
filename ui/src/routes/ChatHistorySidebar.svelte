<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { listStore } from './store';
  import { type ChatHistoryItem, LlmProviderList } from './types';
  import Icon from '@iconify/svelte';

  export let onRestoreChat: (item: ChatHistoryItem) => void;
  export let onClearList: () => void;
  export let sidebarVisible: boolean;
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
  <button
    on:click={onClearList}
    class="mt-4 flex items-center justify-center w-full p-2 bg-surface-500/30 text-white rounded hover:bg-red-600 transition duration-300 font-nunito"
  >
    <Icon icon="mdi:delete" class="mr-2" />
    Clear All
  </button>
</div>
