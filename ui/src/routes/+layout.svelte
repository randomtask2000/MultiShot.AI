<script lang="ts">
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

  export let selectedItem: llmProvider | null = null;
  function handleSelectItem(event: CustomEvent<llmProvider>): void {
    selectedItem = event.detail;
    console.log("+layout: selectedItem:", selectedItem);
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

</script>
<!-- App Shell -->
<AppShell>
  <svelte:fragment slot="header">
    <!-- App Bar -->
    <AppBar>
      <div class="relative">
        <select
          class="font-nunito select w-[175px]"
          on:change={(e) => handleSelectItem({ detail: Items.find(item => item.model === e.target.value) })}
        >
          <option value="" disabled selected={!selectedItem}>Select an LLM</option>
          {#each Items as item}
            <option value={item.model} selected={selectedItem?.model === item.model}>
              {item.title}
            </option>
          {/each}
        </select>
      </div>
      <svelte:fragment slot="lead">
        <strong class="font-nunito text-xl bg-gradient-to-br from-pink-500 to-violet-500 bg-clip-text text-transparent box-decoration-clone">MultiShot.AI</strong>
      </svelte:fragment>
      <svelte:fragment slot="trail">
        <a class="font-nunito btn btn-sm variant-ghost-surface" href="https://twitter.com/cronuser" target="_blank" rel="noreferrer"> Twitter </a>
        <a class="font-nunito btn btn-sm variant-ghost-surface" href="https://github.com/randomtask2000/MultiShot.AI" target="_blank" rel="noreferrer"> GitHub </a>
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>
  <slot />
  <MyJsChat {selectedItem} />
</AppShell>

