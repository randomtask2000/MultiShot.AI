<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import { fly } from 'svelte/transition';
    import { onMount, afterUpdate } from 'svelte';
    import { StreamParser } from './markdownUtils';
    import Icon from '@iconify/svelte';
    import type { LlmProvider, Bubble } from './types'; // Adjust the import path as needed
	import { llmProviderListStore } from './store';

    export let bubble: Bubble;

    let contentElement: HTMLElement;
    let parser: StreamParser;
    let currentMessage = '';

    $: if (contentElement && !parser) {
        parser = new StreamParser(contentElement);
    }

    $: if (parser && bubble.message !== currentMessage) {
        const newChunk = bubble.message.slice(currentMessage.length);
        parser.processChunk(newChunk);
        currentMessage = bubble.message;
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
        }

        const observer = new MutationObserver(checkAndShake);
        observer.observe(node, { childList: true, characterData: true, subtree: true });

        return {
            destroy() {
                observer.disconnect();
            }
        };
    }
</script>

<div
    class="grid grid-cols-[auto_1fr] gap-2"
    in:fly="{{ y: 5, duration: 400 }}"
>
    <!-- <Avatar src={bubble.avatar} width="w-12" /> -->
    <Icon icon={bubble.llmProvider?.icon || 'default-icon'} class="w-12 h-12" />
    <div
        use:shake
        class="card p-4 variant-soft rounded-tl-none space-y-2"
    >
        <header class="flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <p class="font-bold capitalize">{bubble.name}</p>
          <small class="opacity-50">{bubble.llmProvider?.model || ''}</small>
        </div>
        <small class="opacity-50 self-end">{bubble.timestamp}</small>
      </header>
        <div bind:this={contentElement} id={bubble.pid} class="font-nunito text-left"></div>
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