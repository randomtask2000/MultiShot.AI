<!-- CodeBlock.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import hljs from 'highlight.js';

  export let content: string = '';
  export let language: string = 'python';

  let highlighted: string = '';

  $: {
    highlighted = hljs.highlight(content, { language }).value;
  }

  onMount(() => {
    hljs.highlightAll();
  });
</script>

<div class="code-block-wrapper bg-black p-4 rounded-md">
  <pre><code class="hljs language-{language}" style="background: black; color:white">{@html highlighted}</code></pre>
</div>

<style>
  .code-block-wrapper {
    overflow-x: auto;
  }
</style>
