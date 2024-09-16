<script lang="ts">
    import { fly } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { StreamParser } from './markdownUtils';
    import Icon from '@iconify/svelte';
    import type { Bubble } from './types'; // Adjust the import path as needed

    export let bubble: Bubble;

    let bubbleContentDiv: HTMLElement;
    let bubbleStatsDiv: HTMLElement;
    let parser: StreamParser;
    let currentMessage = '';

    $: if (bubbleContentDiv && !parser) {
      parser = new StreamParser(bubbleContentDiv);
    }

    //$: if (parser && bubble.message !== currentMessage) {
    $: if (parser) {
      console.log("bubble");
      const newChunk = bubble.message.slice(currentMessage.length);
      parser.processChunk(newChunk);
      currentMessage = bubble.message;
    }

    $: if (currentMessage) {
      console.log("bubble.message");
    }

    onMount(() => {
        return () => {
            if (parser) {
                parser.finish();
            }
        };
    });

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
            updateTimeSpan();
        }

        const observer = new MutationObserver(checkAndShake);
        observer.observe(node, { childList: true, characterData: true, subtree: true });

        return {
            destroy() {
                observer.disconnect();
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

    const startTime: Date = new Date();
    let timeSpan: string = "loading..";
    
    function updateTimeSpan(): void {
      const endTime: Date = new Date();
      const timeSpanCalc = endTime.getTime() - startTime.getTime();
      if (bubbleStatsDiv){
        //bubbleContentDiv2.textContent = `timeSpan: ${timeSpan}; startTime: ${startTime.getTime()}; endTime: ${endTime.getTime()}; timeSpanCalc: ${timeSpanCalc.toString()}`;
        bubbleStatsDiv.textContent = formatLargestTimeUnit(timeSpanCalc);
      }
    }
</script>

<div
  class="grid grid-cols-[auto_1fr] gap-2 relative"
  in:fly="{{ y: 5, duration: 400 }}"
>
  <Icon icon={bubble.llmProvider?.icon || 'default-icon'} class="w-12 h-12" />
  <div
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
  <small bind:this={bubbleStatsDiv} class="text-xs leading-5 opacity-50 self-end opacity-20 absolute bottom-[-30px] right-5 w-55 h-8 rounded"></small>
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