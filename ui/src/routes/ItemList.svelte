<script lang="ts">
  import type { Item } from './types';

  export let items: Item[] = [];
  export let isVisible = false;

  let selectedItem: Item | null = null;

  function handleItemClick(item: Item) {
    selectedItem = item;
  }
</script>

{#if isVisible}
  <div>
    <h2>Item List</h2>
    <ul>
      {#each items as item}
        <li
          on:click={() => handleItemClick(item)}
          class:selected={selectedItem === item}
        >
          {item.name}
        </li>
      {/each}
    </ul>
    {#if selectedItem}
      <p>Selected Item: {selectedItem.name}</p>
    {/if}
  </div>
{/if}

<style>
  .selected {
    font-weight: bold;
    color: red;
  }
</style>
