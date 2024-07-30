<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import { fly } from 'svelte/transition';
    import { onMount, afterUpdate } from 'svelte';

    interface Bubble {
        color: string;
        name: string;
        timestamp: string;
        message: string;
        avatar: string;
        pid: string;
    }

    export let bubble: Bubble;

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
    <Avatar src={bubble.avatar} width="w-12" />
    <div
        use:shake
        class="card p-4 variant-soft rounded-tl-none space-y-2"
    >
        <header class="flex justify-between items-center">
            <p class="font-bold capitalize">{bubble.name}</p>
            <small class="opacity-50">{bubble.timestamp}</small>
        </header>
        <p id={bubble.pid} class="font-nunito text-left">{bubble.message}</p>
    </div>
</div>
<br />
