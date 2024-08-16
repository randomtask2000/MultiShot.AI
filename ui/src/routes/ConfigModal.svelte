<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import * as webllm from "@mlc-ai/web-llm";
  import { LlmProviderList } from './types';
  import { listStore, llmProviderListStore, selectedModelStore } from './store';
  import type { LlmProvider } from './types';
  import LoadingAnimationNeural from './LoadingAnimationNeural.svelte';

  export let open = false;
  export let selectedItem: LlmProvider | null;

  const dispatch = createEventDispatcher();
  let dialog: HTMLDialogElement;
  let availableModels: string[] = [];
  let selectedModel = selectedItem?.model || "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k";
  let isDownloading = false;
  let isModelInitialized = false;
  let downloadStatus = '';
  let progressPercentage = 0;
  let statusMessage = '';

  const engine = new webllm.MLCEngine();

  onMount(() => {
    availableModels = webllm.prebuiltAppConfig.model_list.map(m => m.model_id);
  });

  $: if (open) {
    if (dialog && !dialog.open) dialog.showModal();
  } else {
    if (dialog && dialog.open) dialog.close();
  }

  function closeModal() {
    open = false;
    dispatch('close');
    updateSelectedItem();
  }

  function getIcon(modelName: string): string {
    if (modelName.toLowerCase().includes('llama')) {
      return "fluent-emoji-high-contrast:llama";
    } else if (modelName.toLowerCase().includes('mistral')) {
      return "logos:mistral-ai-icon";
    } else {
      return "mdi:brain";
    }
  }

  function updateSelectedItem() {
    if (selectedItem?.model !== selectedModel) {
      selectedItem = {
              provider: "webllm",
              model: selectedModel,
              title: selectedModel,
              icon: getIcon(selectedModel),
              subtitle: "Local WebLLM model",
              systemMessage: "You are a helpful AI assistant.",
              apiKeyName: "",
              local: true
      };
      selectedModelStore.setSelectedModel(selectedModel);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  async function initializeWebLLMEngine() {
    isDownloading = true;
    const config = {
      temperature: 1.0,
      top_p: 1
    };

    try {
      await engine.reload(selectedModel, config);
      
      isDownloading = false;
      isModelInitialized = true;
      downloadStatus = "Model initialized successfully.";

      // Check if the provider already exists before adding
      LlmProviderList.update((providers: LlmProvider[]) => {
        if (!providers.some(p => p.provider === "webllm" && p.model === selectedModel)) {
          return [
            ...providers,
            {
              provider: "webllm",
              model: selectedModel,
              title: selectedModel,
              icon: "mdi:brain",
              subtitle: "Local WebLLM model",
              systemMessage: "You are a helpful AI assistant.",
              apiKeyName: "",
              local: true,
              selected: true
            }
          ];
        }
        return providers.map(p => p.model === selectedModel ? { ...p, selected: true } : { ...p, selected: false });
      });

      // Update the store with the new model
      listStore.addModel(selectedModel);
      selectedModelStore.setSelectedModel(selectedModel);
    } catch (error) {
      console.error("Error initializing WebLLM engine:", error);
      downloadStatus = "Error: Failed to initialize the model. Please try again.";
    } finally {
      isDownloading = false;
    }
  }

  function updateEngineInitProgressCallback(report: { progress: number; text: string }) {
    statusMessage = report.text;
    //console.log(report.text);
  }

  function initProgressCallback(report: { progress: number; text: string }) {
    progressPercentage = Math.round(report.progress * 100);
    downloadStatus = `${report.text} (${progressPercentage}%)`;
    //console.log(progressPercentage);
  }

  engine.setInitProgressCallback(updateEngineInitProgressCallback);
  engine.setInitProgressCallback(initProgressCallback);
</script>

<dialog bind:this={dialog} on:close={closeModal} 
class="w-full max-w-2xl p-4 rounded-lg shadow-xl bg-surface-100/90 
text-left fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">

  <div class="flex flex-col h-full">
    <div class="flex justify-between items-start mb-4">
      <div class="space-y-2">
        <h2 class="h2">Download Model</h2>
        <p class="text-sm">
          These are free LLMs that can be run in the browser completely privately without a 3rd party 
          processing your prompts. However, you'll have to download the model first; larger models 
          (see models like Meta's Llama 3.1-8B 4GB) may run slow on your computer.
        </p>
      </div>
      <button
        on:click={closeModal}
        class="btn btn-sm btn-icon variant-ghost-surface bg-primary-500/30"
        aria-label="Close modal"
      >
        <Icon icon="mdi:close" />
      </button>
    </div>

    <div class="space-y-4 flex-grow overflow-y-auto">
      <div>
        <label for="model-selection" class="block mb-2">Select Model</label>
        <select
          id="model-selection"
          bind:value={selectedModel}
          class="w-full p-2 border rounded bg-surface-300"
        >
          {#each availableModels as model}
            <option value={model}>{model}</option>
          {/each}
        </select>
      </div>

      <div>
        <button
          on:click={initializeWebLLMEngine}
          disabled={isDownloading || isModelInitialized}
          class="px-4 py-2 bg-primary-500  text-white rounded hover:bg-primary-300 disabled:bg-primary-300"
        >
          {isDownloading ? 'Downloading...' : isModelInitialized ? 'Model Initialized' : 'Download'}
        </button>
        {#if isDownloading}
          <div class="mt-2 flex flex-col">
            <progress value={progressPercentage} max="100" class="w-full"></progress>
            <p class="mt-1">{downloadStatus}</p>
            <p class="mt-1">{statusMessage}</p>
          </div>
        {/if}
      </div>
    </div>

    <div class="flex justify-end mt-4">
      <button
        on:click={closeModal}
        class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
      >
        Close
      </button>
    </div>
  </div>
</dialog>

<style>
  dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }
</style>