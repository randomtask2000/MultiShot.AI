<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { LlmProvider } from './types';
	import { LlmProviderList } from './types';
	import Icon from '@iconify/svelte';
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import { fade } from 'svelte/transition';
	import { themeStore, selectedModelStore, localWebLlmStore, llmProviderListStore, listStore } from './store';
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
		selectedItem = { ...item };
		selectedModelStore.setSelectedModel(item.model);
		isListBoxVisible = false;
	}

	function handleSelectTheme(theme: string): void {
		themeStore.setTheme(theme);
		isThemeListBoxVisible = false;
	}

	// Subscribe to the LlmProviderList store and selectedModelStore
	let llmProviders: LlmProvider[];
	LlmProviderList.subscribe((value) => {
		llmProviders = value;
		updateSelectedItem();
	});

	selectedModelStore.subscribe(() => {
		updateSelectedItem();
	});

	function updateSelectedItem() {
		const selectedModelValue = get(selectedModelStore);
		if (selectedModelValue && llmProviders) {
			const storedProvider = llmProviders.find(item => item.model === selectedModelValue);
			if (storedProvider) {
				selectedItem = { ...storedProvider };
			} else {
				// If not found in providers, check the chat history
				const chatHistory = get(listStore);
				const lastChatItem = chatHistory[chatHistory.length - 1];
				if (lastChatItem && lastChatItem.llmProvider) {
					selectedItem = { ...lastChatItem.llmProvider };
				} else {
					// Fallback to default selection
					const defaultItem = { ...llmProviders.find((item) => item.model === 'gpt-4o-mini') } || { ...llmProviders[0] };
					selectedItem = defaultItem;
				}
			}
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
		llmProviders = get(llmProviderListStore);
		if (selectedItem?.model === model) {
			selectedItem = null;
			selectedModelStore.setSelectedModel('');
		}
	}
</script>

<svelte:head>{@html '<script>(' +
		setInitialClassState.toString() +
		autoModeWatcher.toString() +
		')();</script>'}</svelte:head>

<div class="flex items-center space-x-5">
	<div class="relative" bind:this={listBoxContainer}>
		<button
			type="button"
			class="
			btn btn-sm 
			flex items-center justify-center 
			bg-surface-500/30 
			hover:bg-secondary-600 
			transition duration-300 font-nunito
			border-2 border-secondary-500/50"
			on:click|stopPropagation={() => (isListBoxVisible = !isListBoxVisible)}
		>
			<span>
				<Icon icon={selectedItem ? selectedItem.icon : 'material-symbols:skull'} class="w-6 h-5" />
			</span>
			<span
				class="font-nunito text-sm 
				bg-gradient-to-br 
				text-base font-bold 
				from-secondary-800 to-tertiary-900 
				dark:from-secondary-100/80 dark:to-tertiary-100/80 
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
							class="btn variant-filled bg-primary-500"
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
					{#each llmProviders as item (item.model)}
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
									class="absolute right-1 top-1/2 transform bg-secondary-500/70 
											-translate-y-1/2 btn-icon 
											btn-icon-sm opacity-0 group-hover:opacity-100 
											transition-opacity duration-[50ms] rounded-sm
											"
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
			class="btn btn-sm 
			flex items-center justify-center bg-surface-500/10 rounded 
			hover:bg-secondary-600 transition duration-300 font-nunito
			rounded-md"
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
</div>
{#if isConfigModalOpen}
	<ConfigModal bind:open={isConfigModalOpen} bind:selectedItem />
{/if}
