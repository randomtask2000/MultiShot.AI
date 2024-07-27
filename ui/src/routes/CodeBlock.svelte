<!-- CodeBlock.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import hljs from 'highlight.js';

  export let content: string = '';
  export let language: string = 'python';

  let highlighted: string = '';
  let copyText = 'Copy';

  $: {
    highlighted = hljs.highlight(content, { language }).value;
  }

  onMount(() => {
    hljs.highlightAll();
  });

  function copyToClipboard() {
    navigator.clipboard.writeText(content).then(() => {
      copyText = 'Copied!';
      setTimeout(() => {
        copyText = 'Copy';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      copyText = 'Failed to copy';
    });
  }
</script>

<div class="overflow-x-auto !bg-surface-900/70 pt-0 pb-0 rounded-md">
  <div class="flex justify-between w-full">
    <div class="pl-2 text-sm text-surface-300/70">language: {language}</div>
    <button
      on:click={copyToClipboard}
      class="flex-grow pl-2 pr-2 text-sm text-surface-300/70 text-right hover:text-white focus:outline-none"
    >
      {copyText}
    </button>
  </div>
  <pre><code class="hljs language-{language} !bg-surface-900/95 !text-white text-xs">{@html highlighted}</code></pre>
  <div class="pr-2 text-sm text-surface-300/70 text-right">language: {language}</div>
</div>