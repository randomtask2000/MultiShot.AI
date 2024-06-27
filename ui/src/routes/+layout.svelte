<script lang="ts">
	import '../app.postcss';
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';

	// Highlight JS
	import hljs from 'highlight.js/lib/core';
	import 'highlight.js/styles/github-dark.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';
	import xml from 'highlight.js/lib/languages/xml'; // for HTML
	import css from 'highlight.js/lib/languages/css';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';

	hljs.registerLanguage('xml', xml); // for HTML
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	storeHighlightJs.set(hljs);

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

	import ItemList from './ItemList.svelte';
	import type { Item } from './types';

	let showList = false;
	const items: Item[] = [
		{ name: 'Item 1' },
		{ name: 'Item 2' },
		{ name: 'Item 3' },
		{ name: 'Item 4' },
	];
</script>

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="font-nunito text-xl bg-gradient-to-br from-pink-500 to-violet-500 bg-clip-text text-transparent box-decoration-clone">MultiShot.AI</strong>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<button class="font-nunito btn btn-sm variant-ghost-surface" on:click={() => (showList = !showList)}>
					{showList ? 'Hide List' : 'Show List'}
				</button>
				<a
					class="font-nunito btn btn-sm variant-ghost-surface"
					href="https://twitter.com/cronuser"
					target="_blank"
					rel="noreferrer"
				>
					Twitter
				</a>
				<a
					class="font-nunito btn btn-sm variant-ghost-surface"
					href="https://github.com/randomtask2000/OpenAI-FastAPI-Svelte-Static"
					target="_blank"
					rel="noreferrer"
				>
					GitHub
				</a>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<ItemList {items} isVisible={showList} />
	<!-- Page Route Content -->
	<slot />
</AppShell>
