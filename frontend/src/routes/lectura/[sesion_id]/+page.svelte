<script lang="ts">
	import type { PageData } from './$types';
	import { formatearFecha } from '$lib/utils';

	let { data }: { data: PageData } = $props();
	const lectura = $derived(data.lectura);

	// Mapping de nombres de cartas del tarot
	const nombresCarta: Record<string, string> = {
		// Arcanos Mayores
		carta_0: 'El Loco',
		carta_1: 'El Mago',
		carta_2: 'La Sacerdotisa',
		carta_3: 'La Emperatriz',
		carta_4: 'El Emperador',
		carta_5: 'El Hierofante',
		carta_6: 'Los Enamorados',
		carta_7: 'El Carro',
		carta_8: 'La Fuerza',
		carta_9: 'El Ermitaño',
		carta_10: 'La Rueda de la Fortuna',
		carta_11: 'La Justicia',
		carta_12: 'El Colgado',
		carta_13: 'La Muerte',
		carta_14: 'La Templanza',
		carta_15: 'El Diablo',
		carta_16: 'La Torre',
		carta_17: 'La Estrella',
		carta_18: 'La Luna',
		carta_19: 'El Sol',
		carta_20: 'El Juicio',
		carta_21: 'El Mundo',
		// Arcanos Menores (simplificado)
		carta_22: 'As de Bastos',
		carta_23: 'Dos de Bastos',
		carta_24: 'Tres de Bastos',
		carta_25: 'Cuatro de Bastos',
		carta_26: 'Cinco de Bastos',
		carta_27: 'Seis de Bastos',
		carta_28: 'Siete de Bastos',
		carta_29: 'Ocho de Bastos',
		carta_30: 'Nueve de Bastos',
		carta_31: 'Diez de Bastos',
		carta_32: 'Sota de Bastos',
		carta_33: 'Caballero de Bastos',
		carta_34: 'Reina de Bastos',
		carta_35: 'Rey de Bastos',
		carta_36: 'As de Copas',
		carta_37: 'Dos de Copas',
		carta_38: 'Tres de Copas',
		carta_39: 'Cuatro de Copas',
		carta_40: 'Cinco de Copas',
		carta_41: 'Seis de Copas',
		carta_42: 'Siete de Copas',
		carta_43: 'Ocho de Copas',
		carta_44: 'Nueve de Copas',
		carta_45: 'Diez de Copas',
		carta_46: 'Sota de Copas',
		carta_47: 'Caballero de Copas',
		carta_48: 'Reina de Copas',
		carta_49: 'Rey de Copas',
		carta_50: 'As de Espadas',
		carta_51: 'Dos de Espadas',
		carta_52: 'Tres de Espadas',
		carta_53: 'Cuatro de Espadas',
		carta_54: 'Cinco de Espadas',
		carta_55: 'Seis de Espadas',
		carta_56: 'Siete de Espadas',
		carta_57: 'Ocho de Espadas',
		carta_58: 'Nueve de Espadas',
		carta_59: 'Diez de Espadas',
		carta_60: 'Sota de Espadas',
		carta_61: 'Caballero de Espadas',
		carta_62: 'Reina de Espadas',
		carta_63: 'Rey de Espadas',
		carta_64: 'As de Oros',
		carta_65: 'Dos de Oros',
		carta_66: 'Tres de Oros',
		carta_67: 'Cuatro de Oros',
		carta_68: 'Cinco de Oros',
		carta_69: 'Seis de Oros',
		carta_70: 'Siete de Oros',
		carta_71: 'Ocho de Oros',
		carta_72: 'Nueve de Oros',
		carta_73: 'Diez de Oros',
		carta_74: 'Sota de Oros',
		carta_75: 'Caballero de Oros',
		carta_76: 'Reina de Oros',
		carta_77: 'Rey de Oros'
	};

	function obtenerNombreCarta(arcano: string): string {
		return nombresCarta[arcano] || arcano;
	}

	function formatearAmbito(ambito: string): string {
		const ambitos: Record<string, string> = {
			amor: 'Amor',
			trabajo: 'Trabajo',
			dinero: 'Dinero',
			salud: 'Salud',
			espiritual: 'Espiritual',
			general: 'General'
		};
		return ambitos[ambito] || ambito;
	}

	function compartirLectura() {
		if (navigator.share) {
			navigator.share({
				title: 'Mi lectura de Tarot',
				text: `He recibido una lectura de tarot sobre: ${lectura.pregunta}`,
				url: window.location.href
			});
		} else {
			navigator.clipboard.writeText(window.location.href);
			alert('Enlace copiado al portapapeles');
		}
	}
