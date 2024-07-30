<script>
    import { Avatar } from '@skeletonlabs/skeleton';
    import { fly } from 'svelte/transition';

    export let bubble = {
        color: 'variant-soft-primary',
        name: 'system|user',
        timestamp: '02:00 PM',
        message: 'Hello from Svelte!',
        avatar: 'https://example.com/newAvatarUrl.png',
        pid: 'pid1',
    };
</script>

<style>
    @keyframes subtleShake {
        0% { transform: translate(0.3px, 0.3px) rotate(0deg); }
        20% { transform: translate(-0.3px, -0.5px) rotate(-0.3deg); }
        40% { transform: translate(-0.7px, 0px) rotate(0.3deg); }
        60% { transform: translate(0.7px, 0.5px) rotate(0deg); }
        80% { transform: translate(0.3px, -0.3px) rotate(0.3deg); }
        100% { transform: translate(-0.3px, 0.5px) rotate(-0.3deg); }
    }

    .subtle-shake {
        animation: subtleShake 0.5s ease-in-out;
        animation-iteration-count: 1;
    }
</style>

<div
    class="grid grid-cols-[auto_1fr] gap-2 subtle-shake"
    in:fly="{{ y: 5, duration: 400 }}"
>
    <Avatar src="{bubble.avatar}" width="w-12" />
    <div class="card p-4 variant-soft rounded-tl-none space-y-2">
        <header class="flex justify-between items-center">
            <p class="font-bold capitalize">{bubble.name}</p>
            <small class="opacity-50">{bubble.timestamp}</small>
        </header>
        <p id="{bubble.pid}" class="font-nunito text-left">{bubble.message}</p>
    </div>
</div>
<br />
