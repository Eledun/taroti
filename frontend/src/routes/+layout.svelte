<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Footer from '$lib/components/Footer.svelte';
	import { toggleMute, isMuted, changeTrack } from '$lib/audio-singleton';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import { isTransitioning } from '$lib/stores/transition';

	let { children } = $props();

	let muted = $state(false);

	function handleToggleMute() {
		toggleMute();
		muted = isMuted();
	}

	// Cambiar la música cuando cambie la ruta
	$effect(() => {
		changeTrack($page.url.pathname);
	});

	// View Transitions API para transiciones suaves entre páginas
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Taroti - Lecturas de Tarot Personalizadas</title>
	<meta name="description" content="Obtén lecturas de tarot personalizadas que revelan tu camino. Descubre respuestas profundas a tus preguntas más importantes." />
</svelte:head>

<div class="app">
	<main>
		{@render children()}
	</main>

	{#if !$isTransitioning}
		<Footer />
	{/if}

	<!-- Overlay de transición global -->
	{#if $isTransitioning}
		<div class="global-transition-overlay">
			<div class="moon-symbol">
				<svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
				</svg>
			</div>
		</div>
	{/if}

	<!-- Control de audio -->
	<button class="audio-control" onclick={handleToggleMute} aria-label={muted ? 'Activar sonido' : 'Silenciar'}>
		{#if muted}
			🔇
		{:else}
			🔊
		{/if}
	</button>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		position: relative;
		z-index: 1;
	}

	main {
		flex: 1;
		width: 100%;
		position: relative;
		z-index: 1;
	}

	.audio-control {
		position: fixed;
		bottom: 20px;
		right: 20px;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(109, 40, 217, 0.9));
		border: 2px solid rgba(168, 85, 247, 0.5);
		color: white;
		font-size: 24px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.3),
			0 0 20px rgba(168, 85, 247, 0.4);
		transition: all 0.3s ease;
		z-index: 1000;
		backdrop-filter: blur(10px);
	}

	.audio-control:hover {
		transform: scale(1.1);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.4),
			0 0 30px rgba(168, 85, 247, 0.6);
	}

	/* Transición global */
	.global-transition-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #000;
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeInOverlay 1s ease-in-out forwards, fadeOutOverlayGlobal 0.8s ease-in-out 3.2s forwards;
	}

	@keyframes fadeInOverlay {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	@keyframes fadeOutOverlayGlobal {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			visibility: hidden;
		}
	}

	.global-transition-overlay .moon-symbol {
		color: #8a9fb5;
		animation: moonAppear 2s ease-in-out 0.5s forwards;
		opacity: 0;
		transform: scale(0.5);
		filter: drop-shadow(0 0 30px rgba(138, 159, 181, 0.6));
	}

	@keyframes moonAppear {
		0% {
			opacity: 0;
			transform: scale(0.5) rotate(0deg);
		}
		50% {
			opacity: 1;
			transform: scale(1.2) rotate(180deg);
		}
		100% {
			opacity: 1;
			transform: scale(1) rotate(360deg);
		}
	}

	.audio-control:active {
		transform: scale(0.95);
	}

	@media (max-width: 768px) {
		.audio-control {
			width: 48px;
			height: 48px;
			font-size: 20px;
			bottom: 15px;
			right: 15px;
		}
	}
</style>
