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

  let items: llmProvider[] = [
    { selector: 'gpt-4o-mini', title: 'GPT-4o-mini', provider: 'openai', model: 'gpt-4o-mini' },
    { selector: 'gpt-4o', title: 'GPT-4o', provider: 'openai', model: 'gpt-4o' },
    { selector: 'gpt-3.5-turbo', title: 'GPT-3.5 Turbo', provider: 'openai', model: 'gpt-3.5-turbo' },
    { selector: 'claude-3-5-sonnet-20240620', title: 'Claude 3.5 Sonnet', provider: 'anthropic', model: 'claude-3-5-sonnet-20240620' },
    { selector: 'llama-3.1-405b-reasoning', title: 'Llama 405b', provider: 'groq', model: 'llama-3.1-405b-reasoning' },
    { selector: 'llama3-70b-8192', title: 'Llama 70b', provider: 'groq', model: 'llama3-70b-8192' },
    { selector: 'codestral:22b', title: 'ollama - codestral:22b', provider: 'ollama', model: 'codestral:22b' },
  ];
  export let selectedItem: llmProvider | null = null;
  function handleSelectItem(event: CustomEvent<llmProvider>): void {
    selectedItem = event.detail;
    console.log("+layout: selectedItem:", selectedItem);
  }
  $: if (!selectedItem) {
    const desiredSelector = 'gpt-4o-mini';
    const matchedItem = items.find(item => item.selector === desiredSelector);
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
          on:change={(e) => handleSelectItem({ detail: items.find(item => item.selector === e.target.value) })}
        >
          <option value="" disabled selected={!selectedItem}>Select an LLM</option>
          {#each items as item}
            <option value={item.selector} selected={selectedItem?.selector === item.selector}>
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

