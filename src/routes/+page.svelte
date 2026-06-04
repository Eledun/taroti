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
											<span class="precio-valor">
												<span class="precio-numero">${new Intl.NumberFormat('es-CL', { style: 'decimal', useGrouping: true }).format(plan.precio_base)}</span>
												<span class="precio-moneda">CLP</span>
											</span>
										</div>
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
		display: none;
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
		display: none;
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
		font-size: clamp(2.5rem, 6vw, 3.5rem);
		font-weight: 700;
		letter-spacing: 0.02em;
		color: white;
		filter: drop-shadow(0 2px 10px rgba(212, 175, 55, 0.3))
		        drop-shadow(0 4px 20px rgba(139, 92, 246, 0.2));
		text-transform: uppercase;
		position: relative;
		padding-bottom: 1rem;
	}

	.section-title::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: clamp(100px, 30%, 200px);
		height: 2px;
		background: linear-gradient(90deg,
			transparent 0%,
			var(--color-primary) 30%,
			var(--color-secondary) 50%,
			var(--color-primary) 70%,
			transparent 100%);
		box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
	}

	@keyframes gradientFlow {
		0%, 100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	.section-description {
		text-align: center;
		color: var(--color-text);
		margin-bottom: clamp(2rem, 6vh, 4rem);
		font-size: clamp(1.1rem, 2.5vw, 1.35rem);
		font-family: var(--font-mystical);
		font-weight: 400;
		font-style: italic;
		max-width: 650px;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.8;
		opacity: 0.95;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		letter-spacing: 0.02em;
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
		grid-template-columns: repeat(3, minmax(280px, 340px));
		gap: clamp(1.5rem, 3vw, 2rem);
		margin-bottom: var(--spacing-xl);
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
		padding: 0 var(--spacing-md);
		justify-content: center;
	}

	/* Contenedor de la tarjeta con perspectiva 3D */
	.plan-card-container {
		perspective: 1000px;
		position: relative;
		height: 450px;
	}

	/* Inner card que contiene front y back */
	.plan-card-inner {
		position: relative;
		width: 100%;
		height: 100%;
		transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
		transform-style: preserve-3d;
		border-radius: 1.5rem;
		will-change: transform;
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
		overflow: hidden;
		transition: box-shadow 0.3s ease, border-color 0.3s ease;
	}

	.plan-card-front {
		padding: clamp(2rem, 5vw, 2.5rem);
	}

	.plan-card-back {
		padding: clamp(1.5rem, 4vw, 2rem);
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
			radial-gradient(circle at 0% 0%, rgba(212, 175, 55, 0.12) 0%, transparent 50%),
			radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 100% 100%, rgba(236, 72, 153, 0.12) 0%, transparent 50%),
			radial-gradient(circle at 0% 100%, rgba(212, 175, 55, 0.08) 0%, transparent 50%);
		pointer-events: none;
		z-index: 1;
		opacity: 0.7;
		transition: opacity 0.4s ease;
	}

	.plan-card-container:hover .plan-card-front::after,
	.plan-card-container:hover .plan-card-back::after {
		opacity: 1;
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
		padding: var(--spacing-md) var(--spacing-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		overflow-y: auto;
	}

	.plan-description p {
		font-family: var(--font-mystical);
		font-size: clamp(1.1rem, 2.5vw, 1.3rem);
		line-height: 1.7;
		color: var(--color-cream);
		font-style: italic;
		font-weight: 400;
		letter-spacing: 0.02em;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	/* Tarjeta 1 - Luna (Plateado/Rosa Místico) */
	.plan-card-1 .plan-card-front,
	.plan-card-1 .plan-card-back {
		background: rgba(30, 41, 59, 0.85);
		border: 2px solid rgba(236, 72, 153, 0.5);
		box-shadow: 0 8px 32px 0 rgba(236, 72, 153, 0.4);
	}

	.plan-card-1 .plan-icon {
		color: #ec4899;
		filter: drop-shadow(0 0 15px rgba(236, 72, 153, 0.5));
	}

	/* Tarjeta 2 - Sol (Dorado Místico) */
	.plan-card-2 {
		transform: scale(1.05);
	}

	.plan-card-2 .plan-card-front,
	.plan-card-2 .plan-card-back {
		background: rgba(30, 41, 59, 0.85);
		border: 2px solid rgba(212, 175, 55, 0.6);
		box-shadow: 0 8px 32px 0 rgba(212, 175, 55, 0.5);
	}

	.plan-card-2 .plan-icon {
		color: #d4af37;
		filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.6));
	}

	/* Tarjeta 3 - Estrella (Púrpura Mágico) */
	.plan-card-3 .plan-card-front,
	.plan-card-3 .plan-card-back {
		background: rgba(30, 41, 59, 0.85);
		border: 2px solid rgba(139, 92, 246, 0.5);
		box-shadow: 0 8px 32px 0 rgba(139, 92, 246, 0.4);
	}

	.plan-card-3 .plan-icon {
		color: #8b5cf6;
		filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.6));
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
	}

	/* Iconos */
	.plan-icon {
		text-align: center;
		margin-bottom: var(--spacing-md);
	}

	.plan-card-container:hover .plan-card-1 .plan-card-front,
	.plan-card-container:hover .plan-card-1 .plan-card-back {
		box-shadow: 0 16px 48px rgba(236, 72, 153, 0.6);
		border-color: rgba(236, 72, 153, 0.8);
	}

	.plan-card-container:hover .plan-card-2 .plan-card-front,
	.plan-card-container:hover .plan-card-2 .plan-card-back {
		box-shadow: 0 16px 48px rgba(212, 175, 55, 0.7);
		border-color: rgba(212, 175, 55, 0.9);
	}

	.plan-card-container:hover .plan-card-3 .plan-card-front,
	.plan-card-container:hover .plan-card-3 .plan-card-back {
		box-shadow: 0 16px 48px rgba(139, 92, 246, 0.6);
		border-color: rgba(139, 92, 246, 0.8);
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
			rgba(236, 72, 153, 0.7),
			transparent);
		box-shadow: 0 0 12px rgba(236, 72, 153, 0.4);
	}

	.plan-card-2 .plan-header::after {
		background: linear-gradient(90deg,
			transparent,
			rgba(212, 175, 55, 0.8),
			transparent);
		box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
	}

	.plan-card-3 .plan-header::after {
		background: linear-gradient(90deg,
			transparent,
			rgba(139, 92, 246, 0.7),
			transparent);
		box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
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
		display: inline-block;
		padding: clamp(0.5rem, 1.5vw, 0.625rem) clamp(1rem, 2.5vw, 1.25rem);
		background: linear-gradient(135deg,
			rgba(212, 175, 55, 0.15) 0%,
			rgba(139, 92, 246, 0.15) 100%);
		border: 1px solid rgba(212, 175, 55, 0.3);
		border-radius: var(--radius-lg);
		color: var(--color-primary-light);
		font-size: clamp(0.875rem, 1.5vw, 1rem);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 600;
		font-family: var(--font-primary);
		box-shadow:
			0 4px 12px rgba(212, 175, 55, 0.15),
			inset 0 1px 0 rgba(212, 175, 55, 0.2);
		transition: all 0.3s ease;
	}

	.plan-body {
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 3vw, 1.5rem);
		flex: 1;
	}

	.plan-precio {
		text-align: center;
		padding: clamp(1.5rem, 3vw, 2rem);
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin: 0 auto;
		width: 100%;
		flex: 1;
	}

	.precio-valor {
		display: inline-block;
		font-family: var(--font-primary);
		letter-spacing: -0.03em;
		position: relative;
		transform: scale(1);
		transition: transform 0.3s ease;
		white-space: nowrap;
	}

	.precio-numero {
		font-size: clamp(3rem, 8vw, 4rem);
		font-weight: 800;
		background: linear-gradient(135deg,
			#ffd700 0%,
			var(--color-primary-light) 50%,
			var(--color-primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.6));
	}

	.precio-moneda {
		font-size: clamp(1.5rem, 3vw, 2rem);
		font-weight: 600;
		margin-left: clamp(0.25rem, 0.5vw, 0.5rem);
		background: linear-gradient(135deg,
			#ffd700 0%,
			var(--color-primary-light) 50%,
			var(--color-primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		opacity: 0.9;
	}

	.btn-seleccionar {
		width: 100%;
		padding: clamp(0.875rem, 2vw, 1.125rem) clamp(1rem, 3vw, 1.5rem);
		background: linear-gradient(135deg,
			var(--color-secondary),
			var(--color-secondary-dark),
			var(--color-secondary));
		background-size: 200% 100%;
		color: var(--color-text);
		font-weight: 600;
		font-size: clamp(0.95rem, 2vw, 1.1rem);
		border-radius: var(--radius-lg);
		box-shadow:
			0 8px 24px rgba(139, 92, 246, 0.4),
			0 0 40px rgba(139, 92, 246, 0.2);
		position: relative;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		border: 1px solid rgba(167, 139, 250, 0.3);
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
			rgba(255, 255, 255, 0.25),
			transparent);
		transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.btn-seleccionar:hover {
		transform: translateY(-4px) scale(1.03);
		box-shadow:
			0 16px 40px rgba(139, 92, 246, 0.6),
			0 0 60px rgba(139, 92, 246, 0.3);
		background-position: 100% 0;
		border-color: rgba(167, 139, 250, 0.5);
	}

	.btn-seleccionar:hover::before {
		left: 100%;
	}

	/* Contenedor de botón en reverso */
	.plan-button-back {
		margin-top: auto;
		padding-top: var(--spacing-md);
		flex-shrink: 0;
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
			display: none;
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
			background-attachment: scroll;
			background-size: cover;
			background-position: center center;
		}

		.planes-container {
			position: relative;
			min-height: auto;
			max-height: none;
		}

		.planes-container.sticky {
			position: relative;
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

		.plan-card-container {
			height: 480px;
		}
	}

	/* Tablets - 2 columnas */
	@media (min-width: 769px) and (max-width: 1024px) {
		.planes-grid {
			grid-template-columns: repeat(2, minmax(280px, 350px));
			max-width: 800px;
		}

		.plan-card-container {
			height: 420px;
		}

		.plan-card-2 {
			transform: scale(1);
		}
	}

	/* Pantallas pequeñas de escritorio */
	@media (min-width: 1025px) and (max-width: 1280px) {
		.planes-grid {
			grid-template-columns: repeat(3, minmax(260px, 320px));
			max-width: 1100px;
		}

		.plan-card-container {
			height: 420px;
		}
	}
</style>
