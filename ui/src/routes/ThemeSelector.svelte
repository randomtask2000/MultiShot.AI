<script lang="ts">
    import { fade } from 'svelte/transition';
    import { ListBox, ListBoxItem, LightSwitch } from '@skeletonlabs/skeleton';
    import { themeStore } from './store';
    
    export let themes: string[];
    
    let isThemeListBoxVisible = false;
    let themeListBoxContainer: HTMLElement;
    
    let selectedTheme: string;
    
    themeStore.subscribe((value) => {
        selectedTheme = value;
        if (typeof document !== 'undefined') {
            document.body.setAttribute('data-theme', value);
        }
    });
    
    function handleSelectTheme(theme: string): void {
        themeStore.setTheme(theme);
        isThemeListBoxVisible = false;
    }
    
    function handleClickOutside(event: MouseEvent) {
        if (themeListBoxContainer && !themeListBoxContainer.contains(event.target as Node)) {
            isThemeListBoxVisible = false;
        }
    }
    </script>
    
    <svelte:window on:click={handleClickOutside} />
    
    <div class="relative" bind:this={themeListBoxContainer}>
        <button
            type="button"
            class="btn btn-sm flex items-center justify-center bg-surface-500/10 text-white rounded 
            hover:bg-secondary-600 transition duration-300 font-nunito rounded-md"
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