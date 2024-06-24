import { join } from 'path'
import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import { skeleton } from '@skeletonlabs/tw-plugin';
import { theme_chat1 } from './src/theme_chat1'

export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}', join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')],
	theme: {
		extend: {
			fontFamily: {
				roboto: ['Roboto', 'sans-serif'],
				openSans: ['Open Sans', 'sans-serif'],
				lato: ['Lato', 'sans-serif'],
				montserrat: ['Montserrat', 'sans-serif'],
				raleway: ['Raleway', 'sans-serif'],
				poppins: ['Poppins', 'sans-serif'],
				ubuntu: ['Ubuntu', 'sans-serif'],
				nunito: ['Nunito', 'sans-serif'],
				merriweather: ['Merriweather', 'serif'],
				notoSans: ['Noto Sans', 'sans-serif'],
			},
		},
	},
	plugins: [
		forms,
		typography,
		skeleton({
			themes: {
				preset: [
					{
						name: 'skeleton',
						enhancements: true,
					},
					{
						name: 'wintry',
						enhancements: true,
					},
					{
						name: 'modern',
						enhancements: true,
					},
					{
						name: 'hamlindigo',
						enhancements: true,
					},
					{
						name: 'rocket',
						enhancements: true,
					},
					{
						name: 'sahara',
						enhancements: true,
					},
					{
						name: 'gold-nouveau',
						enhancements: true,
					},
					{
						name: 'vintage',
						enhancements: true,
					},
					{
						name: 'seafoam',
						enhancements: true,
					},
					{
						name: 'crimson',
						enhancements: true,
					},
				],
				custom: [
					theme_chat1,
				],
			},
		}),
	],
} satisfies Config;
