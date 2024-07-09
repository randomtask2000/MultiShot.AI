<script>
    import { Avatar } from '@skeletonlabs/skeleton';
    import {
        renderMarkdown
    } from './tokenUtils';

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
    .text-align-right {
      text-align: left;
    }
</style>

<div class="grid grid-cols-[auto_1fr] gap-2">
    <Avatar src="{bubble.avatar}" width="w-12" />
    <div class="card p-4 variant-soft rounded-tl-none space-y-2">
        <header class="flex justify-between items-center">
            <p class="font-bold capitalize">{bubble.name}</p>
            <small class="opacity-50">{bubble.timestamp}</small>
        </header>
        <p id="{bubble.pid}" class="font-nunito text-align-right">{renderMarkdown(bubble.message)}</p>
    </div>
</div>
<br />
