<script lang="ts">
	import { BACKCOVER_IMAGE, obtenerArcano } from '$lib/data/arcanos-mayores';

	interface Props {
		selected?: boolean;
		invertida?: boolean;
		posicion?: number;
		onclick?: () => void;
		disabled?: boolean;
		cardIndex?: number;
		revealed?: boolean;
	}

	let {
		selected = false,
		invertida = false,
		posicion,
		onclick,
		disabled = false,
		cardIndex,
		revealed = false
	}: Props = $props();

	const arcano = cardIndex !== undefined ? obtenerArcano(cardIndex) : null;
</script>

<button
	class="tarot-card"
	class:selected
	class:invertida
	class:disabled
	class:revealed
	onclick={onclick}
	disabled={disabled}
>
	<div class="card-inner">
		<!-- Reverso de la carta -->
		<div class="card-back">
			<img src={BACKCOVER_IMAGE} alt="Reverso del Tarot" class="card-image" />
		</div>

		<!-- Anverso de la carta (solo se muestra si está revelada) -->
		{#if revealed && arcano}
			<div class="card-front">
				<img src={arcano.imagen} alt={arcano.nombre} class="card-image" />
			</div>
		{/if}
	</div>
	{#if invertida}
		<div class="invertida-badge">↻</div>
	{/if}
</button>

<style>
	.tarot-card {
		position: relative;
		width: 120px;
		height: 200px;
		perspective: 1000px;
		cursor: pointer;
		background: none;
		padding: 0;
		transition: all var(--transition-base);
	}

	.tarot-card.selected.revealed {
		cursor: zoom-in;
	}

	.tarot-card.disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.card-inner {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Hover en cartas no seleccionadas: pequeño scale */
	.tarot-card:hover:not(.disabled):not(.selected) .card-inner {
		transform: scale(1.05);
	}

	/* Hover en cartas seleccionadas y reveladas: zoom grande */
	.tarot-card.selected.revealed:hover .card-inner {
		transform: rotateY(180deg) scale(1.3);
		z-index: 100;
	}

	.tarot-card.selected .card-inner {
		transform: scale(0.95);
	}

	.tarot-card.invertida .card-inner {
		transform: rotate(180deg);
	}

	/* Efecto flip cuando la carta está revelada */
	.tarot-card.revealed .card-inner {
		transform: rotateY(180deg);
	}

	.tarot-card.revealed.invertida .card-inner {
		transform: rotateY(180deg) rotate(180deg);
	}

	.card-back,
	.card-front {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.card-back {
		transform: rotateY(0deg);
	}

	.card-front {
		transform: rotateY(180deg);
	}

	.card-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.tarot-card.selected .card-back,
	.tarot-card.selected .card-front {
		box-shadow: 0 0 30px rgba(245, 158, 11, 0.6);
	}

	.invertida-badge {
		position: absolute;
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
		padding: var(--spacing-xs) var(--spacing-sm);
		background-color: var(--color-warning);
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-bg);
		box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
		z-index: 10;
	}

	@media (max-width: 768px) {
		.tarot-card {
			width: 90px;
			height: 150px;
		}

		.pattern-star {
			font-size: 2rem;
		}

		.pattern-moon {
			font-size: 1rem;
		}
	}
</style>
