<!-- AppBarContent.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { LlmProvider } from './types';
  import { Items } from './types';
  import Icon from '@iconify/svelte';
  import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
  import { fade } from 'svelte/transition';

  export let selectedItem: LlmProvider | null = null;

  function handleSelectItem(event: CustomEvent<LlmProvider> | { detail: LlmProvider }): void {
    selectedItem = event.detail;
    console.log("AppBarContent: selectedItem:", selectedItem);
    isListBoxVisible = false;
  }

  $: if (!selectedItem) {
    const desiredSelector = 'gpt-4o-mini';
    const matchedItem = Items.find(item => item.model === desiredSelector);
    if (matchedItem) {
      selectedItem = matchedItem;
    } else {
      console.log(`No item with selector "${desiredSelector}" was found.`);
    }
  }

  let isListBoxVisible = false;
  let listBoxContainer: HTMLElement;

  function handleClickOutside(event: MouseEvent) {
    if (listBoxContainer && !listBoxContainer.contains(event.target as Node)) {
      isListBoxVisible = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>


  <strong class="font-nunito text-xl bg-gradient-to-br from-pink-500 to-violet-500 bg-clip-text text-transparent box-decoration-clone">MultiShot.AI</strong>


  <div class="relative" bind:this={listBoxContainer}>
    <button type="button" class="btn btn-sm variant-ghost-surface rounded-md" on:click|stopPropagation={() => isListBoxVisible = !isListBoxVisible}>
      <span>
        <Icon
          icon={selectedItem ? selectedItem.icon : "material-symbols:skull"}
          class="w-6 h-5"
        />
      </span>
      <span class="font-nunito  bg-gradient-to-br from-pink-500 to-violet-500 bg-clip-text text-transparent box-decoration-clone">{selectedItem ? selectedItem.title : 'Select Model'}</span>
    </button>
    {#if isListBoxVisible}
      <div transition:fade class="absolute top-full right-0 mt-2 z-50 min-w-[200px] w-max bg-surface-700/30 rounded-md p-3">
        <ListBox class="w-full">
          {#each Items as item}
            <ListBoxItem
              on:click={() => handleSelectItem({ detail: item })}
              active={selectedItem?.model === item.model}
              value={item.model}
              class="whitespace-nowrap"
            >
              <svelte:fragment slot="lead">
                <Icon icon="{item.icon}" class="text-white-500 w-6 h-6" />
              </svelte:fragment>
              {item.title}
            </ListBoxItem>
          {/each}
        </ListBox>
      </div>
    {/if}
  </div>
  <a class="font-nunito btn btn-sm variant-ghost-surface rounded-md" href="https://twitter.com/cronuser" target="_blank" rel="noreferrer">
    <Icon icon="simple-icons:x" class="w-6 h-5" /></a>
  <a class="font-nunito btn btn-sm variant-ghost-surface rounded-md" href="https://github.com/randomtask2000/MultiShot.AI" target="_blank" rel="noreferrer">
    <Icon icon="simple-icons:github" class="w-6 h-5 pr-2" /> GitHub </a>

