<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import CardSelection from '$lib/components/CardSelection.svelte';
	import { crearSesion, iniciarPago, obtenerPlanes } from '$lib/services/api';
	import type { CartaTarot, Sesion, Plan } from '$lib/types';
	import { isTransitioning } from '$lib/stores/transition';
	import type { MercadoPago } from '$lib/types/mercadopago';

	const planId = $derived($page.params.plan_id);

	let plan = $state<Plan | null>(null);
	let cargandoPlan = $state(true);
	let errorPlan = $state<string | null>(null);

	type Paso = 'pregunta' | 'seleccion_cartas' | 'pago';

	let pasoActual = $state<Paso>('pregunta');
	let pregunta = $state('');
	let contexto = $state('');
	let cartasSeleccionadas = $state<CartaTarot[]>([]);
	let sesion = $state<Sesion | null>(null);
	let errorPago = $state<string | null>(null);
	let procesandoPago = $state(false);
	let mpInstance: MercadoPago | null = null;
	let mostrandoCheckout = $state(false);
	let errorPregunta = $state<string | null>(null);

	const precioFinal = $derived(plan?.precio_base || 0);

	onMount(async () => {
		// Esperar un momento para que la página se renderice completamente
		await new Promise(resolve => setTimeout(resolve, 100));

		// Resetear el estado de transición con fade out suave
		isTransitioning.set(false);

		// Inicializar Mercado Pago SDK
		const publicKey = env.PUBLIC_MERCADOPAGO_PUBLIC_KEY;
		if (publicKey && typeof window !== 'undefined' && window.MercadoPago) {
			mpInstance = new window.MercadoPago(publicKey, {
				locale: 'es-CL'
			});
		}

		try {
			cargandoPlan = true;
			errorPlan = null;
			const planes = await obtenerPlanes();
			const planEncontrado = planes.find(p => p.id === planId);

			if (!planEncontrado) {
				errorPlan = 'Plan no encontrado';
			} else {
				plan = planEncontrado;
			}
		} catch (err) {
			console.error('Error cargando plan:', err);
			errorPlan = 'Error al cargar el plan. Por favor, intenta nuevamente.';
		} finally {
			cargandoPlan = false;
		}
	});

	function formatearPrecio(precio: number): string {
		return new Intl.NumberFormat('es-CL', {
			style: 'currency',
			currency: 'CLP'
		}).format(precio);
	}

	function validarPregunta(texto: string): { valida: boolean; error: string | null } {
		const textoLimpio = texto.trim();

		// Validación 1: Longitud mínima (al menos 10 caracteres)
		if (textoLimpio.length < 10) {
			return {
				valida: false,
				error: 'Tu pregunta debe tener al menos 10 caracteres para poder interpretarla adecuadamente'
			};
		}

		// Validación 2: Longitud máxima
		if (textoLimpio.length > 200) {
			return {
				valida: false,
				error: 'Tu pregunta es demasiado larga. Por favor, sé más conciso (máximo 200 caracteres)'
			};
		}

		// Validación 3: Verificar que no sea solo números o caracteres especiales
		const soloNumerosOEspeciales = /^[0-9\s\.\,\!\?\-\_\+\=\@\#\$\%\^\&\*\(\)]+$/;
		if (soloNumerosOEspeciales.test(textoLimpio)) {
			return {
				valida: false,
				error: 'Por favor, escribe una pregunta con palabras que describan tu consulta'
			};
		}

		// Validación 4: Verificar que tenga al menos algunas letras (mínimo 5 palabras con letras)
		const palabras = textoLimpio.split(/\s+/).filter(palabra => /[a-záéíóúñü]/i.test(palabra));
		if (palabras.length < 3) {
			return {
				valida: false,
				error: 'Tu pregunta debe contener al menos 3 palabras para que podamos comprenderla'
			};
		}

		// Validación 5: Verificar que no sea spam o texto repetitivo
		const palabraRepetida = /(\b\w+\b)(\s+\1){3,}/i;
		if (palabraRepetida.test(textoLimpio)) {
			return {
				valida: false,
				error: 'Por favor, formula una pregunta coherente sin repetir las mismas palabras'
			};
		}

		return { valida: true, error: null };
	}

	function continuar() {
		const validacion = validarPregunta(pregunta);

		if (!validacion.valida) {
			errorPregunta = validacion.error;
			return;
		}

		errorPregunta = null;
		pasoActual = 'seleccion_cartas';
	}

	// Limpiar error cuando el usuario escribe y cumple requisitos básicos
	$effect(() => {
		if (errorPregunta && pregunta.trim().length >= 10) {
			const validacion = validarPregunta(pregunta);
			if (validacion.valida) {
				errorPregunta = null;
			}
		}
	});

	async function handleCartasSeleccionadas(cartas: CartaTarot[]) {
		cartasSeleccionadas = cartas;

		if (!plan) {
			console.error('Plan es null');
			errorPago = 'Error: Plan no encontrado';
			return;
		}

		try {
			procesandoPago = true;
			errorPago = null;
			mostrandoCheckout = true;

			const sesionData = {
				plan_id: plan.id,
				pregunta,
				cartas
			};

			sesion = await crearSesion(sesionData);

			// Guardar sesión en sessionStorage para recuperarla después del pago
			const sesionId = (sesion as any).sesion_id || sesion.id;
			sessionStorage.setItem(`sesion_${sesionId}`, JSON.stringify({
				id: sesionId,
				pregunta,
				cartas,
				plan: {
					nombre: plan.nombre,
					tipo_tirada: plan.tipo_tirada
				}
			}));

			// Iniciar el pago automáticamente después de crear la sesión
			const pagoResponse = await iniciarPago(sesionId, plan.nombre, plan.precio_final);

			if (pagoResponse.init_point) {
				// Redirigir a Mercado Pago en la misma ventana
				window.location.href = pagoResponse.init_point;
			} else {
				throw new Error('No se recibió el enlace de pago');
			}
		} catch (err) {
			console.error('Error creando sesión o iniciando pago:', err);
			errorPago = err instanceof Error ? err.message : 'Error al procesar el pago';
			mostrandoCheckout = false;
		} finally {
			procesandoPago = false;
		}
	}

	async function procederAlPago() {
		if (!sesion) return;

		try {
			procesandoPago = true;
			errorPago = null;
			mostrandoCheckout = true;

			const sesionId = (sesion as any).sesion_id || sesion.id;
			const pagoResponse = await iniciarPago(sesionId, plan?.nombre, plan?.precio_final);

			if (pagoResponse.init_point) {
				// Redirigir a Mercado Pago en la misma ventana
				window.location.href = pagoResponse.init_point;
			} else {
				throw new Error('No se recibió el enlace de pago');
			}
		} catch (err) {
			console.error('Error iniciando pago:', err);
			errorPago = err instanceof Error ? err.message : 'Error al iniciar el pago';
			procesandoPago = false;
			mostrandoCheckout = false;
		}
	}

	function volver() {
		if (pasoActual === 'seleccion_cartas') {
			pasoActual = 'pregunta';
		} else if (pasoActual === 'pago') {
			pasoActual = 'seleccion_cartas';
		} else {
			window.location.href = '/';
		}
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap" rel="stylesheet">
</svelte:head>

<!-- Celestial Background -->
<div class="celestial-bg">
	<div class="stars"></div>
	<div class="stars2"></div>
	<div class="stars3"></div>
	<div class="nebula"></div>
</div>

<div class="consulta-container">
	{#if cargandoPlan}
		<div class="loading-ritual">
			<div class="cosmic-spinner"></div>
			<p class="loading-text">Preparando el ritual...</p>
		</div>
	{:else if errorPlan}
		<div class="error-state fade-in">
			<div class="error-icon">✦</div>
			<h2>El camino se ha cerrado</h2>
			<p>{errorPlan}</p>
			<a href="/" class="btn-mystical">Volver al inicio</a>
		</div>
	{:else if plan}
		<!-- Mystical Progress Tracker -->
		<div class="ritual-progress" class:step-1={pasoActual === 'pregunta'} class:step-2={pasoActual === 'seleccion_cartas'} class:step-3={pasoActual === 'pago'}>
			<div class="progress-orb" class:active={pasoActual === 'pregunta'} class:complete={pasoActual !== 'pregunta'}>
				<span class="orb-number">I</span>
				<span class="orb-label">Intención</span>
			</div>
			<div class="progress-thread"></div>
			<div class="progress-orb" class:active={pasoActual === 'seleccion_cartas'} class:complete={pasoActual === 'pago'}>
				<span class="orb-number">II</span>
				<span class="orb-label">Revelación</span>
			</div>
			<div class="progress-thread"></div>
			<div class="progress-orb" class:active={pasoActual === 'pago'}>
				<span class="orb-number">III</span>
				<span class="orb-label">Respuesta</span>
			</div>
		</div>

		<!-- Step Content -->
		<div class="ritual-stage">
				{#if pasoActual === 'pregunta'}
					<div class="stage-content cascade-in">
						<div class="plan-seal">
							<div class="seal-ornament">✦</div>
							<span class="seal-text">{plan.nombre}</span>
							<div class="seal-ornament">✦</div>
						</div>

						<h1 class="ritual-title">
							<span class="title-line">Plantea tu</span>
							<span class="title-emphasis">Pregunta</span>
						</h1>

						<p class="ritual-whisper">Las cartas aguardan tu intención</p>

						<label class="cosmic-label" for="pregunta">
							<span class="label-star">✦</span>
							Tu consulta al universo
						</label>
						<textarea
							id="pregunta"
							bind:value={pregunta}
							placeholder="¿Qué verdad buscas revelar?"
							rows="3"
							class="cosmic-input"
							maxlength="200"
						></textarea>
						<div class="character-constellation">
							<span class="char-count">{pregunta.length}</span>
							<span class="char-separator">/</span>
							<span class="char-max">200</span>
						</div>

						{#if errorPregunta}
							<div class="validation-whisper">
								<span class="validation-icon">✦</span>
								{errorPregunta}
							</div>
						{/if}

						<button class="btn-mystical primary" onclick={continuar} disabled={!pregunta.trim()}>
							<span class="btn-text">Pasa a la selección de tu fortuna</span>
							<span class="btn-icon">→</span>
						</button>
					</div>

				{:else if pasoActual === 'seleccion_cartas'}
					<div class="stage-content cascade-in" class:full-width={plan.num_cartas === 10 || plan.num_cartas === 13}>
						<CardSelection numCartas={plan.num_cartas} onComplete={handleCartasSeleccionadas} />
					</div>

				{:else if pasoActual === 'pago'}
					<div class="stage-content cascade-in">
						<div class="mystical-card centered">
							<div class="card-glow"></div>

							<div class="completion-seal">
								<div class="seal-circle">
									<div class="seal-inner">✓</div>
								</div>
							</div>

							<h1 class="ritual-title">
								<span class="title-line">El ritual</span>
								<span class="title-emphasis">está listo</span>
							</h1>

							<p class="ritual-whisper">Revisa los detalles antes de proceder</p>

							<div class="revelation-summary">
								<div class="summary-item">
									<span class="summary-label">Plan elegido</span>
									<span class="summary-value">{plan.nombre}</span>
								</div>
								<div class="summary-item">
									<span class="summary-label">Cartas reveladas</span>
									<span class="summary-value">{plan.num_cartas} seleccionadas</span>
								</div>
								<div class="summary-item full-width">
									<span class="summary-label">Tu pregunta</span>
									<span class="summary-value question">{pregunta}</span>
								</div>
								{#if contexto}
									<div class="summary-item full-width">
										<span class="summary-label">Contexto</span>
										<span class="summary-value context">{contexto}</span>
									</div>
								{/if}

								<div class="summary-divider"></div>

								<div class="summary-item total">
									<span class="summary-label">Total</span>
									<span class="summary-value price">{formatearPrecio(precioFinal)}</span>
								</div>
							</div>

							{#if errorPago}
								<div class="error-whisper">{errorPago}</div>
							{/if}

							<button class="btn-mystical payment" onclick={procederAlPago} disabled={procesandoPago}>
								{#if procesandoPago}
									<div class="btn-spinner"></div>
									<span class="btn-text">Procesando...</span>
								{:else}
									<span class="btn-text">Proceder al Pago</span>
									<span class="btn-icon">→</span>
								{/if}
							</button>

							<p class="payment-whisper">Serás redirigido a Mercado Pago para completar tu lectura</p>
						</div>
					</div>
		{/if}
	</div>
{/if}
</div>

<style>
	/* Custom Properties */
	:root {
		--midnight: #0a0e27;
		--deep-purple: #1a1235;
		--mystic-purple: #2d1b4e;
		--ethereal-blue: #1e2a4a;
		--copper: #b87333;
		--gold: #d4af37;
		--stardust: #e8dcc4;
		--whisper: rgba(232, 220, 196, 0.85);

		--font-display: 'Philosopher', sans-serif;
		--font-body: 'Cormorant Garamond', serif;
		--font-accent: 'Spectral', serif;
	}

	* {
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;
	}

	/* Celestial Background */
	.celestial-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: url('/fondotarot-optimized.jpg');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		overflow: hidden;
		z-index: 0;
	}

	.nebula {
		position: absolute;
		width: 100%;
		height: 100%;
		background:
			radial-gradient(ellipse at 20% 30%, rgba(138, 43, 226, 0.15) 0%, transparent 50%),
			radial-gradient(ellipse at 80% 70%, rgba(75, 0, 130, 0.12) 0%, transparent 50%),
			radial-gradient(ellipse at 50% 50%, rgba(72, 61, 139, 0.08) 0%, transparent 60%);
		animation: nebula-drift 120s ease-in-out infinite;
	}

	@keyframes nebula-drift {
		0%, 100% { transform: translate(0, 0) scale(1); }
		33% { transform: translate(-2%, 3%) scale(1.05); }
		66% { transform: translate(3%, -2%) scale(0.98); }
	}

	/* Starfield */
	.stars, .stars2, .stars3 {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.stars {
		background-image:
			radial-gradient(2px 2px at 20px 30px, rgba(232, 220, 196, 0.8), transparent),
			radial-gradient(2px 2px at 60px 70px, rgba(212, 175, 55, 0.6), transparent),
			radial-gradient(1px 1px at 50px 50px, rgba(232, 220, 196, 0.5), transparent),
			radial-gradient(1px 1px at 130px 80px, rgba(184, 115, 51, 0.4), transparent),
			radial-gradient(2px 2px at 90px 10px, rgba(232, 220, 196, 0.7), transparent);
		background-repeat: repeat;
		background-size: 200px 200px;
		animation: twinkle 8s ease-in-out infinite;
	}

	.stars2 {
		background-image:
			radial-gradient(1px 1px at 40px 60px, rgba(232, 220, 196, 0.4), transparent),
			radial-gradient(1px 1px at 110px 90px, rgba(212, 175, 55, 0.5), transparent),
			radial-gradient(1px 1px at 180px 40px, rgba(232, 220, 196, 0.3), transparent);
		background-repeat: repeat;
		background-size: 250px 250px;
		animation: twinkle 12s ease-in-out infinite reverse;
	}

	.stars3 {
		background-image:
			radial-gradient(1px 1px at 75px 125px, rgba(184, 115, 51, 0.3), transparent),
			radial-gradient(1px 1px at 145px 45px, rgba(232, 220, 196, 0.4), transparent);
		background-repeat: repeat;
		background-size: 300px 300px;
		animation: twinkle 16s ease-in-out infinite;
	}


	/* Main Container */
	.consulta-container {
		position: relative;
		z-index: 1;
		min-height: 100vh;
		height: 100vh;
		overflow-y: auto;
		padding: clamp(1.5rem, 3vh, 2.5rem) clamp(1rem, 3vw, 2rem);
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* Ritual Progress - Horizontal Layout */
	.ritual-progress {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 0;
		margin-bottom: clamp(2rem, 4vh, 3rem);
		position: relative;
		flex-shrink: 0;
	}

	.progress-orb {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		position: relative;
		opacity: 0.35;
		transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.progress-orb.active,
	.progress-orb.complete {
		opacity: 1;
	}

	.progress-orb::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 70px;
		height: 70px;
		background: radial-gradient(circle, var(--copper) 0%, transparent 70%);
		opacity: 0;
		transition: opacity 0.6s ease;
		filter: blur(20px);
	}

	.progress-orb.active::before {
		opacity: 0.6;
		animation: pulse-glow 2s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%, 100% { opacity: 0.4; transform: translateX(-50%) scale(1); }
		50% { opacity: 0.8; transform: translateX(-50%) scale(1.2); }
	}

	.orb-number {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		border: 2px solid var(--copper);
		background: linear-gradient(135deg, rgba(184, 115, 51, 0.1), rgba(42, 27, 78, 0.3));
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--stardust);
		position: relative;
		z-index: 1;
		transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.progress-orb.active .orb-number {
		border-color: var(--gold);
		background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(184, 115, 51, 0.15));
		box-shadow: 0 0 30px rgba(212, 175, 55, 0.4);
		transform: scale(1.1);
	}

	.progress-orb.complete .orb-number {
		background: linear-gradient(135deg, var(--copper), rgba(184, 115, 51, 0.6));
		border-color: var(--gold);
	}

	.orb-label {
		font-family: var(--font-accent);
		font-size: 0.875rem;
		font-weight: 400;
		font-style: italic;
		color: var(--whisper);
		letter-spacing: 0.08em;
		text-transform: lowercase;
	}

	.progress-thread {
		width: clamp(60px, 8vw, 100px);
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--copper), transparent);
		opacity: 0.3;
		position: relative;
	}

	.progress-thread::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		width: 0%;
		height: 100%;
		background: var(--gold);
		transform: translateY(-50%);
		transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 0 10px var(--gold);
	}

	.ritual-progress.step-2 .progress-thread:first-of-type::after,
	.ritual-progress.step-3 .progress-thread::after {
		width: 100%;
	}

	/* Stage Content */
	.ritual-stage {
		width: 100%;
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: flex-start;
	}

	.stage-content {
		width: 100%;
		max-width: 600px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stage-content.full-width {
		max-width: 100%;
		height: 100%;
	}

	/* Navigation */
	.nav-return {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: rgba(184, 115, 51, 0.1);
		border: 1px solid rgba(184, 115, 51, 0.3);
		border-radius: 2rem;
		color: var(--stardust);
		font-family: var(--font-body);
		font-size: 1rem;
		font-style: italic;
		cursor: pointer;
		transition: all 0.3s ease;
		margin-bottom: 2rem;
	}

	.nav-return:hover {
		background: rgba(184, 115, 51, 0.2);
		border-color: var(--copper);
		transform: translateX(-4px);
	}

	.return-icon {
		font-size: 1.2rem;
		transition: transform 0.3s ease;
	}

	.nav-return:hover .return-icon {
		transform: translateX(-3px);
	}

	/* Mystical Card */
	.mystical-card {
		background: linear-gradient(135deg,
			rgba(26, 18, 53, 0.6) 0%,
			rgba(30, 42, 74, 0.5) 100%);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(184, 115, 51, 0.3);
		border-radius: 2rem;
		padding: clamp(1.5rem, 4vw, 2.5rem);
		position: relative;
		overflow: hidden;
		max-height: calc(100vh - 200px);
		overflow-y: auto;
	}

	.mystical-card.centered {
		max-width: 600px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.card-glow {
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(184, 115, 51, 0.15) 0%, transparent 60%);
		animation: card-glow-rotate 20s linear infinite;
		pointer-events: none;
	}

	@keyframes card-glow-rotate {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Plan Seal */
	.plan-seal {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2rem;
		position: relative;
		z-index: 1;
	}

	.seal-ornament {
		color: var(--copper);
		font-size: 1rem;
		animation: rotate-ornament 8s linear infinite;
	}

	@keyframes rotate-ornament {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.seal-text {
		font-family: var(--font-display);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--gold);
		padding: 0.625rem 1.75rem;
		border: 1px solid rgba(212, 175, 55, 0.4);
		border-radius: 2rem;
		background: rgba(212, 175, 55, 0.05);
		text-shadow:
			0 0 15px rgba(212, 175, 55, 0.8),
			0 0 8px rgba(0, 0, 0, 0.9),
			0 1px 3px rgba(0, 0, 0, 0.8);
	}

	/* Titles */
	.ritual-title {
		text-align: center;
		margin-bottom: 1rem;
		position: relative;
		z-index: 1;
	}

	.title-line {
		display: block;
		font-family: var(--font-accent);
		font-size: clamp(1.375rem, 3.5vw, 1.875rem);
		font-weight: 300;
		font-style: italic;
		color: var(--whisper);
		margin-bottom: 0.5rem;
		letter-spacing: 0.02em;
		line-height: 1.3;
		text-shadow:
			0 0 15px rgba(0, 0, 0, 0.8),
			0 2px 8px rgba(0, 0, 0, 0.6),
			0 0 30px rgba(232, 220, 196, 0.3);
	}

	.title-emphasis {
		display: block;
		font-family: var(--font-display);
		font-size: clamp(2.75rem, 7vw, 4.5rem);
		font-weight: 700;
		background: linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: 0.03em;
		line-height: 1.1;
		filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.6))
		        drop-shadow(0 0 40px rgba(184, 115, 51, 0.4))
		        drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
	}

	.ritual-whisper {
		text-align: center;
		font-family: var(--font-body);
		font-size: 1.25rem;
		font-weight: 400;
		font-style: italic;
		color: var(--whisper);
		margin-bottom: 2.5rem;
		position: relative;
		z-index: 1;
		letter-spacing: 0.01em;
		line-height: 1.6;
		text-shadow:
			0 0 10px rgba(0, 0, 0, 0.9),
			0 2px 6px rgba(0, 0, 0, 0.7),
			0 0 20px rgba(232, 220, 196, 0.2);
	}

	/* Inputs */
	.cosmic-label {
		margin-top: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin-bottom: 0.875rem;
		font-family: var(--font-display);
		font-size: 0.9375rem;
		font-weight: 400;
		letter-spacing: 0.08em;
		color: var(--stardust);
		text-transform: lowercase;
		text-shadow:
			0 0 8px rgba(0, 0, 0, 0.9),
			0 1px 4px rgba(0, 0, 0, 0.8);
	}

	.label-star {
		color: var(--copper);
		font-size: 0.9rem;
		animation: twinkle-star 3s ease-in-out infinite;
	}

	@keyframes twinkle-star {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.8); }
	}

	.optional-mark {
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-style: italic;
		opacity: 0.6;
		margin-left: auto;
	}

	.cosmic-input {
		width: 100%;
		padding: 1.375rem 1.625rem;
		background: rgb(10, 14, 39);
		border: 1px solid rgba(184, 115, 51, 0.6);
		border-radius: 1rem;
		color: var(--stardust);
		font-family: var(--font-body);
		font-size: 1.25rem;
		font-weight: 400;
		line-height: 1.75;
		letter-spacing: 0.01em;
		resize: none;
		transition: all 0.3s ease;
		text-shadow: 0 0 0 transparent;
		caret-color: var(--gold);
	}

	.cosmic-input::placeholder {
		color: rgba(232, 220, 196, 0.3);
		font-style: italic;
	}

	.cosmic-input:focus {
		outline: none;
		border-color: var(--copper);
		background: rgb(10, 14, 39);
		box-shadow: 0 0 30px rgba(184, 115, 51, 0.3);
		text-shadow:
			0 0 10px rgba(232, 220, 196, 0.3),
			0 0 20px rgba(212, 175, 55, 0.2),
			0 0 30px rgba(184, 115, 51, 0.1);
		animation: text-glow 2s ease-in-out infinite;
	}

	@keyframes text-glow {
		0%, 100% {
			text-shadow:
				0 0 8px rgba(232, 220, 196, 0.3),
				0 0 16px rgba(212, 175, 55, 0.15),
				0 0 24px rgba(184, 115, 51, 0.08);
		}
		50% {
			text-shadow:
				0 0 12px rgba(232, 220, 196, 0.4),
				0 0 24px rgba(212, 175, 55, 0.25),
				0 0 36px rgba(184, 115, 51, 0.15);
		}
	}

	.character-constellation {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.375rem;
		margin-top: 0.625rem;
		margin-bottom: 1.75rem;
		font-family: var(--font-accent);
		font-size: 0.8125rem;
		font-weight: 400;
		font-style: italic;
		color: var(--whisper);
		opacity: 0.65;
		letter-spacing: 0.02em;
	}

	.char-separator {
		opacity: 0.4;
	}

	/* Validation Whisper */
	.validation-whisper {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1.125rem 1.375rem;
		margin-top: 1.125rem;
		margin-bottom: 1.125rem;
		background: rgba(184, 115, 51, 0.15);
		border: 1px solid rgba(184, 115, 51, 0.4);
		border-radius: 1rem;
		font-family: var(--font-body);
		font-size: 1rem;
		font-weight: 400;
		font-style: italic;
		color: var(--gold);
		line-height: 1.6;
		letter-spacing: 0.01em;
		animation: validation-appear 0.3s ease-out;
	}

	@keyframes validation-appear {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.validation-icon {
		color: var(--copper);
		font-size: 1rem;
		flex-shrink: 0;
		animation: twinkle-star 2s ease-in-out infinite;
	}

	/* Investment Display */
	.investment-display {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		padding: 1.5rem;
		margin: 1.5rem 0;
		background: rgba(184, 115, 51, 0.08);
		border: 1px solid rgba(184, 115, 51, 0.25);
		border-radius: 1.5rem;
		position: relative;
		z-index: 1;
	}

	.investment-label {
		font-family: var(--font-body);
		font-size: 1.1rem;
		font-style: italic;
		color: var(--whisper);
	}

	.investment-amount {
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 600;
		background: linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Buttons */
	.btn-mystical {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		width: 100%;
		padding: 1.375rem 2rem;
		background: #b87333;
		border: 1px solid var(--gold);
		border-radius: 1rem;
		color: var(--midnight);
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		cursor: pointer;
		position: relative;
		z-index: 1;
		transition: all 0.3s ease;
	}

	.btn-mystical:hover {
		background: #a86625;
		transform: translateY(-3px);
		box-shadow: 0 10px 40px rgba(184, 115, 51, 0.5);
	}

	.btn-mystical:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
	}

	.btn-mystical.payment {
		background: linear-gradient(135deg, #009ee3 0%, #0077cc 100%);
		border-color: #00b4ff;
		color: white;
	}

	.btn-text, .btn-icon {
		position: relative;
		z-index: 1;
	}

	.btn-icon {
		font-size: 1.5rem;
		transition: transform 0.3s ease;
	}

	.btn-mystical:hover .btn-icon {
		transform: translateX(5px);
	}

	.btn-spinner {
		width: 20px;
		height: 20px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}


	/* Revelation Header */
	.revelation-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.revelation-title {
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 600;
		background: linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 1rem;
	}

	.revelation-whisper {
		font-family: var(--font-body);
		font-size: 1.15rem;
		font-style: italic;
		color: var(--whisper);
	}

	/* Completion Seal */
	.completion-seal {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
		position: relative;
		z-index: 1;
	}

	.seal-circle {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(184, 115, 51, 0.2), rgba(212, 175, 55, 0.1));
		border: 2px solid var(--copper);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		animation: seal-pulse 2s ease-in-out infinite;
	}

	@keyframes seal-pulse {
		0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(184, 115, 51, 0.7); }
		50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(184, 115, 51, 0); }
	}

	.seal-inner {
		font-size: 3rem;
		color: var(--gold);
	}

	/* Summary */
	.revelation-summary {
		background: rgba(10, 14, 39, 0.4);
		border: 1px solid rgba(184, 115, 51, 0.2);
		border-radius: 1.5rem;
		padding: 2rem;
		margin: 2rem 0;
		position: relative;
		z-index: 1;
	}

	.summary-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1.5rem;
		padding: 1rem 0;
	}

	.summary-item.full-width {
		flex-direction: column;
		gap: 0.5rem;
	}

	.summary-label {
		font-family: var(--font-display);
		font-size: 0.875rem;
		font-weight: 400;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--copper);
		flex-shrink: 0;
	}

	.summary-value {
		font-family: var(--font-body);
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--stardust);
		text-align: right;
		letter-spacing: 0.01em;
	}

	.summary-value.question,
	.summary-value.context {
		text-align: left;
		font-style: italic;
		opacity: 0.9;
		line-height: 1.6;
	}

	.summary-divider {
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--copper), transparent);
		margin: 1.5rem 0;
		opacity: 0.3;
	}

	.summary-item.total {
		padding-top: 1.5rem;
		font-size: 1.3rem;
	}

	.summary-item.total .summary-label {
		font-size: 1.3rem;
	}

	.summary-value.price {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 600;
		background: linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Payment Whisper */
	.payment-whisper {
		text-align: center;
		font-family: var(--font-body);
		font-size: 0.95rem;
		font-style: italic;
		color: var(--whisper);
		opacity: 0.6;
		margin-top: 1.5rem;
		position: relative;
		z-index: 1;
	}

	/* Error States */
	.error-whisper {
		background: rgba(184, 115, 51, 0.15);
		border: 1px solid var(--copper);
		border-radius: 1rem;
		padding: 1.25rem;
		margin: 1.5rem 0;
		text-align: center;
		font-family: var(--font-body);
		font-style: italic;
		color: var(--gold);
		position: relative;
		z-index: 1;
	}

	.error-state {
		text-align: center;
		padding: 4rem 2rem;
	}

	.error-icon {
		font-size: 4rem;
		color: var(--copper);
		margin-bottom: 2rem;
		animation: twinkle-star 2s ease-in-out infinite;
	}

	.error-state h2 {
		font-family: var(--font-display);
		font-size: 2rem;
		color: var(--gold);
		margin-bottom: 1rem;
	}

	.error-state p {
		font-family: var(--font-body);
		font-size: 1.1rem;
		font-style: italic;
		color: var(--whisper);
		margin-bottom: 2rem;
	}

	/* Loading */
	.loading-ritual {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		gap: 2rem;
	}

	.cosmic-spinner {
		width: 80px;
		height: 80px;
		border: 3px solid rgba(184, 115, 51, 0.2);
		border-top-color: var(--copper);
		border-right-color: var(--gold);
		border-radius: 50%;
		animation: cosmic-spin 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
		position: relative;
	}

	.cosmic-spinner::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 60%;
		height: 60%;
		border: 3px solid rgba(212, 175, 55, 0.3);
		border-bottom-color: var(--gold);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		animation: cosmic-spin-reverse 1s linear infinite;
	}

	@keyframes cosmic-spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@keyframes cosmic-spin-reverse {
		0% { transform: translate(-50%, -50%) rotate(0deg); }
		100% { transform: translate(-50%, -50%) rotate(-360deg); }
	}

	.loading-text {
		font-family: var(--font-body);
		font-size: 1.2rem;
		font-style: italic;
		color: var(--whisper);
	}

	/* Animations */
	.cascade-in {
		animation: cascade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	@keyframes cascade-in {
		0% {
			opacity: 0;
			transform: translateY(40px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.fade-in {
		animation: fade-in 0.6s ease-out;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Responsive */
	@media (max-width: 768px) {
		.ritual-progress {
			gap: 0;
		}

		.orb-number {
			width: 50px;
			height: 50px;
			font-size: 1rem;
		}

		.orb-label {
			font-size: 0.75rem;
		}

		.progress-thread {
			width: 40px;
			height: 2px;
		}

		.mystical-card {
			padding: 2rem 1.5rem;
		}

		.investment-display {
			flex-direction: column;
			gap: 0.5rem;
			padding: 1.5rem;
		}

		.investment-amount {
			font-size: 2rem;
		}

		.btn-mystical {
			font-size: 1rem;
			padding: 1.25rem 1.5rem;
		}

		.summary-item {
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-start;
		}

		.summary-value {
			text-align: left;
		}
	}
</style>