</script>

<svelte:head>
	<title>Tu Lectura de Tarot - Taroti</title>
</svelte:head>

<div class="lectura-container">
	<div class="container">
		<!-- Encabezado de la lectura -->
		<div class="lectura-header fade-in">
			<h1>Tu Lectura de Tarot</h1>
			<div class="lectura-meta">
				<span class="meta-item">
					<span class="meta-icon">📅</span>
					{formatearFecha(lectura.creado_en)}
				</span>
				<span class="meta-item">
					<span class="meta-icon">🔮</span>
					{lectura.plan.nombre}
				</span>
				<span class="meta-item">
					<span class="meta-icon">✨</span>
					{formatearAmbito(lectura.ambito_detectado)}
				</span>
			</div>
		</div>

		<!-- Pregunta -->
		<div class="pregunta-card fade-in">
			<h2>Tu pregunta</h2>
			<p class="pregunta-texto">{lectura.pregunta}</p>
		</div>

		<!-- Cartas seleccionadas -->
		<div class="cartas-section fade-in">
			<h2>Las cartas te revelan</h2>
			<div class="cartas-grid" class:tres-cartas={lectura.cartas.length === 3}>
				{#each lectura.cartas as carta, i}
					<div class="carta-item" style="animation-delay: {i * 0.1}s">
						<div class="carta-visual" class:invertida={carta.invertida}>
							<div class="carta-pattern">
								<div class="pattern-circle"></div>
								<div class="pattern-star">✦</div>
								<div class="pattern-moon">☽</div>
							</div>
						</div>
						<div class="carta-info">
							<h3 class="carta-nombre">
								{obtenerNombreCarta(carta.arcano)}
								{#if carta.invertida}
									<span class="invertida-badge">↻</span>
								{/if}
							</h3>
							<p class="carta-posicion">Carta {carta.posicion + 1}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Interpretación -->
		<div class="interpretacion-section fade-in">
			<h2>Interpretación</h2>
			<div class="interpretacion-content">
				<div class="interpretacion-texto">
					{lectura.interpretacion}
				</div>
			</div>
		</div>

		<!-- Acciones -->
		<div class="acciones fade-in">
			<button class="btn-compartir" onclick={compartirLectura}>
				<span class="btn-icon">🔗</span>
				Compartir lectura
			</button>
			<a href="/" class="btn-nueva">
				<span class="btn-icon">🔮</span>
				Nueva consulta
			</a>
		</div>

		<!-- Advertencia de expiración -->
		{#if lectura.expira_en}
			<div class="expiracion-info">
				<p>
					Esta lectura estará disponible hasta el{' '}
					{formatearFecha(lectura.expira_en)}
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.lectura-container {
		min-height: calc(100vh - 200px);
		padding: var(--spacing-xl) 0;
	}

	.lectura-header {
		text-align: center;
		margin-bottom: var(--spacing-xl);
	}

	.lectura-header h1 {
		margin-bottom: var(--spacing-md);
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.lectura-meta {
		display: flex;
		justify-content: center;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
		color: var(--color-text-muted);
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.meta-icon {
		font-size: 1.2rem;
	}

	.pregunta-card {
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		margin-bottom: var(--spacing-xl);
	}

	.pregunta-card h2 {
		margin-bottom: var(--spacing-md);
		color: var(--color-primary);
		font-size: 1.5rem;
	}

	.pregunta-texto {
		font-size: 1.2rem;
		line-height: 1.6;
		color: var(--color-text);
	}

	.cartas-section {
		margin-bottom: var(--spacing-xl);
	}

	.cartas-section h2 {
		text-align: center;
		margin-bottom: var(--spacing-lg);
		color: var(--color-secondary);
		font-size: 1.8rem;
	}

	.cartas-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-xl);
	}

	.cartas-grid.tres-cartas {
		grid-template-columns: repeat(3, 1fr);
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	@media (max-width: 768px) {
		.cartas-grid.tres-cartas {
			grid-template-columns: 1fr;
		}
	}

	.carta-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		animation: slideUp 0.5s ease-out both;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.carta-visual {
		width: 120px;
		height: 180px;
		background: linear-gradient(135deg, #1a1433, #2d1b69);
		border: 2px solid var(--color-primary);
		border-radius: var(--radius-md);
		position: relative;
		overflow: hidden;
		box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
		transition: all var(--transition-base);
	}

	.carta-visual:hover {
		transform: translateY(-5px);
		box-shadow: 0 12px 32px rgba(139, 92, 246, 0.4);
	}

	.carta-visual.invertida {
		transform: rotate(180deg);
	}

	.carta-visual.invertida:hover {
		transform: rotate(180deg) translateY(-5px);
	}

	.carta-pattern {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pattern-circle {
		position: absolute;
		width: 60px;
		height: 60px;
		border: 2px solid var(--color-secondary);
		border-radius: 50%;
		opacity: 0.6;
	}

	.pattern-star {
		position: absolute;
		top: 20px;
		font-size: 1.5rem;
		color: var(--color-secondary);
		opacity: 0.8;
	}

	.pattern-moon {
		position: absolute;
		bottom: 20px;
		font-size: 1.5rem;
		color: var(--color-primary);
		opacity: 0.8;
	}

	.carta-info {
		text-align: center;
	}

	.carta-nombre {
		font-size: 1.1rem;
		margin-bottom: var(--spacing-xs);
		color: var(--color-text);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-xs);
	}

	.invertida-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: linear-gradient(135deg, var(--color-warning), #d97706);
		border-radius: 50%;
		font-size: 1rem;
		color: white;
	}

	.carta-posicion {
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.interpretacion-section {
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		margin-bottom: var(--spacing-xl);
	}

	.interpretacion-section h2 {
		margin-bottom: var(--spacing-lg);
		color: var(--color-primary);
		font-size: 1.8rem;
	}

	.interpretacion-content {
		position: relative;
	}

	.interpretacion-texto {
		font-size: 1.1rem;
		line-height: 1.8;
		color: var(--color-text);
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.acciones {
		display: flex;
		justify-content: center;
		gap: var(--spacing-md);
		flex-wrap: wrap;
		margin-bottom: var(--spacing-xl);
	}

	.btn-compartir,
	.btn-historial,
	.btn-nueva {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: var(--radius-lg);
		font-weight: 600;
		transition: all var(--transition-base);
		text-decoration: none;
	}

	.btn-compartir {
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
		color: var(--color-text);
		border: none;
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
		cursor: pointer;
	}

	.btn-compartir:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
	}

	.btn-historial {
		background-color: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
	}

	.btn-historial:hover {
		background-color: var(--color-bg-hover);
		border-color: var(--color-primary);
		color: var(--color-text);
	}

	.btn-nueva {
		background: linear-gradient(135deg, var(--color-secondary), #d97706);
		color: var(--color-bg);
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
	}

	.btn-nueva:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
	}

	.btn-icon {
		font-size: 1.2rem;
	}

	.expiracion-info {
		text-align: center;
		padding: var(--spacing-md);
		background-color: rgba(245, 158, 11, 0.1);
		border: 1px solid var(--color-warning);
		border-radius: var(--radius-md);
		color: var(--color-warning);
		font-size: 0.9rem;
	}

	.fade-in {
		animation: fadeIn 0.6s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
