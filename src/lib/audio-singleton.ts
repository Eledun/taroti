// Sistema de audio con cambio dinámico según la ruta y crossfade suave
import { browser } from '$app/environment';

// Mapa de rutas a archivos de audio
const AUDIO_MAP: Record<string, string> = {
	'/': '/backsong.mp3',
	'/consulta': '/consultasong.mp3'
};

// Variable para rastrear si los listeners ya están agregados
let autoplayListenersAdded = false;

// Duración del crossfade en milisegundos (más largo = transición más suave)
const CROSSFADE_DURATION = 3000; // 3 segundos

// Inicializar audio principal si no existe
if (browser && !window.__tarotAudio) {
	console.log('[Audio] Creando instancia inicial');
	window.__tarotAudio = new Audio();
	window.__tarotAudio.loop = true;
	window.__tarotAudio.volume = 0.3;
	window.__tarotAudio.preload = 'auto';
	window.__tarotCurrentTrack = '/backsong.mp3'; // Track por defecto
	window.__tarotAudioSecondary = null; // Para crossfade
}

function tryAutoplay() {
	if (!window.__tarotAudio) return;

	window.__tarotAudio.play().then(() => {
		console.log('[Audio] Reproduciendo automáticamente');
		autoplayListenersAdded = false; // Reset flag si el autoplay funciona
	}).catch(() => {
		console.log('[Audio] Autoplay bloqueado - esperando interacción');

		// Solo agregar listeners si no están ya agregados
		if (autoplayListenersAdded) return;
		autoplayListenersAdded = true;

		const playOnce = () => {
			if (window.__tarotAudio && window.__tarotAudio.paused) {
				window.__tarotAudio.play().then(() => {
					console.log('[Audio] Iniciado por interacción del usuario');
					autoplayListenersAdded = false;
				}).catch(err => {
					console.error('[Audio] Error:', err);
				});
			}
			document.removeEventListener('click', playOnce);
			document.removeEventListener('touchstart', playOnce);
			document.removeEventListener('keydown', playOnce);
		};

		document.addEventListener('click', playOnce, { once: true });
		document.addEventListener('touchstart', playOnce, { once: true });
		document.addEventListener('keydown', playOnce, { once: true });
	});
}

export function getAudio(): HTMLAudioElement | null {
	if (!browser) return null;
	return window.__tarotAudio || null;
}

export function changeTrack(pathname: string): void {
	if (!browser || !window.__tarotAudio) return;

	// Determinar qué canción usar según la ruta
	let newTrack = '/backsong.mp3'; // Default

	// Buscar coincidencia en el mapa
	for (const [route, track] of Object.entries(AUDIO_MAP)) {
		if (pathname === route || pathname.startsWith(route + '/')) {
			newTrack = track;
			break;
		}
	}

	// Si ya está reproduciendo la canción correcta, solo asegurar que esté reproduciendo
	if (window.__tarotCurrentTrack === newTrack) {
		console.log('[Audio] Ya en track correcto:', newTrack);
		// Intentar reproducir si está pausado
		if (window.__tarotAudio.paused) {
			tryAutoplay();
		}
		return;
	}

	console.log('[Audio] Crossfade de', window.__tarotCurrentTrack, 'a', newTrack);

	const targetVolume = window.__tarotAudio.volume;
	const isMuted = window.__tarotAudio.muted;

	// Crear una segunda instancia de audio para el crossfade
	const newAudio = new Audio(newTrack);
	newAudio.loop = true;
	newAudio.volume = 0; // Empieza en silencio
	newAudio.muted = isMuted;
	newAudio.preload = 'auto';

	// Guardar referencia temporal
	window.__tarotAudioSecondary = newAudio;

	// Intentar reproducir el nuevo audio
	newAudio.play().then(() => {
		console.log('[Audio] Iniciando crossfade...');

		// Calcular el incremento de volumen para el crossfade
		const steps = CROSSFADE_DURATION / 50; // Actualizar cada 50ms
		const volumeStep = targetVolume / steps;

		let currentStep = 0;

		// Crossfade: bajar volumen del audio antiguo mientras sube el nuevo
		const crossfadeInterval = setInterval(() => {
			currentStep++;
			const progress = currentStep / steps;

			// Fade out del audio antiguo
			if (window.__tarotAudio) {
				window.__tarotAudio.volume = Math.max(0, targetVolume * (1 - progress));
			}

			// Fade in del audio nuevo
			if (newAudio) {
				newAudio.volume = Math.min(targetVolume, targetVolume * progress);
			}

			// Cuando termina el crossfade
			if (currentStep >= steps) {
				clearInterval(crossfadeInterval);

				// Detener y limpiar el audio antiguo
				if (window.__tarotAudio) {
					window.__tarotAudio.pause();
					window.__tarotAudio.src = '';
				}

				// El nuevo audio se convierte en el principal
				window.__tarotAudio = newAudio;
				window.__tarotCurrentTrack = newTrack;
				window.__tarotAudioSecondary = null;

				console.log('[Audio] Crossfade completado');
			}
		}, 50);

	}).catch(() => {
		// Si el autoplay falla, limpiar y esperar interacción
		console.log('[Audio] Autoplay bloqueado durante crossfade');
		window.__tarotAudioSecondary = null;
		tryAutoplay();
	});
}

export function toggleMute(): void {
	const audio = getAudio();
	if (!audio) return;

	audio.muted = !audio.muted;
	console.log('[Audio] Mute:', audio.muted);
}

export function isMuted(): boolean {
	const audio = getAudio();
	return audio?.muted ?? false;
}

export function isPlaying(): boolean {
	const audio = getAudio();
	return audio ? !audio.paused : false;
}

// Inicializar con la canción por defecto
if (browser && window.__tarotAudio && !window.__tarotAudio.src) {
	window.__tarotAudio.src = '/backsong.mp3';
	tryAutoplay();
}
