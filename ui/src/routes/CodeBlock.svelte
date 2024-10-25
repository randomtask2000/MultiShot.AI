<script lang="ts">
  import { onMount } from 'svelte';
  import hljs from 'highlight.js';
  import DOMPurify from 'dompurify';

  export let content: string = '';
  export let language: string = 'python';

  let highlighted: string = '';
  let copyText = 'Copy';
  let showCursor = true;
  let cursorTimeout: ReturnType<typeof setTimeout>;

  const CURSOR_CHAR = '█'; // ASCII 219

  function sanitizeAndHighlight(code: string, lang: string): string {
    try {
      const highlighted = hljs.highlight(code, { language: lang }).value;
      return DOMPurify.sanitize(highlighted);
    } catch (e) {
      console.error('Highlight.js error:', e);
      return DOMPurify.sanitize(code);
    }
  }

  $: {
    highlighted = sanitizeAndHighlight(content, language);
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
  <div class="overflow-x-auto code-content">
    <!--<pre class="p-2 pb-3"><code class="hljs language-{language} !bg-surface-900/95 !text-white text-xs sm:text-sm">{@html highlighted}</code><span class="cursor" class:visible={showCursor}>{CURSOR_CHAR}</span></pre>-->
    <pre class="p-2 pb-3"><code class="hljs language-{language} !bg-surface-900/95 !text-white text-xs sm:text-sm">{@html highlighted}</code></pre>
    <!-- <pre class="p-2 pb-3"><code class="language-{language}">{@html highlighted}</code></pre> -->
  </div>
</div>

<style>
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    display: flex;
    align-items: flex-end;
    padding-bottom: 0.75rem; /* Added padding at the bottom */
    border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* Optional: adds a subtle line */
  }

  code {
    flex: 1;
  }

  .cursor {
    display: inline-block;
    width: 0.6em;
    height: 1.2em;
    vertical-align: text-bottom;
    opacity: 0;
    transition: opacity 0.1s;
  }

  .cursor.visible {
    opacity: 1;
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
