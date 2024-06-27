<!-- YOU CAN DELETE EVERYTHING IN THIS PAGE -->

<head>
  <title>MultiShot.ai - Chat</title>
	<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Lato:wght@400;700&family=Montserrat:wght@400;700&family=Raleway:wght@400;700&family=Poppins:wght@400;700&family=Ubuntu:wght@400;700&family=Nunito:wght@400;700&family=Merriweather:wght@400;700&family=Noto+Sans:wght@400;700&display=swap" rel="stylesheet">
</head>
<script>
	import MyJsChat from './MultiShotChat.svelte'
</script>

<div class="container mx-auto flex justify-center items-center w-[100%]">
	<div class="text-center flex flex-col items-center w-[100%]">
		<h2 class="p-5 font-nunito text-2xl bg-gradient-to-br from-pink-500 to-violet-500 bg-clip-text text-transparent box-decoration-clone">Welcome to MultiShot.AI</h2>
		<MyJsChat />
	</div>
</div>

<style lang="postcss">
	figure {
		@apply flex relative flex-col;
	}
	figure svg,
	.img-bg {
		@apply w-64 h-64 md:w-80 md:h-80;
	}
	.img-bg {
		@apply absolute z-[-1] rounded-full blur-[50px] transition-all;
		animation: pulse 5s cubic-bezier(0, 0, 0, 0.5) infinite,
			glow 5s linear infinite;
	}
	@keyframes glow {
		0% {
			@apply bg-primary-400/50;
		}
		33% {
			@apply bg-secondary-400/50;
		}
		66% {
			@apply bg-tertiary-400/50;
		}
		100% {
			@apply bg-primary-400/50;
		}
	}
	@keyframes pulse {
		50% {
			transform: scale(1.5);
		}
	}
</style>
