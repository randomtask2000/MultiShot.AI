<script lang="ts">
  import { onMount } from 'svelte';
  import type { llmProvider } from './types';
  import MyJsChat from './MultiShotChat.svelte';
  import '../app.postcss';
  import { AppShell, AppBar } from '@skeletonlabs/skeleton';
  import hljs from 'highlight.js/lib/core';
  import 'highlight.js/styles/github-dark.css';
  import { storeHighlightJs } from '@skeletonlabs/skeleton';
  import xml from 'highlight.js/lib/languages/xml';
  import css from 'highlight.js/lib/languages/css';
  import javascript from 'highlight.js/lib/languages/javascript';
  import typescript from 'highlight.js/lib/languages/typescript';
  hljs.registerLanguage('xml', xml);
  hljs.registerLanguage('css', css);
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('typescript', typescript);
  storeHighlightJs.set(hljs);
  import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
  import { storePopup } from '@skeletonlabs/skeleton';
  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  import { Items } from './types';
  import Icon from '@iconify/svelte' // unplugin-icons  https://github.com/unplugin/unplugin-icons
  // icons can be found here: https://icon-sets.iconify.design/
  // components https://www.shadcn-svelte.com/
  import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
  import { fade } from 'svelte/transition';

  export let selectedItem: llmProvider | null = null;
  function handleSelectItem(event: CustomEvent<llmProvider> | { detail: llmProvider }): void {
    selectedItem = event.detail;
    console.log("+layout: selectedItem:", selectedItem);
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

<!-- App Shell -->
<AppShell>
  <svelte:fragment slot="header">
    <!-- App Bar -->
    <AppBar>
      <svelte:fragment slot="lead">
        <strong class="font-nunito text-xl bg-gradient-to-br from-pink-500 to-violet-500 bg-clip-text text-transparent box-decoration-clone">MultiShot.AI</strong>
      </svelte:fragment>
      <svelte:fragment slot="trail">
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
        <a class="font-nunito btn btn-sm variant-ghost-surface rounded-md" href="https://twitter.com/cronuser" target="_blank" rel="noreferrer"> Twitter </a>
        <a class="font-nunito btn btn-sm variant-ghost-surface rounded-md" href="https://github.com/randomtask2000/MultiShot.AI" target="_blank" rel="noreferrer"> GitHub </a>
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>
  <slot />
  <MyJsChat {selectedItem} />
</AppShell>
