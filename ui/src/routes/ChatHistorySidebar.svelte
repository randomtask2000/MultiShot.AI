<!-- ChatHistorySidebar.svelte -->
<script lang="ts">
  import { listStore, type ListItem } from './store';
  import Icon from '@iconify/svelte';
  import { fade } from 'svelte/transition';

  export let onRestoreChat: (item: ListItem) => void;
  export let onClearList: () => void;

  let listItems: ListItem[];

  listStore.subscribe(value => {
    listItems = value;
  });
</script>

<div id="search"
     class="grid grid-rows-[auto_1fr_auto] gap-0 w-[250px] h-full bg-surface-700/30 transition-all duration-300"
     transition:fade={{ duration: 300 }}>
  <div class="bg-surface-600/30 p-4 text-gray-500">Chat History</div>
  <div class="bg-surface-600/30 p-4 overflow-y-auto">
    {#each listItems as item (item.id)}
      <button
        class="font-nunito variant-soft-secondary p-2 rounded-md mb-2 w-full text-left flex items-center"
        on:click={() => onRestoreChat(item)}
        on:keydown={(e) => e.key === 'Enter' && onRestoreChat(item)}
        title={item.tokenHistory[0].content.substring(0, 30)}
      >
        <Icon icon="mdi:chat-outline" class="mr-2" />
        <span class="truncate">{@html item.text}</span>
      </button>
    {/each}
  </div>
  <div class="bg-surface-600/30 p-4">
    <button class="btn variant-filled-primary w-full" on:click={onClearList} title="clear the list">
      <Icon icon="mdi:delete-sweep" class="mr-2" />
      Clear History
    </button>
  </div>
</div>
