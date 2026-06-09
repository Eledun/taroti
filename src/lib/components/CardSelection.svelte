<script lang="ts">
	import TarotCard from './TarotCard.svelte';
	import type { CartaTarot } from '$lib/types';
	import gsap from 'gsap';
	import { tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	interface Props {
		numCartas: number;
		onComplete: (cartas: CartaTarot[]) => void;
	}

	let { numCartas, onComplete }: Props = $props();

	// Total de 22 Arcanos Mayores en el mazo
	const TOTAL_CARTAS = 22;

	// Significados de las posiciones de la Cruz Celta
	const POSICIONES_CRUZ_CELTA = [
		'El Presente',
		'El Desafío',
		'Pasado',
		'Futuro',
		'Arriba (Coronando)',
		'Abajo (Fundación)',
		'Consejo',
		'Influencias\nExternas',
		'Esperanzas y\nTemores',
		'Resultado Final'
	];

	// Significados de las posiciones de la Tirada del Año (13 cartas: 12 meses + centro)
	const POSICIONES_TIRADA_ANO = [
		'Enero',
		'Febrero',
		'Marzo',
		'Abril',
		'Mayo',
		'Junio',
		'Julio',
		'Agosto',
		'Septiembre',
		'Octubre',
		'Noviembre',
		'Diciembre',
		'El Año'
	];

	const posiciones = numCartas === 13 ? POSICIONES_TIRADA_ANO : POSICIONES_CRUZ_CELTA;

	let cartasSeleccionadas = $state<CartaTarot[]>([]);
	let cartasDisponibles = $state<number[]>([]);
	let animatingCards = new SvelteSet<number>();

	// Función para barajar array (Fisher-Yates shuffle)
	function barajarArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	// Inicializar cartas disponibles (solo los 22 Arcanos Mayores) - BARAJADAS
	$effect(() => {
		const cartasEnOrden = Array.from({ length: TOTAL_CARTAS }, (_, i) => i);
		cartasDisponibles = barajarArray(cartasEnOrden);
	});

	const puedeSeleccionar = $derived(cartasSeleccionadas.length < numCartas);
	const selectionCompleta = $derived(cartasSeleccionadas.length === numCartas);

	async function seleccionarCarta(index: number, event?: MouseEvent) {
		if (!puedeSeleccionar) return;

		// Verificar que la carta aún esté disponible
		if (!cartasDisponibles.includes(index)) return;

		const posicionDestino = cartasSeleccionadas.length;

		// Las cartas nunca están invertidas
		const invertida = false;

		// Marcar como animando PRIMERO (esto la oculta con CSS)
		animatingCards.add(index);

		// Wait for Svelte to update the DOM with the animating class
		await tick();

		// Obtener elementos para FLIP - use correct selector based on spread type
		const cardSelector = (numCartas === 10 || numCartas === 13) ? '.deck-card' : '.fan-card-wrapper';
		const cardElement = (event?.target as HTMLElement)?.closest(cardSelector) as HTMLElement;

		// Selector correcto según el tipo de tirada
		let slotSelector;
		if (numCartas === 10) {
			slotSelector = `.celtic-position[data-position="${posicionDestino}"]`;
		} else if (numCartas === 13) {
			slotSelector = `.wheel-position[data-position="${posicionDestino}"]`;
		} else {
			slotSelector = `.spread-position[data-position="${posicionDestino}"]`;
		}

		const targetSlot = document.querySelector(slotSelector) as HTMLElement;

		if (cardElement && targetSlot) {
			// FLIP: First - posición inicial
			const first = cardElement.getBoundingClientRect();

			// Agregar la carta seleccionada (esto causa el DOM update)
			cartasSeleccionadas.push({
				arcano: `${index}`,  // ID del arcano (0-21)
				invertida,
				posicion: posicionDestino
			});

			// Esperar el siguiente frame para que el DOM se actualice
			await new Promise(resolve => requestAnimationFrame(resolve));

			// FLIP: Last - posición final
			const last = targetSlot.getBoundingClientRect();

			// FLIP: Invert - calcular diferencia
			const deltaX = first.left - last.left;
			const deltaY = first.top - last.top;
			const deltaScale = first.width / last.width;

			// Obtener la carta recién agregada en el slot
			const newCardElement = targetSlot.querySelector('.tarot-card') as HTMLElement;

			if (newCardElement) {
				// Determinar si es una tirada especial (Cruz Celta o Rueda del Año)
				const isTiradaEspecial = numCartas === 10 || numCartas === 13;

				if (isTiradaEspecial) {
					// GSAP animation for Cruz Celta and Tirada del Año
					// Calculate viewport center
					const viewportCenterX = window.innerWidth / 2;
					const viewportCenterY = window.innerHeight / 2;
					const currentCardCenterX = last.left + last.width / 2;
					const currentCardCenterY = last.top + last.height / 2;
					const deltaToScreenCenterX = viewportCenterX - currentCardCenterX;
					const deltaToScreenCenterY = viewportCenterY - currentCardCenterY;

					// Set initial position
					gsap.set(newCardElement, {
						x: deltaX,
						y: deltaY,
						scale: deltaScale,
						rotationY: 0,
						zIndex: 9999,
						force3D: true
					});

					const tl = gsap.timeline();

					// Phase 1: Lift off and start flip (0.3s)
					tl.to(newCardElement, {
						x: deltaX * 0.7 + deltaToScreenCenterX * 0.3,
						y: deltaY * 0.7 + deltaToScreenCenterY * 0.3,
						scale: deltaScale * 1.3,
						rotationY: 90,
						filter: 'brightness(1.3) drop-shadow(0 0 25px rgba(224, 122, 60, 0.5))',
						duration: 0.3,
						ease: 'power2.out',
						force3D: true
					});

					// Phase 2: Continue to center with full flip (0.4s)
					tl.to(newCardElement, {
						x: deltaToScreenCenterX,
						y: deltaToScreenCenterY,
						scale: 3,
						rotationY: 360,
						filter: 'brightness(1.5) drop-shadow(0 0 60px rgba(224, 122, 60, 1))',
						duration: 0.4,
						ease: 'power2.inOut',
						force3D: true
					});

					// Phase 3: Hold at center zoom (0.8s)
					tl.to(newCardElement, {
						duration: 0.8,
						ease: 'none'
					});

					// Phase 4: Return to position (0.6s)
					tl.to(newCardElement, {
						x: 0,
						y: 0,
						scale: 1,
						rotationY: 360,
						filter: 'brightness(1) drop-shadow(0 0 0px rgba(224, 122, 60, 0))',
						zIndex: 'auto',
						duration: 0.6,
						ease: 'power2.inOut',
						force3D: true
					});

					await tl.then();
				} else {
					// GSAP animation for 3-card spread

					// The card is inside a positioning wrapper, so we need to animate the wrapper
					// to avoid conflicting with existing transform positioning
					const wrapper = newCardElement.parentElement;

					if (!wrapper) {
						console.error('No wrapper found for animation');
						// Keep card hidden even if animation fails
						return;
					}

					// Create a timeline for complex sequenced animation
					const tl = gsap.timeline();

					// Animate the wrapper (preserves fan positioning)
					tl.fromTo(wrapper,
						{
							scale: 0.8,
							y: 0,
							rotationY: 0,
							force3D: true
						},
						{
							scale: 1.3,
							y: -120,
							rotationY: 180,
							duration: 0.6,
							ease: 'back.out(1.7)',
							force3D: true
						}
					);

					// Animate the card's filter separately
					tl.fromTo(newCardElement,
						{
							filter: 'brightness(1)'
						},
						{
							filter: 'brightness(1.5) drop-shadow(0 0 35px rgba(224, 122, 60, 0.9))',
							duration: 0.6,
							ease: 'back.out(1.7)'
						},
						0 // Start at the same time
					);

					// Second phase: settle down
					tl.to(wrapper, {
						scale: 1,
						y: 0,
						rotationY: 360,
						duration: 0.6,
						ease: 'power2.inOut',
						force3D: true
					});

					tl.to(newCardElement, {
						filter: 'brightness(1) drop-shadow(0 0 0px rgba(224, 122, 60, 0))',
						duration: 0.6,
						ease: 'power2.inOut'
					}, '-=0.6');

					await tl.then();

					// Don't remove from array - just keep it hidden in animatingCards
					// Removing from array causes position shifts for remaining cards

					// Don't delete from animatingCards either - keep it hidden permanently
					// animatingCards.delete(index);
				}
			}
		} else {
			// Fallback sin animación
			cartasSeleccionadas.push({
				arcano: `${index}`,  // ID del arcano (0-21)
				invertida,
				posicion: posicionDestino
			});

			// Keep card hidden in animatingCards for fallback path too
			// Don't remove from array or delete from animatingCards
		}
	}


	function reiniciar() {
		cartasSeleccionadas = [];
		cartasDisponibles = Array.from({ length: TOTAL_CARTAS }, (_, i) => i);
	}

	function confirmarSeleccion() {
		if (selectionCompleta) {
			onComplete(cartasSeleccionadas);
		}
	}

	function estaSeleccionada(index: number): boolean {
		return cartasSeleccionadas.some(c => c.arcano === `${index}`);
	}

	function obtenerPosicion(index: number): number | undefined {
		const carta = cartasSeleccionadas.find(c => c.arcano === `${index}`);
		return carta?.posicion;
	}
</script>

{#if numCartas === 10}
	<!-- Layout de dos columnas para Cruz Celta -->
	<div class="celtic-layout">
		<!-- Contenedor izquierdo: Mazo de cartas -->
		<div class="deck-container">
			<div class="deck-stack">
				{#each cartasDisponibles as cardIndex, i (cardIndex)}
					<div
						class="deck-card"
						class:animating={animatingCards.has(cardIndex)}
						style="--card-index: {i};"
						onclick={(e) => seleccionarCarta(cardIndex, e)}
					>
						<TarotCard
							selected={estaSeleccionada(cardIndex)}
							invertida={false}
							posicion={obtenerPosicion(cardIndex)}
							disabled={!puedeSeleccionar && !estaSeleccionada(cardIndex)}
							cardIndex={cardIndex}
							revealed={false}
						/>
					</div>
				{/each}
			</div>
		</div>

		<!-- Contenedor derecho: Diagrama de la Cruz Celta -->
		<div class="spread-container">
			<div class="celtic-cross-diagram">
				{#each Array(numCartas) as _, i}
					<div class="celtic-position" data-position={i}>
						<div class="position-card-wrapper">
							{#if cartasSeleccionadas[i]}
								{@const carta = cartasSeleccionadas[i]}
								{@const cartaIndex = parseInt(carta.arcano)}
								<TarotCard
									selected={true}
									invertida={false}
									posicion={carta.posicion}
									cardIndex={cartaIndex}
									revealed={true}
								/>
							{:else}
								<div class="empty-spread-slot">
									<div class="slot-glow"></div>
									<span class="slot-number">{i + 1}</span>
								</div>
							{/if}
						</div>
						<div class="position-label">
							{posiciones[i]}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{:else if numCartas === 13}
	<!-- Layout para Rueda del Año -->
	<div class="wheel-layout">
		<!-- Contenedor izquierdo: Mazo de cartas -->
		<div class="deck-container">
			<div class="deck-stack">
				{#each cartasDisponibles as cardIndex, i (cardIndex)}
					<div
						class="deck-card"
						class:animating={animatingCards.has(cardIndex)}
						style="--card-index: {i};"
						onclick={(e) => seleccionarCarta(cardIndex, e)}
					>
						<TarotCard
							selected={estaSeleccionada(cardIndex)}
							invertida={false}
							posicion={obtenerPosicion(cardIndex)}
							disabled={!puedeSeleccionar && !estaSeleccionada(cardIndex)}
							cardIndex={cardIndex}
							revealed={false}
						/>
					</div>
				{/each}
			</div>
		</div>

		<!-- Contenedor derecho: Rueda circular -->
		<div class="spread-container">
			<div class="wheel-diagram">
				{#each Array(numCartas) as _, i}
					<div class="wheel-position" data-position={i}>
						<div class="position-card-wrapper">
							{#if cartasSeleccionadas[i]}
								{@const carta = cartasSeleccionadas[i]}
								{@const cartaIndex = parseInt(carta.arcano)}
								<TarotCard
									selected={true}
									invertida={false}
									posicion={carta.posicion}
									cardIndex={cartaIndex}
									revealed={true}
								/>
							{:else}
								<div class="empty-spread-slot">
									<div class="slot-glow"></div>
									<span class="slot-number">{i + 1}</span>
								</div>
							{/if}
						</div>
						<div class="position-label">
							{posiciones[i]}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{:else}
	<!-- Layout normal para otras tiradas -->
	<div class="card-selection">
		<!-- Available Cards Fan -->
		<div class="cards-fan-container">
			<div class="cards-fan">
				{#each cartasDisponibles as index, i}
					<div
						class="fan-card-wrapper"
						class:animating={animatingCards.has(index)}
						style="--card-index: {i}; --total-cards: 22;"
						onclick={(e) => seleccionarCarta(index, e)}
					>
						<TarotCard
							selected={estaSeleccionada(index)}
							invertida={false}
							posicion={obtenerPosicion(index)}
							disabled={!puedeSeleccionar && !estaSeleccionada(index)}
							cardIndex={index}
							revealed={false}
						/>
					</div>
				{/each}
			</div>
		</div>

		<!-- Spread Layout - Floating Cards -->
		<div class="spread-layout" data-card-count={numCartas}>
			{#each Array(numCartas) as _, i}
				<div class="spread-position" data-position={i} style="--position-index: {i}">
					<div class="card-wrapper">
						{#if cartasSeleccionadas[i]}
							{@const carta = cartasSeleccionadas[i]}
							{@const cartaIndex = parseInt(carta.arcano)}
							<TarotCard
								selected={true}
								invertida={false}
								posicion={carta.posicion}
								cardIndex={cartaIndex}
								revealed={true}
							/>
						{:else}
							<div class="empty-spread-slot">
								<div class="slot-glow"></div>
								<span class="slot-number">{i + 1}</span>
							</div>
						{/if}
						{#if numCartas === 3}
							<div class="card-label">
								{#if i === 0}
									En Contra
								{:else if i === 1}
									La Respuesta
								{:else}
									A Favor
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Confirmation Button -->
{#if selectionCompleta}
	<div class="confirmation-section">
		<button class="btn-confirmar" onclick={confirmarSeleccion}>
			<span class="btn-text">Obtén tu Respuesta</span>
			<span class="btn-icon">✨</span>
		</button>
	</div>
{/if}

<style>
	.card-selection {
		padding: var(--spacing-sm) 0;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	/* Layout de dos columnas para Cruz Celta y Rueda del Año */
	.celtic-layout,
	.wheel-layout {
		display: grid;
		grid-template-columns: 3fr 7fr;
		gap: var(--spacing-sm);
		height: 100%;
		width: 100%;
		padding: 0;
		overflow: hidden;
	}

	/* Contenedor izquierdo: Mazo */
	.deck-container {
		background: rgba(37, 55, 82, 0.3);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
		position: relative;
		height: 100%;
	}

	.deck-stack {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 20px 0;
	}

	.deck-card {
		position: absolute;
		/* S-shape formation using sine wave */
		--s-curve-offset: calc(sin(var(--card-index) * 0.3) * 60px);
		/* Hover tilt direction follows the curve (derivative of sine is cosine) */
		--hover-tilt-direction: calc(cos(var(--card-index) * 0.3) * 6deg);
		left: calc(50% + var(--s-curve-offset));
		transform: translateX(-50%);
		transition: all 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
		cursor: pointer;
		top: calc(20px + var(--card-index) * 22px);

		/* Entrance animation for deck cards */
		animation: deckCardEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
		animation-delay: calc(var(--card-index) * 0.035s);
	}

	@keyframes deckCardEnter {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-40px) rotate(15deg) scale(0.7);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0) rotate(0deg) scale(1);
		}
	}

	.deck-card.animating {
		opacity: 0 !important;
		pointer-events: none;
		transition: none;
		visibility: hidden;
	}

	.deck-card:hover {
		transform: translateX(-50%) scale(1.08) rotate(var(--hover-tilt-direction)) translateY(-4px);
		filter: brightness(1.15) drop-shadow(0 8px 20px rgba(224, 122, 60, 0.5));
	}

	.deck-card :global(.tarot-card) {
		/* Deck cards: responsive sizing */
		width: clamp(90px, 7vw, 130px);
		height: clamp(150px, 11.7vw, 217px);
	}

	/* Contenedor derecho: Diagrama de la Cruz */
	.spread-container {
		background: rgba(37, 55, 82, 0.3);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-lg);
		position: relative;
		overflow: visible;
		height: 100%;
	}

	.celtic-cross-diagram {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.celtic-position {
		position: absolute;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		z-index: 1;
	}

	.position-card-wrapper {
		flex-shrink: 0;
	}

	.celtic-position :global(.tarot-card) {
		/* Celtic cross cards: responsive sizing (smaller than deck) */
		width: clamp(60px, 5vw, 95px);
		height: clamp(100px, 8.3vw, 158px);
	}

	.celtic-position .empty-spread-slot {
		/* Match card size */
		width: clamp(60px, 5vw, 95px);
		height: clamp(100px, 8.3vw, 158px);
	}

	.celtic-position .empty-spread-slot .slot-number {
		font-size: 1.3rem;
	}

	.position-label {
		font-family: var(--font-mystical);
		font-size: 0.85rem;
		color: var(--color-text-muted);
		background: rgba(26, 40, 68, 0.7);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		white-space: pre-line;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(4px);
		text-align: center;
		line-height: 1.3;
		pointer-events: none;
		margin-top: var(--spacing-xs);
	}

	/* Padding adicional para las cartas del staff vertical (posiciones 7-10) solo en Cruz Celta */
	.celtic-position[data-position="6"],
	.celtic-position[data-position="7"],
	.celtic-position[data-position="8"],
	.celtic-position[data-position="9"] {
		padding-bottom: 0px;
	}

	/* Spread Layout - Floating Cards Pattern */
	.spread-layout {
		position: relative;
		min-height: 280px;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--spacing-sm) 0;
		flex-shrink: 0;
		width: 100%;
	}

	.spread-position {
		position: absolute;
		transition: none;
	}

	.card-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.card-wrapper:hover :global(.tarot-card) {
		/* Hover effect removed - only deck cards should have hover */
	}

	.card-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-primary);
		text-transform: uppercase;
		letter-spacing: 1px;
		text-align: center;
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary), var(--color-primary));
		background-size: 200% 100%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		padding-top: var(--spacing-xs);
		animation: labelShine 3s ease-in-out infinite;
		filter: drop-shadow(0 2px 8px rgba(224, 122, 60, 0.4));
	}

	@keyframes labelShine {
		0%, 100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	/* 3-card spread: Past-Present-Future (horizontal line) */
	.spread-layout[data-card-count="3"] {
		min-height: 300px;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 50px;
	}

	.spread-layout[data-card-count="3"] .spread-position {
		position: relative;
		left: auto;
		top: auto;
		transform: none;
	}

	.spread-layout[data-card-count="3"] .spread-position[data-position="0"] {
		transform: rotate(-8deg);
	}

	.spread-layout[data-card-count="3"] .spread-position[data-position="1"] {
		transform: rotate(0deg);
	}

	.spread-layout[data-card-count="3"] .spread-position[data-position="2"] {
		transform: rotate(8deg);
	}

	/* Disable ALL hover effects for 3-card spread */
	.spread-layout[data-card-count="3"] :global(.tarot-card) {
		transform: none !important;
		transition: none !important;
		will-change: auto !important;
	}

	.spread-layout[data-card-count="3"] :global(.tarot-card:hover) {
		transform: none !important;
		transition: none !important;
		will-change: auto !important;
	}

	.spread-layout[data-card-count="3"] :global(.tarot-card .card-inner) {
		transform: none !important;
		transition: none !important;
	}

	.spread-layout[data-card-count="3"] :global(.tarot-card:hover .card-inner) {
		transform: none !important;
		transition: none !important;
	}

	/* 5-card spread: Cross pattern */
	.spread-layout[data-card-count="5"] {
		min-height: 350px;
	}

	.spread-layout[data-card-count="5"] .spread-position[data-position="0"] {
		left: 50%;
		top: 15%;
		transform: translate(-50%, -50%);
	}

	.spread-layout[data-card-count="5"] .spread-position[data-position="1"] {
		left: 20%;
		top: 50%;
		transform: translate(-50%, -50%) rotate(-5deg);
	}

	.spread-layout[data-card-count="5"] .spread-position[data-position="2"] {
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.spread-layout[data-card-count="5"] .spread-position[data-position="3"] {
		left: 80%;
		top: 50%;
		transform: translate(-50%, -50%) rotate(5deg);
	}

	.spread-layout[data-card-count="5"] .spread-position[data-position="4"] {
		left: 50%;
		top: 85%;
		transform: translate(-50%, -50%);
	}

	/* 7-card spread: Horseshoe pattern */
	.spread-layout[data-card-count="7"] {
		min-height: 320px;
	}

	.spread-layout[data-card-count="7"] .spread-position {
		--angle: calc((var(--position-index) - 3) * 20deg);
		--radius: 280px;
		left: calc(50% + sin(var(--angle)) * var(--radius));
		top: calc(50% + (1 - cos(var(--angle))) * var(--radius) * 0.8);
		transform: translate(-50%, -50%) rotate(calc(var(--angle) * 0.6));
	}

	/* Posiciones de la Cruz Celta - Patrón tradicional (10 cartas) */

	/* Carta 1: El Presente (centro de la cruz) */
	.celtic-position[data-position="0"] {
		left: 35%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	/* Carta 2: El Desafío (cruzando la carta 1, horizontal y rotada) */
	.celtic-position[data-position="1"] {
		left: 35%;
		top: 50%;
		transform: translate(-50%, -50%) rotate(90deg);
		z-index: 1;
	}

	/* Carta 3: Influencias Pasadas (izquierda de la cruz) */
	.celtic-position[data-position="2"] {
		left: 15%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	/* Carta 4: Futuro Cercano (derecha de la cruz) */
	.celtic-position[data-position="3"] {
		left: 55%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	/* Carta 5: Influencias Coronando (arriba de la cruz) */
	.celtic-position[data-position="4"] {
		left: 35%;
		top: 20%;
		transform: translate(-50%, -50%);
	}

	/* Carta 6: Fundación (abajo de la cruz) */
	.celtic-position[data-position="5"] {
		left: 35%;
		top: 80%;
		transform: translate(-50%, -50%);
	}

	/* Carta 7: Tú mismo (staff vertical - abajo) */
	.celtic-position[data-position="6"] {
		left: 80%;
		top: 85%;
		transform: translate(-50%, -50%);
	}

	/* Carta 8: Casa/Entorno (staff vertical) */
	.celtic-position[data-position="7"] {
		left: 80%;
		top: 63%;
		transform: translate(-50%, -50%);
	}

	/* Carta 9: Esperanzas y Miedos (staff vertical) */
	.celtic-position[data-position="8"] {
		left: 80%;
		top: 41%;
		transform: translate(-50%, -50%);
	}

	/* Carta 10: Resultado Final (staff vertical - arriba) */
	.celtic-position[data-position="9"] {
		left: 80%;
		top: 19%;
		transform: translate(-50%, -50%);
	}

	/* === RUEDA DEL AÑO === */
	/* Layout circular para 12 meses */

	.wheel-diagram {
		position: relative;
		width: 600px;
		height: 600px;
	}

	.wheel-position {
		position: absolute;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		z-index: 1;
	}

	.wheel-position :global(.tarot-card) {
		/* Wheel of the year cards: responsive sizing (smallest) */
		width: clamp(50px, 4vw, 80px);
		height: clamp(83px, 6.7vw, 133px);
	}

	.wheel-position .empty-spread-slot {
		/* Match card size */
		width: clamp(50px, 4vw, 80px);
		height: clamp(83px, 6.7vw, 133px);
	}

	.wheel-position .empty-spread-slot .slot-number {
		font-size: 1.1rem;
	}

	.wheel-position .position-label {
		font-family: var(--font-mystical);
		font-size: 0.75rem;
		color: var(--color-text-muted);
		background: rgba(26, 40, 68, 0.7);
		padding: 4px 8px;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		white-space: nowrap;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(4px);
		text-align: center;
		pointer-events: none;
		margin-top: 0;
	}

	/* Posiciones circulares como reloj - Círculo perfecto */
	/* Radio del círculo: 38% desde el centro */
	/* Enero empieza abajo (6 en punto) y vamos en sentido horario */
	/* Fórmula: x = 50% + radio * sin(ángulo), y = 50% - radio * cos(ángulo) */

	/* Enero - posición 0 - 180° (6 en punto, abajo) */
	.wheel-position[data-position="0"] {
		left: 300px;
		top: 500px;
		transform: translate(-50%, -50%);
	}

	/* Febrero - posición 1 - 210° */
	.wheel-position[data-position="1"] {
		left: 200px;
		top: 473px;
		transform: translate(-50%, -50%);
	}

	/* Marzo - posición 2 - 240° */
	.wheel-position[data-position="2"] {
		left: 127px;
		top: 400px;
		transform: translate(-50%, -50%);
	}

	/* Abril - posición 3 - 270° (9 en punto, izquierda) */
	.wheel-position[data-position="3"] {
		left: 100px;
		top: 300px;
		transform: translate(-50%, -50%);
	}

	/* Mayo - posición 4 - 300° */
	.wheel-position[data-position="4"] {
		left: 127px;
		top: 200px;
		transform: translate(-50%, -50%);
	}

	/* Junio - posición 5 - 330° */
	.wheel-position[data-position="5"] {
		left: 200px;
		top: 127px;
		transform: translate(-50%, -50%);
	}

	/* Julio - posición 6 - 0° (12 en punto, arriba) */
	.wheel-position[data-position="6"] {
		left: 300px;
		top: 100px;
		transform: translate(-50%, -50%);
	}

	/* Agosto - posición 7 - 30° */
	.wheel-position[data-position="7"] {
		left: 400px;
		top: 127px;
		transform: translate(-50%, -50%);
	}

	/* Septiembre - posición 8 - 60° */
	.wheel-position[data-position="8"] {
		left: 473px;
		top: 200px;
		transform: translate(-50%, -50%);
	}

	/* Octubre - posición 9 - 90° (3 en punto, derecha) */
	.wheel-position[data-position="9"] {
		left: 500px;
		top: 300px;
		transform: translate(-50%, -50%);
	}

	/* Noviembre - posición 10 - 120° */
	.wheel-position[data-position="10"] {
		left: 473px;
		top: 400px;
		transform: translate(-50%, -50%);
	}

	/* Diciembre - posición 11 - 150° */
	.wheel-position[data-position="11"] {
		left: 400px;
		top: 473px;
		transform: translate(-50%, -50%);
	}

	/* El Año - Centro */
	.wheel-position[data-position="12"] {
		left: 300px;
		top: 300px;
		transform: translate(-50%, -50%);
		z-index: 1;
	}

	.wheel-position[data-position="12"] :global(.tarot-card) {
		/* Center card (El Año): larger than other wheel cards */
		width: clamp(60px, 5vw, 95px);
		height: clamp(100px, 8.3vw, 158px);
		box-shadow: 0 0 40px rgba(245, 158, 11, 0.5);
	}

	.wheel-position[data-position="12"] .empty-spread-slot {
		/* Match center card size */
		width: clamp(60px, 5vw, 95px);
		height: clamp(100px, 8.3vw, 158px);
	}

	.wheel-position[data-position="12"] .position-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-primary);
		background: rgba(245, 158, 11, 0.15);
		border-color: var(--color-primary);
	}

	/* Empty spread slot with glow effect */
	.empty-spread-slot {
		/* Base responsive sizing for generic slots */
		width: clamp(80px, 8vw, 150px);
		height: clamp(133px, 13.3vw, 250px);
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(224, 122, 60, 0.05), rgba(139, 90, 60, 0.08));
		position: relative;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
		animation: slotBreathe 3s ease-in-out infinite;
	}

	@keyframes slotBreathe {
		0%, 100% {
			transform: scale(1);
			border-color: var(--color-border);
		}
		50% {
			transform: scale(1.02);
			border-color: rgba(224, 122, 60, 0.4);
		}
	}

	.empty-spread-slot:hover {
		/* Hover effect removed */
	}

	.slot-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			circle at center,
			rgba(224, 122, 60, 0.25) 0%,
			rgba(224, 122, 60, 0.15) 40%,
			transparent 70%
		);
		animation: pulse 2.5s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 0.6;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.1);
		}
	}

	.slot-number {
		font-size: 2rem;
		font-weight: 700;
		background: linear-gradient(135deg,
			var(--color-primary),
			var(--color-secondary),
			var(--color-primary));
		background-size: 200% 100%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		position: relative;
		z-index: 1;
		animation: slotNumberShine 3s ease-in-out infinite;
		filter: drop-shadow(0 0 8px rgba(224, 122, 60, 0.5));
	}

	@keyframes slotNumberShine {
		0%, 100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	/* Card arc effect */
	.cards-fan-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 320px;
		padding: var(--spacing-sm) 0;
		perspective: 1200px;
		flex: 1;
	}

	.cards-fan {
		position: relative;
		width: 100%;
		max-width: 1400px;
		height: 300px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.fan-card-wrapper {
		position: absolute;
		left: 50%;
		top: 50%;
		transform-origin: center center;
		transition: transform 0.2s ease-out, filter 0.2s ease-out;
		cursor: pointer;

		/* Calculate arc positioning based on card index - inverted arc */
		/* Aumentado de 7deg a 9deg para más separación */
		--rotation-angle: calc(
			(var(--card-index) - (var(--total-cards) - 1) / 2) * 9deg
		);
		/* Aumentado el radio para más espacio horizontal */
		--arc-radius: 340px;
		--arc-offset-x: calc(sin(var(--rotation-angle)) * var(--arc-radius));
		--arc-offset-y: calc((1 - cos(var(--rotation-angle))) * var(--arc-radius) * 0.6);

		transform:
			translate(-50%, -50%)
			translate(var(--arc-offset-x), var(--arc-offset-y))
			rotate(var(--rotation-angle));

		/* Staggered entrance animation */
		animation: fanCardEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
		animation-delay: calc(var(--card-index) * 0.022s);

		/* Aumentar área clickeable */
		padding: 20px;
		margin: -20px;
	}

	@keyframes fanCardEnter {
		from {
			opacity: 0;
			transform:
				translate(-50%, -50%)
				translate(0, 0)
				rotate(0deg)
				scale(0.3);
		}
		to {
			opacity: 1;
		}
	}

	/* Hide animating cards from the fan */
	.fan-card-wrapper.animating {
		opacity: 0 !important;
		pointer-events: none;
		transition: none;
		visibility: hidden;
	}

	.fan-card-wrapper:hover:not(.animating) {
		/* Subtle hover effect - move outward along the arc radius */
		--hover-distance: 30px;
		transform:
			translate(-50%, -50%)
			translate(
				calc(var(--arc-offset-x) + sin(var(--rotation-angle)) * var(--hover-distance)),
				calc(var(--arc-offset-y) - cos(var(--rotation-angle)) * var(--hover-distance))
			)
			rotate(var(--rotation-angle))
			scale(1.05);
		filter: brightness(1.15) drop-shadow(0 8px 20px rgba(224, 122, 60, 0.6));
	}

	/* Hacer que las cartas vecinas se separen un poco al hacer hover */
	.fan-card-wrapper:hover ~ .fan-card-wrapper {
		/* Hover effect removed */
	}

	.confirmation-section {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 100;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--spacing-xl);
		background: radial-gradient(
			ellipse at center,
			rgba(88, 28, 135, 0.2),
			rgba(109, 40, 217, 0.15),
			transparent
		);
		border: 2px solid rgba(168, 85, 247, 0.3);
		border-radius: 50px;
		backdrop-filter: blur(16px);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			0 0 60px rgba(168, 85, 247, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		animation: fadeInCenter 0.4s ease-out, pulseGlow 2s ease-in-out infinite;
	}

	@keyframes fadeInCenter {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	@keyframes cardFly {
		0% {
			transform: scale(0.8);
			opacity: 0.8;
			filter: brightness(1);
		}
		20% {
			transform: translateY(-100px) scale(1.2) rotateY(90deg) rotateZ(15deg);
			opacity: 1;
			filter: brightness(1.3) drop-shadow(0 0 25px rgba(224, 122, 60, 0.6));
		}
		50% {
			transform: translateY(-150px) scale(1.4) rotateY(180deg) rotateZ(0deg);
			opacity: 1;
			filter: brightness(1.5) drop-shadow(0 0 35px rgba(224, 122, 60, 0.8));
		}
		70% {
			transform: translateY(-80px) scale(1.2) rotateY(270deg) rotateZ(-10deg);
			opacity: 1;
			filter: brightness(1.3) drop-shadow(0 0 25px rgba(224, 122, 60, 0.6));
		}
		90% {
			transform: translateY(-10px) scale(1.05) rotateY(350deg) rotateZ(0deg);
			opacity: 1;
			filter: brightness(1.1) drop-shadow(0 0 15px rgba(224, 122, 60, 0.4));
		}
		100% {
			transform: translateY(0) scale(1) rotateY(360deg) rotateZ(0deg);
			opacity: 1;
			filter: brightness(1) drop-shadow(0 0 0px rgba(224, 122, 60, 0));
		}
	}

	.btn-confirmar {
		position: relative;
		padding: var(--spacing-lg) calc(var(--spacing-xl) * 2);
		background: linear-gradient(
			135deg,
			#6d28d9,
			#8b5cf6,
			#a78bfa,
			#7c3aed
		);
		background-size: 300% 300%;
		color: #ffffff;
		font-weight: 800;
		font-size: 1.5rem;
		letter-spacing: 1px;
		text-transform: uppercase;
		border-radius: 40px;
		box-shadow:
			0 6px 20px rgba(139, 92, 246, 0.6),
			0 12px 40px rgba(109, 40, 217, 0.4),
			inset 0 2px 0 rgba(255, 255, 255, 0.25),
			inset 0 -2px 0 rgba(0, 0, 0, 0.2);
		transition: all 0.3s ease;
		overflow: hidden;
		animation: gradientShift 4s ease infinite;
		border: none;
	}

	.btn-confirmar::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		transform: translate(-50%, -50%);
		transition: width 0.6s, height 0.6s;
	}

	.btn-confirmar:hover::before {
		width: 300px;
		height: 300px;
	}

	.btn-confirmar:hover {
		transform: translateY(-4px) scale(1.08);
		box-shadow:
			0 8px 28px rgba(139, 92, 246, 0.8),
			0 16px 56px rgba(109, 40, 217, 0.6),
			0 0 60px rgba(168, 85, 247, 0.4),
			inset 0 2px 0 rgba(255, 255, 255, 0.35),
			inset 0 -2px 0 rgba(0, 0, 0, 0.2);
		background-position: 100% 50%;
	}

	.btn-confirmar:active {
		transform: translateY(-1px) scale(1.02);
	}

	.btn-text {
		position: relative;
		z-index: 1;
	}

	.btn-icon {
		position: relative;
		z-index: 1;
		margin-left: var(--spacing-xs);
		display: inline-block;
		font-size: 1.4rem;
		animation: sparkle 1.5s ease-in-out infinite;
	}



	@media (max-width: 768px) {
		.card-selection {
			padding: 0;
			gap: var(--spacing-sm);
		}

		/* Mobile spread adjustments */
		.spread-layout {
			min-height: 220px;
			padding: var(--spacing-xs) 0;
		}

		.spread-layout[data-card-count="3"] {
			min-height: 200px;
			width: 100%;
			gap: 20px;
			padding: 0 var(--spacing-sm);
		}

		.spread-layout[data-card-count="5"] {
			min-height: 280px;
		}

		.spread-layout[data-card-count="7"] {
			min-height: 260px;
		}

		.spread-layout[data-card-count="7"] .spread-position {
			--radius: 180px;
		}

		.spread-layout[data-card-count="10"] {
			min-height: 350px;
		}

		/* Smaller empty slots on mobile - inherit responsive sizing from base */
		.empty-spread-slot {
			width: clamp(70px, 12vw, 110px);
			height: clamp(117px, 20vw, 183px);
		}

		.slot-number {
			font-size: 1.5rem;
		}

		/* Mobile fan arc adjustments */
		.cards-fan-container {
			min-height: 260px;
			padding: var(--spacing-xs) 0;
		}

		.cards-fan {
			height: 240px;
			max-width: 100%;
		}

		.fan-card-wrapper {
			/* Mayor separación en mobile: de 5deg a 7deg */
			--rotation-angle: calc(
				(var(--card-index) - (var(--total-cards) - 1) / 2) * 7deg
			);
			/* Radio más grande para más espacio */
			--arc-radius: 220px;
			--arc-offset-x: calc(sin(var(--rotation-angle)) * var(--arc-radius));
			--arc-offset-y: calc((1 - cos(var(--rotation-angle))) * var(--arc-radius) * 0.5);

			/* Más padding en mobile para área táctil más grande */
			padding: 30px;
			margin: -30px;
		}

		.fan-card-wrapper:hover,
		.fan-card-wrapper:active {
			/* Subtle hover effect for mobile - move outward along the arc radius */
			--hover-distance: 30px;
			transform:
				translate(-50%, -50%)
				translate(
					calc(var(--arc-offset-x) + sin(var(--rotation-angle)) * var(--hover-distance)),
					calc(var(--arc-offset-y) - cos(var(--rotation-angle)) * var(--hover-distance))
				)
				rotate(var(--rotation-angle))
				scale(1.05);
			filter: brightness(1.15) drop-shadow(0 8px 20px rgba(224, 122, 60, 0.6));
		}

		.confirmation-section {
			padding: var(--spacing-sm);
			width: 90%;
			max-width: 400px;
		}

		.btn-confirmar {
			padding: var(--spacing-sm) var(--spacing-lg);
			font-size: 1rem;
		}
	}
</style>
