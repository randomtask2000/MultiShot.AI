<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { llmProvider } from './types';

  export let items: llmProvider[] = [];
  export let isVisible = false;

  const dispatch = createEventDispatcher();

  function handleItemClick(item: llmProvider) {
    dispatch('selectItem', item);
  }
</script>

{#if isVisible}
  <div>
    <h2>Item List</h2>
    <ul>
      {#each items as item}
        <li on:click={() => handleItemClick(item)}>
          {item.title}
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    cursor: pointer;
    padding: 8px;
    border-bottom: 1px solid #ccc;
  }

  li:hover {
    text-decoration: underline;
    background: #f0f0f0;
  }
</style>