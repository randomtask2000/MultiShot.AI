<!-- CodeBlock.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import hljs from 'highlight.js';

  export let content: string = '';
  export let language: string = 'python';

  let highlighted: string = '';
  let copyText = 'Copy';
  let showCursor = true;
  let cursorTimeout: ReturnType<typeof setTimeout>;

  $: {
    highlighted = hljs.highlight(content, { language }).value;
    resetCursorTimeout();
  }

  function resetCursorTimeout() {
    clearTimeout(cursorTimeout);
    showCursor = true;
    cursorTimeout = setTimeout(() => {
      showCursor = false;
    }, 1000);
  }

  onMount(() => {
    hljs.highlightAll();
    return () => clearTimeout(cursorTimeout);
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

<div class="w-full overflow-hidden !bg-surface-900/70 rounded-md m-2">
  <div class="flex flex-wrap justify-between items-center p-2">
    <div class="text-xs sm:text-sm text-surface-300/70">language: {language}</div>
    <button
      on:click={copyToClipboard}
      class="text-xs sm:text-sm text-surface-300/70 hover:text-white focus:outline-none"
    >
      {copyText}
    </button>
  </div>
  <div class="overflow-x-auto code-content" style="max-height: 400px;">
    <pre class="p-2"><code class="hljs language-{language} !bg-surface-900/95 !text-white text-xs sm:text-sm">{@html highlighted}</code>{#if showCursor}<span class="cursor">{'█'}</span>{/if}</pre>
  </div>
</div>

<style>
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .cursor {
    display: inline-block;
    width: 0;
    animation: blink 0.7s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
  }

  .code-content {
    overflow-y: auto;
  }
</style>
