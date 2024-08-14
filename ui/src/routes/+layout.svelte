<script lang="ts">
  import { onMount } from 'svelte';
  import type { LlmProvider } from './types';
  import MyJsChat from './MultiShotChat.svelte';
  import '../app.postcss';
  import { AppShell } from '@skeletonlabs/skeleton';
  import hljs from 'highlight.js/lib/core';
  import 'highlight.js/styles/github-dark.css';
  import { storeHighlightJs } from '@skeletonlabs/skeleton';
  import xml from 'highlight.js/lib/languages/xml';
  import css from 'highlight.js/lib/languages/css';
  import javascript from 'highlight.js/lib/languages/javascript';
  import typescript from 'highlight.js/lib/languages/typescript';
  hljs.registerLanguage('xml', xml);
  hljs.registerLanguage('css', css);
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('typescript', typescript);
  storeHighlightJs.set(hljs);
  import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
  import { storePopup } from '@skeletonlabs/skeleton';
  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  let selectedItem: LlmProvider | null = null;
</script>

<!-- App Shell -->
<AppShell>
  <slot />
  <MyJsChat bind:selectedLlmProvider={selectedItem} />
</AppShell>
