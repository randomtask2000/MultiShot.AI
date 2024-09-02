<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton';
  import { fly } from 'svelte/transition';
  import type { Bubble } from './types';

  export let bubble: Bubble;
  let userInputTokensBinding: HTMLParagraphElement;

  $: if (bubble.message) {
    scheduleAnimation();
  }

  function scheduleAnimation() {
    if (userInputTokensBinding) {
      userInputTokensBinding.style.animation = 'none';
      userInputTokensBinding.offsetHeight; // Trigger reflow
      userInputTokensBinding.style.animation = '';
    }
  }
</script>

<style>
  @keyframes addContent {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animatedContent {
    animation: addContent 0.5s ease-in-out;
  }
</style>

<div class="grid grid-cols-[1fr_auto] gap-2 justify-end">
  <div id="userBubbleDiv" class="card p-4 variant-soft rounded-tl-none space-y-2" in:fly={{ y: 50, duration: 500 }}>
    <header class="flex justify-between items-center">
      <small class="opacity-50">{bubble.timestamp}</small>
      <p class="font-bold capitalize">{bubble.name}</p>
    </header>
    <p bind:this={userInputTokensBinding} id="{bubble.pid}" class="font-nunito text-right animatedContent">
      {bubble.message}
    </p>
  </div>
  <Avatar src="{bubble.avatar}" width="w-12" />
</div>
<br />
