import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface AudioState {
	isPlaying: boolean;
	isMuted: boolean;
}

// Declaración global en window para persistir entre navegaciones
declare global {
	interface Window {
		__tarotAudio?: HTMLAudioElement;
		__tarotAudioInitialized?: boolean;
	}
}

function createAudioStore() {
	const { subscribe, update } = writable<AudioState>({
		isPlaying: false,
		isMuted: false
	});

	// Función helper para obtener la instancia de audio
	const getAudioInstance = () => {
		if (!browser) return null;
		return window.__tarotAudio || null;
	};

	return {
		subscribe,
		initialize: () => {
			// Solo inicializar una vez en toda la aplicación
			if (!browser) {
				console.log('[Audio] No está en browser');
				return;
			}

			// Verificar si ya está inicializado usando window
			if (window.__tarotAudioInitialized && window.__tarotAudio) {
				console.log('[Audio] Ya inicializado - reutilizando instancia existente');
				// Actualizar el estado del store con el estado actual del audio
				update(state => ({
					...state,
					isPlaying: !window.__tarotAudio!.paused,
					isMuted: window.__tarotAudio!.muted
				}));
				return;
			}

			console.log('[Audio] Inicializando nueva instancia...');
			window.__tarotAudioInitialized = true;

			// Crear instancia global en window
			window.__tarotAudio = new Audio('/backsong.mp3');
			window.__tarotAudio.loop = true;
			window.__tarotAudio.volume = 0.3;
			window.__tarotAudio.preload = 'auto';

			// Intentar reproducir
			const tryPlay = async () => {
				try {
					await window.__tarotAudio?.play();
					console.log('[Audio] Reproduciendo automáticamente');
					update(state => ({ ...state, isPlaying: true }));
				} catch (err) {
					console.log('[Audio] Autoplay bloqueado. Esperando interacción del usuario.');
					update(state => ({ ...state, isPlaying: false }));
				}
			};

			tryPlay();

			// Listener para primera interacción
			const handleFirstInteraction = async () => {
				const audio = getAudioInstance();
				if (audio && audio.paused) {
					try {
						await audio.play();
						console.log('[Audio] Iniciado por interacción del usuario');
						update(state => ({ ...state, isPlaying: true }));
					} catch (err) {
						console.error('[Audio] Error al reproducir:', err);
					}
				}
			};

			// Agregar listeners con { once: true }
			document.addEventListener('click', handleFirstInteraction, { once: true });
			document.addEventListener('touchstart', handleFirstInteraction, { once: true });
			document.addEventListener('keydown', handleFirstInteraction, { once: true });

			// Event listeners del audio
			window.__tarotAudio.addEventListener('pause', () => {
				console.log('[Audio] Pausado');
				update(state => ({ ...state, isPlaying: false }));
			});

			window.__tarotAudio.addEventListener('play', () => {
				console.log('[Audio] Reproduciendo');
				update(state => ({ ...state, isPlaying: true }));
			});

			window.__tarotAudio.addEventListener('ended', () => {
				console.log('[Audio] Finalizado (esto no debería pasar con loop)');
			});
		},
		toggleMute: () => {
			const audio = getAudioInstance();
			if (!audio) {
				console.log('[Audio] No hay instancia de audio');
				return;
			}

			const newMutedState = !audio.muted;
			audio.muted = newMutedState;
			console.log('[Audio] Mute toggled:', newMutedState);
			update(state => ({ ...state, isMuted: newMutedState }));
		},
		play: async () => {
			const audio = getAudioInstance();
			if (!audio) return;

			try {
				await audio.play();
				update(state => ({ ...state, isPlaying: true }));
			} catch (err) {
				console.error('[Audio] Error al reproducir:', err);
			}
		},
		pause: () => {
			const audio = getAudioInstance();
			if (!audio) return;

			audio.pause();
			update(state => ({ ...state, isPlaying: false }));
		},
		setVolume: (volume: number) => {
			const audio = getAudioInstance();
			if (!audio) return;

			audio.volume = Math.max(0, Math.min(1, volume));
		}
	};
}

export const audioStore = createAudioStore();
