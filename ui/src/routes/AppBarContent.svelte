<script lang="ts">
	import { onMount } from 'svelte';
	import type { LlmProvider } from './types';
	import { LlmProviderList } from './types';
	import Icon from '@iconify/svelte';
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import { fade } from 'svelte/transition';
	import { themeStore, selectedModelStore, localWebLlmStore, llmProviderListStore } from './store';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { autoModeWatcher } from '@skeletonlabs/skeleton';
	import { setInitialClassState } from '@skeletonlabs/skeleton';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import ConfigModal from './ConfigModal.svelte';
	import { get } from 'svelte/store';

	export let selectedItem: LlmProvider | null = null;

	const themes = [
		'skeleton',
		'wintry',
		'modern',
		'hamlindigo',
		'rocket',
		'sahara',
		'gold-nouveau',
		'vintage',
		'seafoam',
		'crimson',
		'my-blue-steel',
	];

	let isConfigModalOpen: boolean = false;

	let selectedTheme: string;

	themeStore.subscribe((value) => {
		selectedTheme = value;
		if (typeof document !== 'undefined') {
			document.body.setAttribute('data-theme', value);
		}
	});

	function handleSelectItem(item: LlmProvider): void {
		selectedItem = item;
		selectedModelStore.setSelectedModel(item.model);
		isListBoxVisible = false;
	}

	function handleSelectTheme(theme: string): void {
		themeStore.setTheme(theme);
		isThemeListBoxVisible = false;
	}

	// Subscribe to the LlmProviderList store and selectedModelStore
	let providers: LlmProvider[];
	LlmProviderList.subscribe((value) => {
		providers = value;
		updateSelectedItem();
	});

	selectedModelStore.subscribe(() => {
		updateSelectedItem();
	});

	function updateSelectedItem() {
		const selectedModelValue = get(selectedModelStore);
		if (selectedModelValue && providers) {
			selectedItem = providers.find((item) => item.model === selectedModelValue) || null;
		} else if (!selectedItem && providers && providers.length > 0) {
			const desiredSelector = 'gpt-4o-mini';
			selectedItem = providers.find((item) => item.model === desiredSelector) || providers[0];
		}
	}

	let isListBoxVisible = false;
	let isThemeListBoxVisible = false;
	let listBoxContainer: HTMLElement;
	let themeListBoxContainer: HTMLElement;

	function handleClickOutside(event: MouseEvent) {
		if (listBoxContainer && !listBoxContainer.contains(event.target as Node)) {
			isListBoxVisible = false;
		}
		if (themeListBoxContainer && !themeListBoxContainer.contains(event.target as Node)) {
			isThemeListBoxVisible = false;
		}
	}

	onMount(() => {
		themeStore.init();
		selectedModelStore.init();
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	let localwebLlm: boolean;
	localWebLlmStore.subscribe((value) => {
		localwebLlm = value;
	});

	function handleLocalWebLlmChange(event: Event) {
		localWebLlmStore.setLocalWebLlm((event.target as HTMLInputElement).checked);
	}

	function removeProvider(model: string): void {
		llmProviderListStore.removeProvider(model);
		providers = providers.filter((provider) => provider.model !== model);
		if (selectedItem?.model === model) {
			selectedItem = null;
			selectedModelStore.setSelectedModel('');
		}
	}
</script>

<svelte:head
	>{@html '<script>(' +
		setInitialClassState.toString() +
		autoModeWatcher.toString() +
		')();</script>'}</svelte:head
>
<div class="relative" bind:this={listBoxContainer}>
	<button
		type="button"
		class="btn btn-sm variant-ghost-surface rounded-md"
		on:click|stopPropagation={() => (isListBoxVisible = !isListBoxVisible)}
	>
		<span>
			<Icon icon={selectedItem ? selectedItem.icon : 'material-symbols:skull'} class="w-6 h-5" />
		</span>
		<span
			class="font-nunito text-sm bg-gradient-to-br from-pink-500 to-violet-500
    bg-clip-text text-transparent box-decoration-clone"
			>{selectedItem ? selectedItem.title : 'Select Model'}</span
		>
		<SlideToggle
			name="slide"
			bind:checked={localwebLlm}
			on:change={handleLocalWebLlmChange}
			active=""
			size="sm">{localwebLlm ? 'local' : 'remote'}</SlideToggle
		>
	</button>
	{#if isListBoxVisible}
		<div
			transition:fade
			class="absolute top-full right-0 mt-2 z-50 min-w-[200px]
    w-max rounded-md p-3 bg-surface-200 dark:bg-surface-600"
		>
			<!-- config button -->
			{#if localwebLlm}
				<div class="flex justify-end">
					<button
						type="button"
						class="btn variant-filled"
						on:click={() => (isConfigModalOpen = true)}
					>
						<span>
							<Icon icon="majesticons:settings-cog-line" class="w-6 h-5" />
						</span>
						<span>Add local model</span>
					</button>
				</div>
			{/if}

			<ListBox class="w-full">
				{#each providers as item (item.model)}
					{#if item.local === localwebLlm}
						<div class="relative group">
							<ListBoxItem
								on:click={() => handleSelectItem(item)}
								active={selectedItem?.model === item.model}
								value={item.model}
								class="whitespace-nowrap"
								group="llmSelector"
								name="llmSelector"
							>
								<svelte:fragment slot="lead">
									<Icon icon={item.icon} class="text-white-800/90 w-6 h-6" />
								</svelte:fragment>
								{item.title}
							</ListBoxItem>
							<button
								type="button"
								class="absolute right-2 top-1/2 transform -translate-y-1/2 btn-icon 
                btn-icon-sm variant-ghost-error opacity-0 group-hover:opacity-100 
                transition-opacity duration-200"
								on:click|stopPropagation={() => removeProvider(item.model)}
							>
								<Icon icon="mdi:close" class="w-4 h-4"/>
							</button>
						</div>
					{/if}
				{/each}
			</ListBox>
		</div>
	{/if}
</div>
<div class="relative" bind:this={themeListBoxContainer}>
	<button
		type="button"
		class="btn btn-sm variant-ghost-surface rounded-md"
		on:click|stopPropagation={() => (isThemeListBoxVisible = !isThemeListBoxVisible)}
	>
		<span class="font-nunito">{selectedTheme}</span>
		<LightSwitch />
	</button>
	{#if isThemeListBoxVisible}
		<div
			transition:fade
			class="absolute top-full right-0 mt-2 z-50 min-w-[200px] w-max rounded-md
          p-3 max-h-[80vh] overflow-y-auto bg-surface-200 dark:bg-surface-600"
		>
			<ListBox class="w-full">
				{#each themes as theme}
					<ListBoxItem
						on:click={() => handleSelectTheme(theme)}
						active={selectedTheme === theme}
						value={theme}
						class="whitespace-nowrap"
						group="themeSelector"
						name="themeSelector"
					>
						{theme}
					</ListBoxItem>
				{/each}
			</ListBox>
		</div>
	{/if}
</div>
{#if isConfigModalOpen}
	<ConfigModal bind:open={isConfigModalOpen} bind:selectedItem />
{/if}
<a
	class="font-nunito btn btn-sm variant-ghost-surface rounded-md"
	href="https://twitter.com/cronuser"
	target="_blank"
	rel="noreferrer"
>
	<Icon icon="simple-icons:x" class="w-6 h-5" /></a
>
<a
	class="font-nunito btn btn-sm variant-ghost-surface rounded-md"
	href="https://github.com/randomtask2000/MultiShot.AI"
	target="_blank"
	rel="noreferrer"
>
	<Icon icon="simple-icons:github" class="w-6 h-5" /></a
>
