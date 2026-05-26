<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, preloadData } from '$app/navigation';
	import { obtenerPlanes } from '$lib/services/api';
	import type { Plan } from '$lib/types';
	import heroImage from '$lib/assets/images/sol.jpeg';
	import moonImage from '$lib/assets/images/moon.jpeg';
	import { isTransitioning } from '$lib/stores/transition';

	let planes = $state<Plan[]>([]);
	let cargando = $state(true);
	let error = $state<string | null>(null);
	let heroOpacity = $state(1);
	let isSticky = $state(false);
	let showTransition = $state(false);
	let fadeOutTransition = $state(false);

	onMount(async () => {
		// Forzar scroll al inicio de la página
		window.scrollTo(0, 0);

		try {
			console.log('[DEBUG] Iniciando carga de planes...');
			cargando = true;
			console.log('[DEBUG] Llamando a obtenerPlanes()...');
			planes = await obtenerPlanes();
			console.log('[DEBUG] Planes obtenidos:', planes);
		} catch (err) {
			console.error('[ERROR] Error cargando planes:', err);
			error = 'No se pudieron cargar los planes. Por favor, intenta más tarde.';
		} finally {
			cargando = false;
			console.log('[DEBUG] Carga finalizada. cargando=false');
		}

		// Efecto de scroll para el hero y sticky
		const planesSection = document.querySelector('.planes-section');

		const handleScroll = () => {
			const scrolled = window.scrollY;
			const windowHeight = window.innerHeight;

			// Calcula la opacidad basada en el scroll (desaparece al llegar al final del viewport)
			const opacity = Math.max(0, 1 - (scrolled / windowHeight) * 1.5);
			heroOpacity = opacity;

			// Activar sticky cuando el scroll pase el hero (100vh)
			if (planesSection) {
				const planesSectionTop = planesSection.getBoundingClientRect().top;
				isSticky = planesSectionTop <= 0;
			}
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function formatearPrecio(precio: number): string {
		return new Intl.NumberFormat('es-CL', {
			style: 'currency',
			currency: 'CLP'
		}).format(precio);
	}

	async function seleccionarPlan(plan: Plan) {
		const targetUrl = `/consulta/${plan.id}`;

		// Precargar datos PRIMERO (antes de mostrar animación)
		await preloadData(targetUrl).catch(() => {
			console.log('Preload falló, pero continuamos');
		});

		// AHORA activar transición (esto oculta el footer)
		showTransition = true;
		isTransitioning.set(true);

		// Mostrar animación por 3 segundos (1s fade in + 2s luna)
		await new Promise(resolve => setTimeout(resolve, 3000));

		// NAVEGAR ANTES del fade out (mientras el overlay aún está negro opaco)
		await goto(targetUrl, { replaceState: false, noScroll: true });

		// El overlay se desvanecerá automáticamente en 0.2s más (a los 3.2s desde que apareció)
		// revelando la nueva página ya cargada
	}
</script>

<div class="home">
	<section class="hero" style="background-image: url({heroImage}); opacity: {heroOpacity};">
		<div class="hero-overlay"></div>
		<div class="container">
			<div class="hero-content">
				<h1 class="hero-title">
					<span class="gradient-text">Taroti</span>
				</h1>
				<h2 class="hero-subtitle">Descubre tu Destino</h2>
				<p class="hero-description">
					Las cartas revelan lo que el futuro guarda,<br />
					iluminamos tu camino en tiempos de incertidumbre
				</p>
			</div>
		</div>
	</section>

	<section class="planes-section" style="background-image: url({moonImage});">
		<div class="planes-container" class:sticky={isSticky}>
			<div class="container-content">
				<h2 class="section-title">Elige tu Sendero</h2>
				<p class="section-description">
					Tu pregunta será respondida. El universo escucha.
				</p>

			{#if cargando}
				<div class="loading">
					<div class="spinner"></div>
					<p>Cargando planes...</p>
				</div>
			{:else if error}
				<div class="error-message">
					<p>{error}</p>
				</div>
			{:else}
				<div class="planes-grid">
					{#each planes as plan, index (plan.id)}
						<div class="plan-card-container">
							{#if index === 1}
								<div class="plan-badge">Más Elegida</div>
							{/if}
							<div class="plan-card-inner plan-card-{index + 1}">
								<!-- Frente de la tarjeta -->
								<div class="plan-card-front">
									<div class="plan-icon">
										{#if index === 0}
											<!-- Luna creciente -->
											<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
											</svg>
										{:else if index === 1}
											<!-- Sol -->
											<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<circle cx="12" cy="12" r="5"/>
												<line x1="12" y1="1" x2="12" y2="3"/>
												<line x1="12" y1="21" x2="12" y2="23"/>
												<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
												<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
												<line x1="1" y1="12" x2="3" y2="12"/>
												<line x1="21" y1="12" x2="23" y2="12"/>
												<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
												<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
											</svg>
										{:else}
											<!-- Estrella -->
											<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
											</svg>
										{/if}
									</div>
									<div class="plan-header">
										<h3 class="plan-name">{plan.nombre}</h3>
										<span class="plan-cartas">{plan.num_cartas} cartas</span>
									</div>

									<div class="plan-body">
										<div class="plan-precio">
											<div class="precio-decoracion">✦</div>
											<span class="precio-principal">{formatearPrecio(plan.precio_base)}</span>
											<div class="precio-decoracion">✦</div>
										</div>
									</div>

									<!-- Botón en el frente -->
									<div class="plan-button-front">
										<button
											class="btn-seleccionar"
											onclick={() => seleccionarPlan(plan)}
										>
											Comenzar Lectura
										</button>
									</div>
								</div>

								<!-- Reverso de la tarjeta -->
								<div class="plan-card-back">
									<div class="plan-description">
										{#if index === 0}
											<p>La luna guía tres arcanos que revelan el mensaje inmediato del universo. Claridad directa para decisiones urgentes.</p>
										{:else if index === 1}
											<p>Diez cartas despliegan los secretos del tiempo: pasado que te forjó, presente que vives, futuro que construyes. Sabiduría completa.</p>
										{:else}
											<p>Doce arcanos mayores desvelan los misterios más profundos. Una lectura total que ilumina todos los aspectos de tu existencia.</p>
										{/if}
									</div>

									<!-- Botón en el reverso -->
									<div class="plan-button-back">
										<button
											class="btn-seleccionar"
											onclick={() => seleccionarPlan(plan)}
										>
											Comenzar Lectura
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
			</div>
		</div>
	</section>

	<!-- Transición de fade a negro con luna -->
	{#if showTransition}
		<div class="transition-overlay" class:fade-out={fadeOutTransition}>
			<div class="moon-symbol">
				<svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
				</svg>
			</div>
		</div>
	{/if}
</div>

<style>
	.hero {
		padding: clamp(4rem, 12vh, 8rem) 0;
		text-align: center;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		overflow: hidden;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-attachment: fixed;
		z-index: 0;
	}

	.hero-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			to bottom,
			rgba(26, 40, 68, 0.85) 0%,
			rgba(26, 40, 68, 0.75) 50%,
			rgba(26, 40, 68, 0.9) 100%
		);
		z-index: 0;
		transition: opacity 0.3s ease;
	}

	.hero-content {
		max-width: 900px;
		margin: 0 auto;
		position: relative;
		z-index: 1;
		padding: 0 var(--spacing-lg);
	}

	.hero-title {
		font-size: clamp(3.5rem, 10vw, 6.5rem);
		margin-bottom: var(--spacing-md);
		line-height: 1.1;
		letter-spacing: 0.05em;
		font-weight: 700;
		color: var(--color-text);
		animation: fadeInUp 1s ease-out;
		text-align: center;
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
		filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5));
	}

	.hero-subtitle {
		font-size: clamp(2rem, 5vw, 3.5rem);
		margin-bottom: var(--spacing-lg);
		line-height: 1.2;
		letter-spacing: 0.1em;
		font-weight: 600;
		color: var(--color-text);
		text-transform: uppercase;
		animation: fadeInUp 1s ease-out 0.2s both;
		text-align: center;
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
		text-shadow:
			0 0 20px rgba(224, 122, 60, 0.4),
			0 0 40px rgba(224, 122, 60, 0.2),
			0 4px 8px rgba(0, 0, 0, 0.6);
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.gradient-text {
		background: linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-light), var(--color-primary));
		background-size: 200% 200%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: gradientShift 8s ease infinite;
		display: inline-block;
	}

	@keyframes gradientShift {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	.hero-description {
		font-size: clamp(1.1rem, 2.5vw, 1.5rem);
		color: var(--color-text-muted);
		line-height: 1.7;
		max-width: 800px;
		margin: 0 auto;
		animation: fadeInUp 1s ease-out 0.3s both;
		font-weight: 300;
		text-align: center;
	}

	.planes-section {
		padding: 0;
		position: relative;
		margin-top: 100vh;
		z-index: 1;
		box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.5);
		min-height: 100vh;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-attachment: fixed;
	}

	.planes-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			to bottom,
			rgba(26, 40, 68, 0.85) 0%,
			rgba(26, 40, 68, 0.75) 50%,
			rgba(26, 40, 68, 0.9) 100%
		);
		z-index: 0;
		transition: opacity 0.3s ease;
	}

	.planes-container {
		z-index: 1;
		min-height: 100vh;
		max-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		max-width: 1200px;
		margin: 0 auto;
		padding: clamp(2rem, 5vh, 4rem) var(--spacing-md);
		transition: all 0.3s ease;
	}

	.planes-container.sticky {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
	}

	.container-content {
		position: relative;
		z-index: 1;
	}

	.section-title {
		text-align: center;
		margin-bottom: var(--spacing-md);
		font-size: clamp(2rem, 5vw, 2.5rem);
		letter-spacing: -0.01em;
	}

	.section-description {
		text-align: center;
		color: var(--color-text-muted);
		margin-bottom: clamp(2rem, 6vh, 4rem);
		font-size: clamp(1rem, 2vw, 1.1rem);
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.loading {
		text-align: center;
		padding: var(--spacing-xl);
	}

	.loading p {
		margin-top: var(--spacing-md);
		color: var(--color-text-muted);
	}

	.error-message {
		text-align: center;
		padding: var(--spacing-xl);
		color: var(--color-error);
	}

	.planes-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(320px, 400px));
		gap: clamp(1.5rem, 3vw, 2rem);
		margin-bottom: var(--spacing-xl);
		max-width: 1400px;
		margin-left: auto;
		margin-right: auto;
		padding: 0 var(--spacing-md);
		justify-content: center;
	}

	/* Contenedor de la tarjeta con perspectiva 3D */
	.plan-card-container {
		perspective: 1000px;
		position: relative;
		height: 520px;
	}

	/* Inner card que contiene front y back */
	.plan-card-inner {
		position: relative;
		width: 100%;
		height: 100%;
		transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		transform-style: preserve-3d;
		border-radius: 1.5rem;
	}

	.plan-card-container:hover .plan-card-inner {
		transform: rotateY(180deg);
	}

	/* Frente y reverso compartidos */
	.plan-card-front,
	.plan-card-back {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
		border-radius: 1.5rem;
		padding: clamp(2rem, 5vw, 2.5rem);
		backdrop-filter: blur(10px);
		overflow: hidden;
	}

	/* Textura de fondo sutil */
	.plan-card-front::before,
	.plan-card-back::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0.03;
		background-image:
			repeating-linear-gradient(45deg, transparent, transparent 2px, currentColor 2px, currentColor 4px),
			repeating-linear-gradient(-45deg, transparent, transparent 2px, currentColor 2px, currentColor 4px);
		pointer-events: none;
		z-index: 1;
	}

	/* Patrón decorativo en las esquinas */
	.plan-card-front::after,
	.plan-card-back::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 1.5rem;
		background:
			radial-gradient(circle at 0% 0%, rgba(224, 122, 60, 0.15) 0%, transparent 50%),
			radial-gradient(circle at 100% 0%, rgba(224, 122, 60, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 100% 100%, rgba(224, 122, 60, 0.15) 0%, transparent 50%),
			radial-gradient(circle at 0% 100%, rgba(224, 122, 60, 0.1) 0%, transparent 50%);
		pointer-events: none;
		z-index: 1;
	}

	/* Asegurar que el contenido esté sobre las texturas */
	.plan-card-front > *,
	.plan-card-back > * {
		position: relative;
		z-index: 2;
	}

	/* Frente de la tarjeta */
	.plan-card-front {
		transform: rotateY(0deg);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	/* Reverso de la tarjeta */
	.plan-card-back {
		transform: rotateY(180deg);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.plan-description {
		text-align: center;
		padding: var(--spacing-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
	}

	.plan-description p {
		font-family: var(--font-mystical);
		font-size: clamp(1.25rem, 3vw, 1.5rem);
		line-height: 1.9;
		color: var(--color-cream);
		font-style: italic;
		font-weight: 400;
		letter-spacing: 0.02em;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	/* Botón siempre visible */
	.plan-button {
		position: absolute;
		bottom: clamp(1.5rem, 4vw, 2rem);
		left: clamp(1.5rem, 4vw, 2rem);
		right: clamp(1.5rem, 4vw, 2rem);
		z-index: 10;
		transform-style: preserve-3d;
		transform: translateZ(50px);
	}

	/* Tarjeta 1 - Luna (Plateado/Azul) */
	.plan-card-1 .plan-card-front,
	.plan-card-1 .plan-card-back {
		background: linear-gradient(135deg,
			rgba(107, 130, 153, 0.15) 0%,
			rgba(61, 79, 107, 0.25) 100%);
		border: 2px solid transparent;
		background-image:
			linear-gradient(rgba(37, 55, 82, 0.9), rgba(37, 55, 82, 0.9)),
			linear-gradient(135deg,
				rgba(107, 130, 153, 0.6) 0%,
				rgba(138, 159, 181, 0.8) 25%,
				rgba(107, 130, 153, 0.6) 50%,
				rgba(138, 159, 181, 0.8) 75%,
				rgba(107, 130, 153, 0.6) 100%);
		background-origin: border-box;
		background-clip: padding-box, border-box;
		box-shadow:
			0 8px 32px rgba(107, 130, 153, 0.3),
			inset 0 1px 0 rgba(138, 159, 181, 0.2),
			inset 0 -1px 0 rgba(61, 79, 107, 0.3);
	}

	.plan-card-1 .plan-icon {
		color: #8a9fb5;
	}

	/* Tarjeta 2 - Sol (Dorado) */
	.plan-card-2 {
		transform: scale(1.05);
	}

	.plan-card-2 .plan-card-front,
	.plan-card-2 .plan-card-back {
		background: linear-gradient(135deg,
			rgba(212, 175, 55, 0.15) 0%,
			rgba(184, 134, 11, 0.25) 100%);
		border: 2px solid transparent;
		background-image:
			linear-gradient(rgba(37, 55, 82, 0.9), rgba(37, 55, 82, 0.9)),
			linear-gradient(135deg,
				rgba(212, 175, 55, 0.7) 0%,
				rgba(244, 196, 48, 0.9) 25%,
				rgba(212, 175, 55, 0.7) 50%,
				rgba(244, 196, 48, 0.9) 75%,
				rgba(212, 175, 55, 0.7) 100%);
		background-origin: border-box;
		background-clip: padding-box, border-box;
		box-shadow:
			0 8px 32px rgba(212, 175, 55, 0.4),
			0 0 40px rgba(212, 175, 55, 0.2),
			inset 0 1px 0 rgba(244, 196, 48, 0.3),
			inset 0 -1px 0 rgba(184, 134, 11, 0.3);
	}

	.plan-card-2 .plan-icon {
		color: #d4af37;
		animation: sunGlow 3s ease-in-out infinite;
	}

	@keyframes sunGlow {
		0%, 100% {
			filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5));
		}
		50% {
			filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.8));
		}
	}

	/* Tarjeta 3 - Estrella (Púrpura) */
	.plan-card-3 .plan-card-front,
	.plan-card-3 .plan-card-back {
		background: linear-gradient(135deg,
			rgba(139, 92, 246, 0.15) 0%,
			rgba(109, 40, 217, 0.25) 100%);
		border: 2px solid transparent;
		background-image:
			linear-gradient(rgba(37, 55, 82, 0.9), rgba(37, 55, 82, 0.9)),
			linear-gradient(135deg,
				rgba(139, 92, 246, 0.6) 0%,
				rgba(167, 139, 250, 0.8) 25%,
				rgba(139, 92, 246, 0.6) 50%,
				rgba(167, 139, 250, 0.8) 75%,
				rgba(139, 92, 246, 0.6) 100%);
		background-origin: border-box;
		background-clip: padding-box, border-box;
		box-shadow:
			0 8px 32px rgba(139, 92, 246, 0.3),
			inset 0 1px 0 rgba(167, 139, 250, 0.2),
			inset 0 -1px 0 rgba(109, 40, 217, 0.3);
	}

	.plan-card-3 .plan-icon {
		color: #a78bfa;
	}

	/* Badge "Más Popular" */
	.plan-badge {
		position: absolute;
		top: -12px;
		right: 20px;
		background: linear-gradient(135deg, #d4af37, #f4c430);
		color: #1a2844;
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		box-shadow: 0 4px 15px rgba(212, 175, 55, 0.5);
		z-index: 10;
		animation: badgePulse 2s ease-in-out infinite;
	}

	@keyframes badgePulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	/* Iconos */
	.plan-icon {
		text-align: center;
		margin-bottom: var(--spacing-md);
		animation: iconFloat 4s ease-in-out infinite;
	}

	@keyframes iconFloat {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.plan-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg,
			transparent,
			var(--color-primary),
			var(--color-secondary),
			transparent);
		opacity: 0;
		transition: opacity 0.4s ease;
	}

	.plan-card-container:hover .plan-card-1 .plan-card-front,
	.plan-card-container:hover .plan-card-1 .plan-card-back {
		border-color: rgba(107, 130, 153, 0.6);
		box-shadow:
			0 20px 40px rgba(107, 130, 153, 0.4),
			0 0 60px rgba(107, 130, 153, 0.2);
	}

	.plan-card-container:hover .plan-card-2 .plan-card-front,
	.plan-card-container:hover .plan-card-2 .plan-card-back {
		border-color: rgba(212, 175, 55, 0.7);
		box-shadow:
			0 20px 40px rgba(212, 175, 55, 0.5),
			0 0 60px rgba(212, 175, 55, 0.3);
	}

	.plan-card-container:hover .plan-card-3 .plan-card-front,
	.plan-card-container:hover .plan-card-3 .plan-card-back {
		border-color: rgba(139, 92, 246, 0.6);
		box-shadow:
			0 20px 40px rgba(139, 92, 246, 0.4),
			0 0 60px rgba(139, 92, 246, 0.2);
	}

	.plan-header {
		text-align: center;
		margin-bottom: var(--spacing-lg);
		padding-bottom: var(--spacing-md);
		position: relative;
	}

	.plan-header::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 60%;
		height: 2px;
		background: linear-gradient(90deg,
			transparent,
			var(--color-primary),
			transparent);
		box-shadow: 0 0 10px rgba(224, 122, 60, 0.3);
	}

	.plan-card-1 .plan-header::after {
		background: linear-gradient(90deg,
			transparent,
			rgba(138, 159, 181, 0.6),
			transparent);
		box-shadow: 0 0 10px rgba(138, 159, 181, 0.2);
	}

	.plan-card-2 .plan-header::after {
		background: linear-gradient(90deg,
			transparent,
			rgba(212, 175, 55, 0.8),
			transparent);
		box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
	}

	.plan-card-3 .plan-header::after {
		background: linear-gradient(90deg,
			transparent,
			rgba(139, 92, 246, 0.6),
			transparent);
		box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
	}

	.plan-name {
		font-family: var(--font-primary);
		font-size: clamp(1.5rem, 3vw, 1.75rem);
		margin-bottom: var(--spacing-sm);
		background: linear-gradient(135deg, var(--color-text), var(--color-primary-light));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.plan-cartas {
		color: var(--color-text-muted);
		font-size: clamp(0.875rem, 1.5vw, 1rem);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	.plan-body {
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 3vw, 1.5rem);
	}

	.plan-precio {
		text-align: center;
		padding: clamp(1.5rem, 4vw, 2rem) 0;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(180deg,
			rgba(224, 122, 60, 0.08) 0%,
			rgba(139, 90, 60, 0.12) 50%,
			rgba(224, 122, 60, 0.08) 100%);
		border-radius: var(--radius-lg);
		margin: 0 var(--spacing-sm);
		box-shadow:
			inset 0 1px 0 rgba(224, 122, 60, 0.2),
			inset 0 -1px 0 rgba(139, 90, 60, 0.2);
	}

	.precio-decoracion {
		color: var(--color-primary);
		font-size: 1.5rem;
		opacity: 0.6;
		animation: twinkle 2s ease-in-out infinite;
	}

	@keyframes twinkle {
		0%, 100% {
			opacity: 0.4;
			transform: scale(1);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.1);
		}
	}

	.precio-etiqueta {
		font-family: var(--font-primary);
		font-size: clamp(0.75rem, 1.5vw, 0.875rem);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.precio-principal {
		display: block;
		font-family: var(--font-primary);
		font-size: clamp(2.75rem, 7vw, 3.5rem);
		font-weight: 700;
		background: linear-gradient(135deg,
			var(--color-primary-light),
			var(--color-secondary-light),
			var(--color-primary-light));
		background-size: 200% 200%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: priceShine 3s ease infinite, pricePulse 2s ease-in-out infinite;
		letter-spacing: -0.02em;
		filter: drop-shadow(0 2px 4px rgba(224, 122, 60, 0.3));
		transform-origin: center;
	}

	@keyframes priceShine {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	@keyframes pricePulse {
		0%, 100% {
			transform: scale(1);
			filter: drop-shadow(0 2px 4px rgba(224, 122, 60, 0.3));
		}
		50% {
			transform: scale(1.05);
			filter: drop-shadow(0 4px 12px rgba(224, 122, 60, 0.6));
		}
	}

	.btn-seleccionar {
		width: 100%;
		padding: clamp(0.875rem, 2vw, 1.125rem) clamp(1rem, 3vw, 1.5rem);
		background: linear-gradient(135deg,
			var(--color-primary),
			var(--color-primary-dark),
			var(--color-primary));
		background-size: 200% 100%;
		color: var(--color-text);
		font-weight: 600;
		font-size: clamp(0.95rem, 2vw, 1.1rem);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.btn-seleccionar::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
			transparent,
			rgba(255, 255, 255, 0.2),
			transparent);
		transition: left 0.5s ease;
	}

	.btn-seleccionar:hover {
		transform: translateY(-3px) scale(1.02);
		box-shadow: 0 12px 30px rgba(139, 92, 246, 0.5);
		background-position: 100% 0;
	}

	.btn-seleccionar:hover::before {
		left: 100%;
	}

	/* Contenedores de botones en frente y reverso */
	.plan-button-front,
	.plan-button-back {
		margin-top: auto;
		padding-top: var(--spacing-md);
	}

	.plan-button-back {
		width: 100%;
	}

	.btn-seleccionar:active {
		transform: translateY(-1px) scale(0.98);
	}

	/* Transición de fade a negro con luna */
	.transition-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #000;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeInOverlay 2.5s ease-in-out forwards;
	}

	.transition-overlay.fade-out {
		animation: fadeOutOverlay 1s ease-in-out forwards;
	}

	@keyframes fadeInOverlay {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	@keyframes fadeOutOverlay {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	.moon-symbol {
		color: #8a9fb5;
		animation: moonAppear 2.8s ease-in-out 1.2s forwards;
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

	@media (max-width: 768px) {
		.home {
			scroll-snap-type: y proximity;
		}

		.hero {
			min-height: 100vh;
			background-position: 65% center;
			background-attachment: scroll;
		}

		.hero-overlay {
			background: linear-gradient(
				to bottom,
				rgba(26, 40, 68, 0.9) 0%,
				rgba(26, 40, 68, 0.85) 50%,
				rgba(26, 40, 68, 0.95) 100%
			);
		}

		.hero-content {
			max-width: 100%;
		}

		.hero-title {
			font-size: 2rem;
		}

		.hero-description {
			font-size: 1rem;
		}

		.planes-section {
			margin-top: 100vh;
			min-height: auto;
		}

		.planes-grid {
			grid-template-columns: 1fr;
		}

		.moon-symbol {
			width: 100px;
			height: 100px;
		}

		.moon-symbol svg {
			width: 100px;
			height: 100px;
		}
	}
</style>
