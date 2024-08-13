<script lang="ts">
  import Icon from '@iconify/svelte';
  import AppBarContent from './AppBarContent.svelte';
  import type { LlmProvider } from './types';

  export let sidebarVisible: boolean;
  export let selectedItem: LlmProvider | null;
  export let toggleSidebar: () => void;
  export let clearChat: () => void;
</script>

<div class="flex items-center justify-between p-3">
  <div class="flex items-center space-x-5">
    <button
      class="flex items-center justify-center p-2 bg-surface-500/10 rounded 
      hover:bg-secondary-600 transition duration-300 font-nunito h-8"
      on:click={toggleSidebar}
      id="openclosebtn"
    >
      <Icon icon={sidebarVisible ? "mdi:menu-open" : "mdi:menu"} />
    </button>
    <button
      type="button"
      class="btn btn-sm flex items-center justify-center bg-surface-500/10 rounded 
      hover:bg-secondary-600 transition duration-300 font-nunito h-8"
      on:click={clearChat}
    >
      <span>
        <Icon icon="mdi:delete-sweep" />
      </span>
      <span class="font-nunito">Clear Chat</span>
    </button>
  </div>

  <div class="flex-grow flex items-center justify-end">
    <AppBarContent bind:selectedItem />
  </div>
  <div class="pr-5 pl-5 flex-grow flex items-center justify-end space-x-5 h-full">
    <a
      class="btn btn-sm flex items-center justify-center bg-surface-500/10 rounded 
      hover:bg-secondary-600 transition duration-300 font-nunito"
      href="https://twitter.com/cronuser"
      target="_blank"
      rel="noreferrer"
    >
      <Icon icon="simple-icons:x" class="w-6 h-5" />
    </a>
    <a
      class="btn btn-sm flex items-center justify-center bg-surface-500/10 rounded 
      hover:bg-secondary-600 transition duration-300 font-nunito"
      href="https://github.com/randomtask2000/MultiShot.AI"
      target="_blank"
      rel="noreferrer"
    >
      <Icon icon="simple-icons:github" class="w-6 h-5" />
    </a>
  </div>
</div>
