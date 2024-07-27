import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';

export default defineConfig({
	plugins: [
		sveltekit(),
		purgeCss(),
		Icons({
			compiler: 'svelte',
			autoInstall: true,
			customCollections: {
				// optional: add your custom collections of icons
				'my-icons': FileSystemIconLoader('./src/icons'),
			},
		}),
	],
	build: {
		sourcemap: true,
	},
	server: {
		hmr: {
			overlay: false
		}
	},
});
