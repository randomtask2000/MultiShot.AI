<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { LlmProvider } from './types';
	import { LlmProviderList } from './types';
	import Icon, { getIcon } from '@iconify/svelte';
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import { fade } from 'svelte/transition';
	import { themeStore, selectedModelStore, localWebLlmStore, llmProviderListStore, listStore } from './store';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { autoModeWatcher } from '@skeletonlabs/skeleton';
	import { setInitialClassState } from '@skeletonlabs/skeleton';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import ConfigModal from './ConfigModal.svelte';
	import { get } from 'svelte/store';
	import { engine } from './tokenUtils';
	import * as webllm from "@mlc-ai/web-llm";
	//import { log } from 'console';

	export let selectedItem: LlmProvider | null = null;

	// This is where we start the webllm engine with the premise that we load the first entry in the list
	// TODO: this is a hack to get around the fact that the selectedItem is not updated when the user selects a new item
	$: if (selectedItem !== null) {
		localwebLlm = selectedItem.local;
		console.log(`**** selectedItem is changed in AppBarContent to ${selectedItem}`);
	} else if (selectedItem == null && llmProviders !== null)	{
		selectedItem = llmProviders[0];
		console.log(`**** selectedItem was null and is set in AppBarContent to ${selectedItem}`);
	}

	const DEFAULT_MODEL = 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC-1k';

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
	let availableModels: string[] = [];

	$: if (webllm !== null) {
		// TODO: appears to be the first call
		availableModels = webllm.prebuiltAppConfig.model_list.map(m => m.model_id);
		console.log('WebLLM is available');
	} else {
		console.log('WebLLM is not available');
	}

	let isConfigModalOpen: boolean = false;

	let selectedTheme: string;

	themeStore.subscribe((value) => {
		selectedTheme = value;
		if (typeof document !== 'undefined') {
			document.body.setAttribute('data-theme', value);
		}
	});

	// Define the method to handle toggling of isListBoxVisible
	function toggleListBoxVisibility(event: MouseEvent): void {
		event.stopPropagation();
		isListBoxVisible = !isListBoxVisible;
	}

	export function handleSelectItem(item: LlmProvider): void {
		try {
			if (localWebLlm !== null &&
				localWebLlm !== undefined &&
				item !== null &&
				item !== undefined &&
				ListBoxItem !== null &&
				ListBoxItem !== undefined &&
				ListBoxItem.selectedValue !== item) {

				selectedItem = { ...item };
				localWebLlm = selectedItem.local;
				selectedModelStore.setSelectedModel(item.model);
				isListBoxVisible = !isListBoxVisible;
				localwebLlm = selectedItem.local;
			}
		} catch (error) {
			console.error(`***** Error calling 'handleSelectItem':`, error);
		}
	}

/**
 * Returns an icon string based on the provided model name.
 *
 * @param modelName - The name of the model to determine the icon for.
 * @returns A string representing the icon to be used, based on the model name.
 */
export function getLlmIcon(modelName: string): string {
    if (modelName.toLowerCase().includes('llama')) {
        const currentSecond = new Date().getSeconds();
        return currentSecond % 2 === 0
            ? "fluent-emoji-high-contrast:llama"
            : "simple-icons:ollama";
    } else if (modelName.toLowerCase().includes('mistral')) {
        return "logos:mistral-ai-icon";
    } else if (modelName.toLowerCase().includes('gemma') || modelName.toLowerCase().includes('gemini')) {
        return "logos:google-gemini";
    } else if (modelName.toLowerCase().includes('phi-')) {
        return "arcticons:microsoft-bing";
    } else if (modelName.toLowerCase().includes('qwen')) {
        return "simple-icons:alibabacloud";
    } else if (modelName.toLowerCase().includes('smollm')) {
        return "simple-icons:saturn";
    } else {
        return "mdi:brain";
    }
}

	function handleModelSelection(event: Event) {
		const selectedModel = (event.target as HTMLSelectElement).value;
		selectedItem = {
			provider: "webllm",
			model: selectedModel,
			title: selectedModel,
			icon: getLlmIcon(selectedModel),
			subtitle: "Local WebLLM model",
			systemMessage: "You are a helpful AI assistant.",
			apiKeyName: "",
			local: true
		};
		llmProviders.push(selectedItem);
		ListBoxItem.selectedValue = selectedItem;
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
					let defaultItem;
					if (llmProviders.length > 0) {
						defaultItem = { ...llmProviders.find((item) => item.model === DEFAULT_MODEL) } || { ...llmProviders[0] };
					} else {
						console.log(`Starting with default llm ${selectedModel}`);
						selectedItem = {
							provider: "webllm",
							model: selectedModel,
							title: selectedModel,
							icon: getLlmIcon(selectedModel),
							subtitle: "Local WebLLM model",
							systemMessage: "You are a helpful AI assistant.",
							apiKeyName: "",
							local: true
						};
						llmProviders.push(selectedItem);
						ListBoxItem.selectedValue = selectedItem;
						defaultItem = selectedItem;
					}
					selectedItem = defaultItem;
				}
			}
		}
	}

	let isListBoxVisible = false;

	$: isListBoxVisibleChanged = () => {
		console.log('ListBox visibility changed:', isListBoxVisible);
	};

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
		// load available models lazily
		//availableModels = (await webllm.prebuiltAppConfig.model_list).map(m => m.model_id);
		//const webllm = await import('path-to-webllm-module'); // Adjust the import path as necessary
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
			on:click={toggleListBoxVisibility}
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
				<!-- add webllm dropdown -->
				{#if localwebLlm}
					<div class="flex justify-end">
						<!-- add web llm list here -->
						<div class="flex justify-end">
							<div>
								<label for="model-selection" class="block mb-2">Select Model</label>
								<select
									id="model-selection"
									class="w-full p-2 border rounded bg-surface-300"
									on:change={handleModelSelection}
								>
									{#each availableModels as model}
										<option value={model} selected={model === selectedItem?.model}>{model}</option>
									{/each}
								</select>
							</div>
						</div>
					</div>
				{/if}
				<!-- list of models -->
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
