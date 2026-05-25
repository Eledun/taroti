<script lang="ts">
	import TarotCard from './TarotCard.svelte';
	import type { CartaTarot } from '$lib/types';

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
	let animatingCards = $state<Set<number>>(new Set());

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

		// Remover de cartas disponibles INMEDIATAMENTE para prevenir doble selección
		cartasDisponibles = cartasDisponibles.filter(c => c !== index);

		const posicionDestino = cartasSeleccionadas.length;

		// Las cartas nunca están invertidas
		const invertida = false;

		// Marcar carta como animando
		animatingCards.add(index);

		// Obtener elementos para FLIP
		const cardElement = event?.currentTarget as HTMLElement;

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
				arcano: `carta_${index}`,
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
					// Animación simplificada: ZOOM en el centro de la pantalla para revelar la carta
					// Calcular posición del centro absoluto del viewport
					const viewportCenterX = window.innerWidth / 2;
					const viewportCenterY = window.innerHeight / 2;

					// Posición actual de la carta en la pantalla
					const currentCardCenterX = last.left + last.width / 2;
					const currentCardCenterY = last.top + last.height / 2;

					// Delta para mover la carta al centro de la pantalla
					const deltaToScreenCenterX = viewportCenterX - currentCardCenterX;
					const deltaToScreenCenterY = viewportCenterY - currentCardCenterY;

					const animation = newCardElement.animate([
						// Keyframe 0: Posición inicial (en el mazo, boca abajo)
						{
							transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaScale}) rotateY(0deg)`,
							opacity: 1,
							zIndex: 9999
						},
						// Keyframe 1: Inicio del flip - despegue (10%)
						{
							transform: `translate(${deltaX * 0.9}px, ${deltaY * 0.9}px) scale(${deltaScale * 1.05}) rotateY(30deg)`,
							opacity: 1,
							offset: 0.10,
							zIndex: 9999
						},
						// Keyframe 2: Flip continuando, elevándose (15%)
						{
							transform: `translate(${deltaX * 0.8}px, ${deltaY * 0.8}px) scale(${deltaScale * 1.15}) rotateY(60deg)`,
							opacity: 1,
							offset: 0.15,
							zIndex: 9999
						},
						// Keyframe 3: Medio flip, avanzando hacia centro (20%)
						{
							transform: `translate(${deltaX * 0.7 + deltaToScreenCenterX * 0.3}px, ${deltaY * 0.7 + deltaToScreenCenterY * 0.3}px) scale(${deltaScale * 1.25}) rotateY(90deg)`,
							opacity: 1,
							offset: 0.20,
							zIndex: 9999,
							filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.4))'
						},
						// Keyframe 4: Continúa flip suavemente (27%)
						{
							transform: `translate(${deltaX * 0.5 + deltaToScreenCenterX * 0.5}px, ${deltaY * 0.5 + deltaToScreenCenterY * 0.5}px) scale(${deltaScale * 1.5}) rotateY(150deg)`,
							opacity: 1,
							offset: 0.27,
							zIndex: 9999,
							filter: 'drop-shadow(0 0 25px rgba(245, 158, 11, 0.5))'
						},
						// Keyframe 5: Acercándose al centro (32%)
						{
							transform: `translate(${deltaX * 0.3 + deltaToScreenCenterX * 0.7}px, ${deltaY * 0.3 + deltaToScreenCenterY * 0.7}px) scale(${1.8}) rotateY(210deg)`,
							opacity: 1,
							offset: 0.32,
							zIndex: 9999,
							filter: 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.6))'
						},
						// Keyframe 6: Casi en el centro, completando flip (37%)
						{
							transform: `translate(${deltaToScreenCenterX * 0.95}px, ${deltaToScreenCenterY * 0.95}px) scale(2.3) rotateY(270deg)`,
							opacity: 1,
							offset: 0.37,
							zIndex: 9999,
							filter: 'drop-shadow(0 0 35px rgba(245, 158, 11, 0.7))'
						},
						// Keyframe 7: Llegar al centro, ajuste final del flip (42%)
						{
							transform: `translate(${deltaToScreenCenterX}px, ${deltaToScreenCenterY}px) scale(2.7) rotateY(330deg)`,
							opacity: 1,
							offset: 0.42,
							zIndex: 9999,
							filter: 'drop-shadow(0 0 50px rgba(245, 158, 11, 0.9))'
						},
						// Keyframe 8: ZOOM GRANDE en el CENTRO, carta REVELADA con texto derecho (45%)
						{
							transform: `translate(${deltaToScreenCenterX}px, ${deltaToScreenCenterY}px) scale(3) rotateY(360deg)`,
							opacity: 1,
							offset: 0.45,
							zIndex: 9999,
							filter: 'drop-shadow(0 0 60px rgba(245, 158, 11, 1))'
						},
						// Keyframe 9: Mantener ZOOM - tiempo extendido para ver bien la carta (80%)
						{
							transform: `translate(${deltaToScreenCenterX}px, ${deltaToScreenCenterY}px) scale(3) rotateY(360deg)`,
							opacity: 1,
							offset: 0.80,
							zIndex: 9999,
							filter: 'drop-shadow(0 0 60px rgba(245, 158, 11, 1))'
						},
						// Keyframe 10: Reducir zoom suavemente y empezar a desplazarse (90%)
						{
							transform: `translate(${deltaToScreenCenterX * 0.4}px, ${deltaToScreenCenterY * 0.4}px) scale(1.8) rotateY(360deg)`,
							opacity: 1,
							offset: 0.90,
							zIndex: 9999,
							filter: 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.6))'
						},
						// Keyframe 11: Llegar a posición final, mantener vuelta completa (texto derecho)
						{
							transform: 'translate(0, 0) scale(1) rotateY(360deg)',
							opacity: 1,
							zIndex: 'auto',
							filter: 'none'
						}
					], {
						duration: 3200,
						easing: 'ease-in-out',
						fill: 'forwards'
					});

					await animation.finished;
				} else {
					// Animación normal para otras tiradas
					const animation = newCardElement.animate([
						{
							transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaScale}) rotateY(0deg) rotateZ(${Math.random() * 40 - 20}deg)`,
							opacity: 0.8
						},
						{
							transform: `translate(${deltaX * 0.5}px, ${deltaY * 0.5 - 50}px) scale(${1 + deltaScale * 0.2}) rotateY(180deg) rotateZ(${Math.random() * 20 - 10}deg)`,
							opacity: 0.9,
							offset: 0.5
						},
						{
							transform: 'translate(0, 0) scale(1) rotateY(360deg) rotateZ(0deg)',
							opacity: 1
						}
					], {
						duration: 1000,
						easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
						fill: 'forwards'
					});

					await animation.finished;
				}
			}
		} else {
			// Fallback sin animación
			cartasSeleccionadas.push({
				arcano: `carta_${index}`,
				invertida,
				posicion: posicionDestino
			});
		}

		// Limpiar estado de animación
		animatingCards.delete(index);
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
		return cartasSeleccionadas.some(c => c.arcano === `carta_${index}`);
	}

	function obtenerPosicion(index: number): number | undefined {
		const carta = cartasSeleccionadas.find(c => c.arcano === `carta_${index}`);
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
								{@const cartaIndex = parseInt(carta.arcano.split('_')[1])}
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
								{@const cartaIndex = parseInt(carta.arcano.split('_')[1])}
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
							{@const cartaIndex = parseInt(carta.arcano.split('_')[1])}
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
		left: 50%;
		transform: translateX(-50%);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		top: calc(20px + var(--card-index) * 18px);
	}

	.deck-card:hover {
		transform: translateX(calc(-50% + 30px));
		z-index: 100;
		filter: drop-shadow(0 8px 20px rgba(224, 122, 60, 0.7));
	}

	.deck-card :global(.tarot-card) {
		width: 120px;
		height: 200px;
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
	}

	.position-card-wrapper {
		flex-shrink: 0;
	}

	.celtic-position :global(.tarot-card) {
		width: 85px;
		height: 142px;
	}

	.celtic-position .empty-spread-slot {
		width: 85px;
		height: 142px;
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
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.card-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.card-wrapper :global(.tarot-card) {
		will-change: transform, opacity;
	}

	.card-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-primary);
		text-transform: uppercase;
		letter-spacing: 1px;
		text-align: center;
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-shadow: 0 2px 8px rgba(224, 122, 60, 0.3);
		padding-top: var(--spacing-xs);
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
		z-index: 2; /* Menor que z-index de animación (9999) */
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
	}

	.wheel-position :global(.tarot-card) {
		width: 70px;
		height: 117px;
	}

	.wheel-position .empty-spread-slot {
		width: 70px;
		height: 117px;
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
		z-index: 10; /* Menor que z-index de animación (9999) */
	}

	.wheel-position[data-position="12"] :global(.tarot-card) {
		width: 85px;
		height: 142px;
		box-shadow: 0 0 40px rgba(245, 158, 11, 0.5);
	}

	.wheel-position[data-position="12"] .empty-spread-slot {
		width: 85px;
		height: 142px;
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
		width: 120px;
		height: 200px;
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(224, 122, 60, 0.05), rgba(139, 90, 60, 0.08));
		position: relative;
		overflow: hidden;
	}

	.slot-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			circle at center,
			rgba(224, 122, 60, 0.2) 0%,
			rgba(224, 122, 60, 0.1) 40%,
			transparent 70%
		);
		animation: pulse 2s ease-in-out infinite;
		pointer-events: none;
	}

	.slot-number {
		font-size: 2rem;
		font-weight: 700;
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		position: relative;
		z-index: 1;
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
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		will-change: transform;

		/* Calculate arc positioning based on card index - inverted arc */
		--rotation-angle: calc(
			(var(--card-index) - (var(--total-cards) - 1) / 2) * 7deg
		);
		--arc-radius: 280px;
		--arc-offset-x: calc(sin(var(--rotation-angle)) * var(--arc-radius));
		--arc-offset-y: calc((1 - cos(var(--rotation-angle))) * var(--arc-radius) * 0.6);

		transform:
			translate(-50%, -50%)
			translate(var(--arc-offset-x), var(--arc-offset-y))
			rotate(var(--rotation-angle));
	}

	.fan-card-wrapper:hover {
		--hover-radius: 320px;
		--arc-offset-x: calc(sin(var(--rotation-angle)) * var(--hover-radius));
		--arc-offset-y: calc((1 - cos(var(--rotation-angle))) * var(--hover-radius) * 0.6);

		transform:
			translate(-50%, -50%)
			translate(var(--arc-offset-x), var(--arc-offset-y))
			rotate(var(--rotation-angle))
			scale(1.15);
		z-index: 10;
		filter: drop-shadow(0 10px 30px rgba(224, 122, 60, 0.6));
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

	@keyframes pulseGlow {
		0%, 100% {
			box-shadow:
				0 8px 32px rgba(0, 0, 0, 0.4),
				0 0 60px rgba(168, 85, 247, 0.3),
				inset 0 1px 0 rgba(255, 255, 255, 0.1);
		}
		50% {
			box-shadow:
				0 8px 32px rgba(0, 0, 0, 0.4),
				0 0 100px rgba(168, 85, 247, 0.5),
				0 0 140px rgba(139, 92, 246, 0.3),
				inset 0 1px 0 rgba(255, 255, 255, 0.1);
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

	@keyframes sparkle {
		0%, 100% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		50% {
			transform: scale(1.2) rotate(180deg);
			opacity: 0.8;
		}
	}

	@keyframes gradientShift {
		0%, 100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
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

		/* Smaller empty slots on mobile */
		.empty-spread-slot {
			width: 90px;
			height: 150px;
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
			--rotation-angle: calc(
				(var(--card-index) - (var(--total-cards) - 1) / 2) * 5deg
			);
			--arc-radius: 180px;
			--arc-offset-x: calc(sin(var(--rotation-angle)) * var(--arc-radius));
			--arc-offset-y: calc((1 - cos(var(--rotation-angle))) * var(--arc-radius) * 0.5);
		}

		.fan-card-wrapper:hover {
			--hover-radius: 210px;
			--arc-offset-x: calc(sin(var(--rotation-angle)) * var(--hover-radius));
			--arc-offset-y: calc((1 - cos(var(--rotation-angle))) * var(--hover-radius) * 0.5);

			transform:
				translate(-50%, -50%)
				translate(var(--arc-offset-x), var(--arc-offset-y))
				rotate(var(--rotation-angle))
				scale(1.1);
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
