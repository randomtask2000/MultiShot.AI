<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { LlmProvider } from './types';

  export let items: LlmProvider[] = [];
  export let isVisible = false;

  const dispatch = createEventDispatcher();

  function handleItemClick(item: LlmProvider) {
    dispatch('selectItem', item);
  }

  function handleKeyDown(event: KeyboardEvent, item: LlmProvider) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleItemClick(item);
    }
  }
</script>

{#if isVisible}
  <div>
    <h2>Item List</h2>
    <ul>
      {#each items as item}
        <li>
          <button
            type="button"
            on:click={() => handleItemClick(item)}
            on:keydown={(event) => handleKeyDown(event, item)}
          >
            {item.title}
          </button>
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
    padding: 0;
    border-bottom: 1px solid #ccc;
  }

  button {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
  }

  button:hover {
    text-decoration: underline;
    background: #f0f0f0;
  }
</style>
