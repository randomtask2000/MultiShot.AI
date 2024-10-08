<script lang="ts">
  import { fly } from 'svelte/transition';
  import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
  import { StreamParser } from './markdownUtils';
  import Icon from '@iconify/svelte';
  import { AnimationType, type Bubble } from './types';
  
  export let bubble: Bubble;
  let bubbleContentDiv: HTMLElement;
  let statsElement: HTMLElement;
  let startTime: Date;
  let elapsedTime = 0;
  let timerInterval: NodeJS.Timeout;
  let isHidden = true;
  let statsFlag: HTMLDivElement;
  let statsFlagContent = 'true';

// Use a custom store to track the statsFlag content
import { writable } from 'svelte/store';
const statsFlagStore = writable('true');

// Subscribe to changes in the store
$: if ($statsFlagStore === 'false') {
  stopTimer();
}

function updateStatsFlag(value: string) {
  statsFlagContent = value;
  if (statsFlag) {
    statsFlag.innerHTML = value;
  }
}

  onMount(() => {
    console.log("Component mounted");
    startTime = new Date();
    startTimer();

    // Set up a MutationObserver to watch for changes to statsFlag
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          statsFlagStore.set(statsFlag.innerHTML);
        }
      });
    });

    if (statsFlag) {
      observer.observe(statsFlag, { childList: true, characterData: true, subtree: true });
    }

    return () => {
      observer.disconnect();
    };
  });

function startTimer() {
  stopTimer(); // Ensure any existing timer is stopped
  timerInterval = setInterval(() => {
    const now = new Date();
    elapsedTime = now.getTime() - startTime.getTime();
  }, 1000);
}

function stopTimer() {
  //console.log("stopTimer");
  if (timerInterval) {
    clearInterval(timerInterval);
  }
}

// Reactive statement to update the stats element
$: if (statsElement) {
  statsElement.textContent = formatLargestTimeUnit(elapsedTime);
}

function shake(node: HTMLElement) {
  let lastHeight = node.offsetHeight;
  let lastContent = node.textContent;

  function checkAndShake() {
    const currentHeight = node.offsetHeight;
    const currentContent = node.textContent;

    if (currentHeight > lastHeight || currentContent !== lastContent) {
      node.animate([
        { transform: 'translate(0.3px, 0.3px) rotate(0deg)' },
        { transform: 'translate(-0.3px, -0.5px) rotate(-0.3deg)' },
        { transform: 'translate(-0.7px, 0px) rotate(0.3deg)' },
        { transform: 'translate(0.7px, 0.5px) rotate(0deg)' },
        { transform: 'translate(0.3px, -0.3px) rotate(0.3deg)' },
        { transform: 'translate(-0.3px, 0.5px) rotate(-0.3deg)' }
      ], {
        duration: 500,
        easing: 'ease-in-out'
      });
    }

    lastHeight = currentHeight;
    lastContent = currentContent;
  }

  const observer = new MutationObserver(checkAndShake);
  observer.observe(node, { childList: true, characterData: true, subtree: true });

  return {
    destroy() {
      observer.disconnect();
      stopTimer();
    }
  };
}

function bubbleZoomAnimation(node: HTMLElement) {
  let lastContent = node.textContent;

  function checkAndZoom() {
    const currentContent = node.textContent;
    if (currentContent !== lastContent) {
      node.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.10)' },
        { transform: 'scale(1)' }
      ], {
        duration: 800,
        easing: 'ease-in-out'
      });
    }
    lastContent = currentContent;
  }

  const observer = new MutationObserver(checkAndZoom);
  observer.observe(node, { childList: true, characterData: true, subtree: true });

  return {
    destroy() {
      observer.disconnect();
    }
  };
}

function applyBothAnimations(node: HTMLElement) {
  const shakeAction = shake(node);
  const zoomAction = bubbleZoomAnimation(node);

  return {
    destroy() {
      shakeAction.destroy();
      zoomAction.destroy();
    }
  };
}

function useAnimation(node: HTMLElement) {
  let animation;
  switch (bubble.animationType) {
    case AnimationType.Shake:
      animation = shake(node);
      break;
    case AnimationType.Zoom:
      animation = bubbleZoomAnimation(node);
      break;
    case AnimationType.Both:
      animation = applyBothAnimations(node);
      break;
    case AnimationType.None:
    default:
      animation = { destroy: () => {} };
      stopTimer();
  }

  return {
    destroy() {
      animation.destroy();
      stopTimer();
    }
  };
}

function formatLargestTimeUnit(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
}
</script>

<div
  class="grid grid-cols-[auto_1fr] gap-2 relative"
  in:fly="{{ y: 5, duration: 400 }}"
>
  <Icon icon={bubble.llmProvider?.icon || 'default-icon'} class="w-12 h-12" />
  <div
    use:useAnimation
    class="card p-4 variant-soft rounded-tl-none space-y-2"
  >
    <header class="flex justify-between items-center">
      <div class="flex items-center space-x-2">
        <p class="font-bold capitalize">{bubble.name}</p>
        <small class="opacity-50">{bubble.llmProvider?.model || ''}</small>
      </div>
      <small class="opacity-50 self-end">{bubble.timestamp}</small>
    </header>
    <div bind:this={bubbleContentDiv} id={bubble.pid} class="font-nunito text-left"></div>
  </div>
  <div hidden={isHidden} id={`${bubble.pid}-stats-flag`} bind:this={statsFlag}>true</div>
  <div
    bind:this={statsElement}
    id={`${bubble.pid}-stats`}
    class="text-xs leading-5 opacity-30 self-end absolute bottom-[-30px] right-5 w-55 h-8 rounded text-gray-300"
  >
    -
  </div>
</div>
<br />

<style>
  :global(.blinking-cursor) {
    font-weight: 100;
    color: #2E3D48;
    -webkit-animation: 1s blink step-end infinite;
    -moz-animation: 1s blink step-end infinite;
    -ms-animation: 1s blink step-end infinite;
    -o-animation: 1s blink step-end infinite;
    animation: 1s blink step-end infinite;
  }

  @keyframes blink {
    from, to {
      color: transparent;
    }
    50% {
      color: #2E3D48;
    }
  }

  @-moz-keyframes blink {
    from, to {
      color: transparent;
    }
    50% {
      color: #2E3D48;
    }
  }

  @-webkit-keyframes blink {
    from, to {
      color: transparent;
    }
    50% {
      color: #2E3D48;
    }
  }

  @-ms-keyframes blink {
    from, to {
      color: transparent;
    }
    50% {
      color: #2E3D48;
    }
  }

  @-o-keyframes blink {
    from, to {
      color: transparent;
    }
    50% {
      color: #2E3D48;
    }
  }
</style>
