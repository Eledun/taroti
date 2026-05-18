<script lang="ts">
	import type { PageData } from './$types';
	import { formatearFecha } from '$lib/utils';
	import { marked } from 'marked';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();
	const lectura = $derived(data.lectura);

	// Estado para mostrar/ocultar el consejo final
	let mostrarConsejo = $state(false);

	// Determinar layout de cartas según cantidad
	const layoutCartas = $derived(() => {
		const numCartas = lectura?.cartas?.length || 3;
		if (numCartas <= 3) return 'column'; // Columna vertical espaciada
		return 'grid'; // Grid compacto para 10+ cartas
	});

	// Configurar marked para mejor renderizado
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	// Separar la interpretación en contenido principal y consejo final
	const contenidoSeparado = $derived(() => {
		if (!lectura?.interpretacion) return { principal: '', consejo: '' };

		const texto = lectura.interpretacion;

		// Buscar sección de "Mensaje del Tarot", "Consejo Final", "Insights Accionables", etc.
		const patronesConsejo = [
			/## Mensaje del Tarot[\s\S]*/i,
			/## Consejo Final[\s\S]*/i,
			/## Consejos?[\s\S]*/i,
			/## Insights? Accionables?[\s\S]*/i,
			/## Reflexión Final[\s\S]*/i
		];

		let principal = texto;
		let consejo = '';

		for (const patron of patronesConsejo) {
			const match = texto.match(patron);
			if (match) {
				principal = texto.substring(0, match.index);
				consejo = match[0];
				break;
			}
		}

		return { principal, consejo };
	});

	// Convertir markdown a HTML
	const interpretacionHTML = $derived(() => {
		const contenido = contenidoSeparado();
		return {
			principal: marked.parse(contenido.principal) as string,
			consejo: marked.parse(contenido.consejo) as string
		};
	});

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
			<h1>El Tarot ha Contestado</h1>
		</div>

		<!-- Contenedor principal -->
		<div class="interpretacion-section fade-in">
			<h2>Interpretación</h2>

			<div class="lectura-layout">
				<!-- Sidebar con cartas sin contenedor -->
				<aside class="cartas-sidebar" class:grid-layout={layoutCartas() === 'grid'}>
					{#each lectura.cartas as carta, i}
						<div class="carta-item" style="animation-delay: {i * 0.15}s">
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
								</h3>
								{#if carta.invertida}
									<span class="carta-estado">Invertida</span>
								{/if}
							</div>
						</div>
					{/each}
				</aside>

				<!-- Interpretación -->
				<main class="interpretacion-main">
					<div class="interpretacion-content">
						<div class="interpretacion-texto">
							{@html interpretacionHTML().principal}
						</div>
					</div>
				</main>
			</div>
		</div>

		<!-- Botón para revelar el Consejo Final -->
		{#if interpretacionHTML().consejo && !mostrarConsejo}
			<div class="consejo-reveal-container fade-in">
				<button class="btn-revelar-consejo" onclick={() => mostrarConsejo = true}>
					<span class="btn-revelar-icon">✧</span>
					<span class="btn-revelar-texto">Conoce el Consejo Final</span>
					<span class="btn-revelar-icon">✧</span>
				</button>
			</div>
		{/if}

		<!-- Consejo Final desplegable -->
		{#if interpretacionHTML().consejo && mostrarConsejo}
			<div class="consejo-final consejo-animado">
				<div class="consejo-decoracion">✧ ☆ ✧</div>
				<div class="consejo-contenido">
					{@html interpretacionHTML().consejo}
				</div>
			</div>
		{/if}

		<!-- Acciones -->
		<div class="acciones fade-in">
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
		background:
			radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
			radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.06) 0%, transparent 50%),
			linear-gradient(180deg, rgba(26, 20, 51, 0.4) 0%, transparent 100%);
		position: relative;
		overflow: hidden;
	}

	.lectura-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image:
			radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.15), transparent),
			radial-gradient(2px 2px at 60% 70%, rgba(255, 255, 255, 0.1), transparent),
			radial-gradient(1px 1px at 50% 50%, rgba(139, 92, 246, 0.2), transparent),
			radial-gradient(1px 1px at 80% 10%, rgba(245, 158, 11, 0.15), transparent);
		background-size: 200px 200px, 300px 300px, 150px 150px, 250px 250px;
		background-position: 0 0, 40px 60px, 130px 270px, 70px 100px;
		pointer-events: none;
		opacity: 0.4;
	}

	.lectura-header {
		text-align: center;
		margin-bottom: var(--spacing-xxl);
		padding: var(--spacing-xl) 0;
		position: relative;
	}

	.lectura-header::before,
	.lectura-header::after {
		content: '✦';
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		font-size: 2rem;
		color: var(--color-secondary);
		opacity: 0.3;
		animation: twinkle 3s ease-in-out infinite;
	}

	.lectura-header::before {
		left: 10%;
	}

	.lectura-header::after {
		right: 10%;
		animation-delay: 1.5s;
	}

	@keyframes twinkle {
		0%, 100% { opacity: 0.3; transform: translateY(-50%) scale(1); }
		50% { opacity: 0.8; transform: translateY(-50%) scale(1.2); }
	}

	.lectura-header h1 {
		margin-bottom: var(--spacing-lg);
		font-size: 2.75rem;
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary), var(--color-primary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		background-size: 200% auto;
		letter-spacing: 0.05em;
		font-weight: 700;
		text-transform: uppercase;
		font-family: Georgia, serif;
		position: relative;
		animation: shimmer 8s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%, 100% { background-position: 0% center; }
		50% { background-position: 100% center; }
	}

	/* Layout de dos columnas dentro de interpretacion-section */
	.lectura-layout {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: var(--spacing-xl);
		align-items: start;
	}

	@media (max-width: 968px) {
		.lectura-layout {
			grid-template-columns: 1fr;
			gap: var(--spacing-lg);
		}
	}

	/* Sidebar de cartas sin contenedor */
	.cartas-sidebar {
		display: flex;
		flex-direction: column;
		gap: 8rem;
		position: sticky;
		top: var(--spacing-xl);
		align-self: start;
		padding-top: 2rem;
	}

	/* Layout en grid para tiradas con muchas cartas (10+) */
	.cartas-sidebar.grid-layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		max-height: none;
		overflow-y: visible;
		position: relative;
		top: 0;
	}

	/* Cartas más compactas en grid layout */
	.cartas-sidebar.grid-layout .carta-item {
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.cartas-sidebar.grid-layout .carta-visual {
		width: 100px;
		height: 150px;
		flex-shrink: 0;
	}

	.cartas-sidebar.grid-layout .carta-info {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.cartas-sidebar.grid-layout .carta-nombre {
		font-size: 0.9rem;
	}

	.cartas-sidebar.grid-layout .carta-estado {
		font-size: 0.75rem;
	}

	@media (max-width: 968px) {
		.cartas-sidebar {
			position: relative;
			top: 0;
			flex-direction: row;
			justify-content: center;
			flex-wrap: wrap;
			gap: var(--spacing-lg);
		}
	}

	.carta-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		animation: slideIn 0.6s ease-out both;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.carta-visual {
		width: 160px;
		height: 240px;
		background: linear-gradient(135deg, #1a1433, #2d1b69, #1a1433);
		border: 2px solid rgba(139, 92, 246, 0.5);
		border-radius: var(--radius-lg);
		position: relative;
		overflow: hidden;
		box-shadow:
			0 10px 30px rgba(139, 92, 246, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.carta-visual::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			45deg,
			transparent 30%,
			rgba(139, 92, 246, 0.15) 50%,
			transparent 70%
		);
		opacity: 0;
		transition: opacity 0.4s ease;
	}

	.carta-visual:hover {
		transform: translateY(-4px) scale(1.02);
		box-shadow:
			0 15px 40px rgba(139, 92, 246, 0.5),
			0 6px 16px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
		border-color: rgba(139, 92, 246, 0.7);
	}

	.carta-visual:hover::before {
		opacity: 1;
	}

	.carta-visual.invertida {
		transform: rotate(180deg);
	}

	.carta-visual.invertida:hover {
		transform: rotate(180deg) translateY(-4px) scale(1.02);
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
		width: 80px;
		height: 80px;
		border: 2px solid var(--color-secondary);
		border-radius: 50%;
		opacity: 0.6;
	}

	.pattern-star {
		position: absolute;
		top: 30px;
		font-size: 2rem;
		color: var(--color-secondary);
		opacity: 0.8;
	}

	.pattern-moon {
		position: absolute;
		bottom: 30px;
		font-size: 2rem;
		color: var(--color-primary);
		opacity: 0.8;
	}

	.carta-info {
		text-align: center;
		width: 100%;
	}

	.carta-nombre {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: var(--spacing-xs);
		font-family: Georgia, serif;
	}

	.carta-estado {
		display: inline-block;
		padding: var(--spacing-xs) var(--spacing-sm);
		background: linear-gradient(135deg, var(--color-warning), #d97706);
		color: white;
		font-size: 0.75rem;
		border-radius: var(--radius-md);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	/* Main de interpretación */
	.interpretacion-main {
		min-width: 0;
	}

	.lectura-meta {
		display: flex;
		justify-content: center;
		gap: var(--spacing-xl);
		flex-wrap: wrap;
		padding: var(--spacing-md);
		background: rgba(139, 92, 246, 0.05);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(10px);
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
		background: linear-gradient(
			135deg,
			rgba(139, 92, 246, 0.1) 0%,
			rgba(26, 20, 51, 0.3) 100%
		);
		backdrop-filter: blur(20px);
		border: 2px solid rgba(139, 92, 246, 0.25);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xxl);
		margin-bottom: var(--spacing-xxl);
		box-shadow:
			0 8px 32px rgba(139, 92, 246, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			0 0 40px rgba(139, 92, 246, 0.1);
		position: relative;
		overflow: hidden;
	}

	.pregunta-card::before {
		content: '';
		position: absolute;
		top: -2px;
		left: -2px;
		right: -2px;
		height: 4px;
		background: linear-gradient(
			90deg,
			transparent,
			var(--color-secondary),
			var(--color-primary),
			var(--color-secondary),
			transparent
		);
		opacity: 0.8;
		animation: borderFlow 3s linear infinite;
	}

	@keyframes borderFlow {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}

	.pregunta-card::after {
		content: '☽ ✦ ☾';
		position: absolute;
		top: var(--spacing-md);
		right: var(--spacing-lg);
		font-size: 1.2rem;
		color: var(--color-secondary);
		opacity: 0.25;
		letter-spacing: 0.5em;
	}

	.pregunta-card h2 {
		margin-bottom: var(--spacing-lg);
		color: var(--color-secondary);
		font-size: 1.375rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		font-family: Georgia, serif;
		position: relative;
		padding-left: var(--spacing-lg);
	}

	.pregunta-card h2::before {
		content: '✧';
		position: absolute;
		left: 0;
		color: var(--color-primary);
		font-size: 1.5rem;
	}

	.pregunta-texto {
		font-size: 1.3rem;
		line-height: 1.8;
		color: var(--color-text);
		font-weight: 400;
		font-style: italic;
		text-align: center;
		padding: var(--spacing-md) 0;
	}

	.cartas-section {
		margin-bottom: var(--spacing-xl);
	}

	.cartas-section h2 {
		text-align: center;
		margin-bottom: var(--spacing-xl);
		color: var(--color-secondary);
		font-size: 1.875rem;
		font-family: Georgia, serif;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		font-weight: 600;
		position: relative;
		padding-bottom: var(--spacing-md);
	}

	.cartas-section h2::before {
		content: '✦';
		margin-right: var(--spacing-sm);
		color: var(--color-primary);
		opacity: 0.6;
	}

	.cartas-section h2::after {
		content: '✦';
		margin-left: var(--spacing-sm);
		color: var(--color-primary);
		opacity: 0.6;
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
		width: 140px;
		height: 210px;
		background: linear-gradient(135deg, #1a1433, #2d1b69, #1a1433);
		border: 2px solid rgba(139, 92, 246, 0.4);
		border-radius: var(--radius-lg);
		position: relative;
		overflow: hidden;
		box-shadow:
			0 10px 30px rgba(139, 92, 246, 0.3),
			0 4px 12px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.carta-visual::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			45deg,
			transparent 30%,
			rgba(139, 92, 246, 0.1) 50%,
			transparent 70%
		);
		opacity: 0;
		transition: opacity 0.4s ease;
	}

	.carta-visual:hover {
		transform: translateY(-8px) scale(1.02);
		box-shadow:
			0 20px 40px rgba(139, 92, 246, 0.4),
			0 8px 16px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
		border-color: rgba(139, 92, 246, 0.6);
	}

	.carta-visual:hover::before {
		opacity: 1;
	}

	.carta-visual.invertida {
		transform: rotate(180deg);
	}

	.carta-visual.invertida:hover {
		transform: rotate(180deg) translateY(-8px) scale(1.02);
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
		background: linear-gradient(
			135deg,
			rgba(26, 20, 51, 0.5) 0%,
			rgba(139, 92, 246, 0.08) 50%,
			rgba(26, 20, 51, 0.5) 100%
		);
		backdrop-filter: blur(25px);
		border: 2px solid rgba(139, 92, 246, 0.2);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xxl) var(--spacing-xxl) 3rem;
		margin-bottom: var(--spacing-xxl);
		box-shadow:
			0 12px 48px rgba(139, 92, 246, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			0 0 60px rgba(139, 92, 246, 0.08);
		position: relative;
	}

	.interpretacion-section::before {
		content: '✧ ☆ ✧';
		position: absolute;
		top: var(--spacing-lg);
		left: 50%;
		transform: translateX(-50%);
		font-size: 1.5rem;
		color: var(--color-secondary);
		opacity: 0.3;
		letter-spacing: 1em;
	}

	.interpretacion-section::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 20%;
		right: 20%;
		height: 4px;
		background: linear-gradient(
			90deg,
			transparent,
			var(--color-primary),
			var(--color-secondary),
			var(--color-primary),
			transparent
		);
		opacity: 0.6;
		border-radius: 2px;
	}

	.interpretacion-section h2 {
		margin-bottom: var(--spacing-xl);
		margin-top: var(--spacing-lg);
		color: var(--color-secondary);
		font-size: 2.125rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-align: center;
		text-transform: uppercase;
		font-family: Georgia, serif;
		position: relative;
		padding-bottom: var(--spacing-md);
	}

	.interpretacion-section h2::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 80px;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			var(--color-primary),
			transparent
		);
	}

	.interpretacion-content {
		position: relative;
	}

	.interpretacion-texto {
		font-size: 1.125rem;
		line-height: 2;
		color: var(--color-text);
		max-width: 75ch;
		margin: 0 auto;
		position: relative;
	}

	.interpretacion-texto::first-letter {
		font-size: 3.5rem;
		line-height: 1;
		float: left;
		margin: 0 var(--spacing-sm) 0 0;
		color: var(--color-secondary);
		font-family: Georgia, serif;
	}

	/* Estilos para el contenido Markdown renderizado */
	.interpretacion-texto :global(h1),
	.interpretacion-texto :global(h2),
	.interpretacion-texto :global(h3) {
		margin-top: var(--spacing-xl);
		margin-bottom: var(--spacing-md);
		color: var(--color-secondary);
		font-weight: 700;
		letter-spacing: -0.015em;
	}

	.interpretacion-texto :global(h1) {
		font-size: 2rem;
		background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.interpretacion-texto :global(h2) {
		font-size: 1.625rem;
		position: relative;
		padding-bottom: var(--spacing-sm);
		padding-left: var(--spacing-lg);
		margin-top: 2.5rem;
	}

	.interpretacion-texto :global(h2)::before {
		content: '✦';
		position: absolute;
		left: 0;
		top: 0.1em;
		color: var(--color-primary);
		font-size: 1.2em;
		opacity: 0.7;
	}

	.interpretacion-texto :global(h2)::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 60px;
		height: 3px;
		background: linear-gradient(90deg, var(--color-secondary), transparent);
		border-radius: 2px;
	}

	.interpretacion-texto :global(h3) {
		font-size: 1.375rem;
		color: var(--color-primary);
	}

	.interpretacion-texto :global(p) {
		margin-bottom: var(--spacing-md);
		line-height: 1.8;
	}

	.interpretacion-texto :global(strong) {
		color: var(--color-primary);
		font-weight: 700;
	}

	.interpretacion-texto :global(em) {
		color: var(--color-secondary);
		font-style: italic;
	}

	.interpretacion-texto :global(ul),
	.interpretacion-texto :global(ol) {
		margin-left: 0;
		margin-bottom: var(--spacing-lg);
		list-style: none;
		padding-left: var(--spacing-xl);
	}

	.interpretacion-texto :global(ul li) {
		margin-bottom: var(--spacing-md);
		line-height: 1.8;
		position: relative;
		padding-left: var(--spacing-md);
	}

	.interpretacion-texto :global(ul li)::before {
		content: '✦';
		position: absolute;
		left: 0;
		color: var(--color-secondary);
		font-size: 0.8em;
		opacity: 0.7;
	}

	.interpretacion-texto :global(ol li) {
		margin-bottom: var(--spacing-md);
		line-height: 1.8;
		counter-increment: item;
		position: relative;
		padding-left: var(--spacing-lg);
	}

	.interpretacion-texto :global(ol) {
		counter-reset: item;
	}

	.interpretacion-texto :global(ol li)::before {
		content: counter(item) '.';
		position: absolute;
		left: 0;
		color: var(--color-secondary);
		font-weight: 700;
	}

	.interpretacion-texto :global(blockquote) {
		border-left: 3px solid var(--color-secondary);
		border-right: 3px solid var(--color-secondary);
		padding: var(--spacing-lg) var(--spacing-xl);
		margin: var(--spacing-xl) auto;
		background: linear-gradient(
			90deg,
			rgba(245, 158, 11, 0.05),
			rgba(139, 92, 246, 0.05),
			rgba(245, 158, 11, 0.05)
		);
		border-radius: var(--radius-md);
		font-style: italic;
		color: var(--color-text);
		font-size: 1.125rem;
		position: relative;
		text-align: center;
		max-width: 65ch;
		box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1);
	}

	.interpretacion-texto :global(blockquote)::before {
		content: '✧';
		position: absolute;
		left: 50%;
		top: -12px;
		transform: translateX(-50%);
		font-size: 1.5rem;
		color: var(--color-secondary);
		opacity: 0.8;
		background: var(--color-bg);
		padding: 0 var(--spacing-sm);
	}

	.interpretacion-texto :global(blockquote)::after {
		content: '✧';
		position: absolute;
		left: 50%;
		bottom: -12px;
		transform: translateX(-50%);
		font-size: 1.5rem;
		color: var(--color-secondary);
		opacity: 0.8;
		background: var(--color-bg);
		padding: 0 var(--spacing-sm);
	}

	.interpretacion-texto :global(code) {
		background-color: rgba(139, 92, 246, 0.1);
		padding: 2px 6px;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.95em;
	}

	/* Botón para revelar el Consejo Final */
	.consejo-reveal-container {
		margin-top: var(--spacing-xxl);
		margin-bottom: var(--spacing-xxl);
		text-align: center;
		padding: var(--spacing-xl) 0;
	}

	.btn-revelar-consejo {
		position: relative;
		padding: 1.5rem 3rem;
		background: linear-gradient(
			135deg,
			rgba(16, 12, 41, 0.9),
			rgba(45, 27, 105, 0.8),
			rgba(16, 12, 41, 0.9)
		);
		border: 2px solid rgba(218, 165, 32, 0.5);
		border-radius: 50px;
		color: #FFD700;
		font-size: 1.5rem;
		font-family: 'Cinzel', Georgia, serif;
		font-weight: 600;
		letter-spacing: 0.08em;
		cursor: pointer;
		overflow: hidden;
		box-shadow:
			0 10px 40px rgba(218, 165, 32, 0.3),
			0 0 60px rgba(139, 92, 246, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		text-transform: uppercase;
		backdrop-filter: blur(20px);
	}

	.btn-revelar-consejo::before {
		content: '';
		position: absolute;
		inset: -2px;
		background: linear-gradient(
			45deg,
			transparent,
			rgba(218, 165, 32, 0.4),
			transparent
		);
		transform: translateX(-100%);
		transition: transform 0.6s ease;
	}

	.btn-revelar-consejo:hover::before {
		transform: translateX(100%);
	}

	.btn-revelar-consejo:hover {
		transform: translateY(-4px) scale(1.05);
		border-color: rgba(255, 215, 0, 0.8);
		box-shadow:
			0 15px 50px rgba(218, 165, 32, 0.5),
			0 0 80px rgba(255, 215, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
		text-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
	}

	.btn-revelar-consejo:active {
		transform: translateY(-2px) scale(1.02);
	}

	.btn-revelar-texto {
		position: relative;
		z-index: 1;
		display: inline-block;
		margin: 0 var(--spacing-sm);
	}

	.btn-revelar-icon {
		display: inline-block;
		font-size: 1.8rem;
		animation: pulseIcon 2s ease-in-out infinite;
		filter: drop-shadow(0 0 10px rgba(218, 165, 32, 0.6));
	}

	.btn-revelar-consejo:hover .btn-revelar-icon {
		animation: rotateIcon 1s ease-in-out infinite;
	}

	@keyframes pulseIcon {
		0%, 100% {
			opacity: 0.7;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
		}
	}

	@keyframes rotateIcon {
		0%, 100% {
			transform: rotate(0deg) scale(1);
		}
		25% {
			transform: rotate(-15deg) scale(1.2);
		}
		75% {
			transform: rotate(15deg) scale(1.2);
		}
	}

	/* Consejo Final - Contenedor especial mejorado */
	.consejo-final {
		margin-top: var(--spacing-xxl);
		margin-bottom: calc(var(--spacing-xxl) * 1.5);
		padding: 3rem 2.5rem;
		background: linear-gradient(
			165deg,
			rgba(16, 12, 41, 0.95) 0%,
			rgba(45, 27, 105, 0.85) 30%,
			rgba(75, 40, 130, 0.75) 60%,
			rgba(45, 27, 105, 0.85) 100%
		);
		backdrop-filter: blur(30px);
		border: 2px solid rgba(218, 165, 32, 0.4);
		border-radius: 24px;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.5),
			0 0 100px rgba(218, 165, 32, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			inset 0 -1px 0 rgba(218, 165, 32, 0.3);
		position: relative;
		overflow: hidden;
	}

	/* Animación mística para revelar el consejo */
	.consejo-animado {
		animation: revelarMistico 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		transform-origin: center top;
	}

	@keyframes revelarMistico {
		0% {
			opacity: 0;
			transform: translateY(-40px) scale(0.9);
			filter: blur(10px);
		}
		40% {
			opacity: 0.6;
			filter: blur(5px);
		}
		70% {
			transform: translateY(5px) scale(1.02);
		}
		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
			filter: blur(0);
		}
	}

	.consejo-final::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background:
			radial-gradient(circle at 20% 30%, rgba(218, 165, 32, 0.15), transparent 40%),
			radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.15), transparent 40%);
		pointer-events: none;
		animation: etherealGlow 8s ease-in-out infinite;
	}

	@keyframes etherealGlow {
		0%, 100% { opacity: 0.6; }
		50% { opacity: 1; }
	}

	.consejo-final::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 24px;
		padding: 2px;
		background: linear-gradient(
			135deg,
			rgba(218, 165, 32, 0.6),
			transparent 20%,
			transparent 80%,
			rgba(139, 92, 246, 0.6)
		);
		-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		pointer-events: none;
		animation: rotateBorder 10s linear infinite;
	}

	@keyframes rotateBorder {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.consejo-decoracion {
		text-align: center;
		font-size: 2.5rem;
		background: linear-gradient(90deg,
			rgba(218, 165, 32, 0.8),
			rgba(255, 215, 0, 1),
			rgba(218, 165, 32, 0.8)
		);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: var(--spacing-xl);
		letter-spacing: 2em;
		text-indent: 2em;
		filter: drop-shadow(0 0 15px rgba(218, 165, 32, 0.6));
		animation: twinkleStars 4s ease-in-out infinite;
	}

	@keyframes twinkleStars {
		0%, 100% {
			opacity: 0.7;
			transform: scale(1);
			filter: drop-shadow(0 0 15px rgba(218, 165, 32, 0.6));
		}
		50% {
			opacity: 1;
			transform: scale(1.15);
			filter: drop-shadow(0 0 25px rgba(255, 215, 0, 0.9));
		}
	}

	.consejo-contenido {
		position: relative;
		z-index: 1;
	}

	.consejo-contenido :global(h2) {
		text-align: center;
		font-size: 2.5rem;
		font-family: 'Cinzel', Georgia, serif;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		background: linear-gradient(
			135deg,
			#DAA520 0%,
			#FFD700 25%,
			#FFF8DC 50%,
			#FFD700 75%,
			#DAA520 100%
		);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		background-size: 200% auto;
		animation: goldenShimmer 4s linear infinite;
		margin-bottom: var(--spacing-xl);
		text-shadow: 0 0 30px rgba(218, 165, 32, 0.5);
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
		line-height: 1.3;
	}

	@keyframes goldenShimmer {
		0% { background-position: 0% center; }
		100% { background-position: 200% center; }
	}

	.consejo-contenido :global(p) {
		font-size: 1.25rem;
		line-height: 2;
		text-align: center;
		max-width: 65ch;
		margin: 0 auto var(--spacing-xl);
		color: rgba(255, 255, 255, 0.95);
		font-family: 'Spectral', Georgia, serif;
		font-weight: 400;
		letter-spacing: 0.02em;
	}

	.consejo-contenido :global(strong) {
		color: #FFD700;
		font-weight: 700;
		text-shadow:
			0 0 10px rgba(255, 215, 0, 0.4),
			0 0 20px rgba(218, 165, 32, 0.3);
		font-style: normal;
	}

	.consejo-contenido :global(em) {
		color: #E6B800;
		font-style: italic;
		font-family: 'Spectral', Georgia, serif;
	}

	.consejo-contenido :global(ul),
	.consejo-contenido :global(ol) {
		max-width: 60ch;
		margin: 0 auto var(--spacing-xl);
		list-style: none;
		padding-left: 0;
		text-align: left;
	}

	.consejo-contenido :global(li) {
		margin-bottom: var(--spacing-lg);
		padding-left: 2.5rem;
		position: relative;
		font-size: 1.2rem;
		line-height: 1.9;
		color: rgba(255, 255, 255, 0.9);
		font-family: 'Spectral', Georgia, serif;
	}

	.consejo-contenido :global(ul li)::before {
		content: '✦';
		position: absolute;
		left: 0.5rem;
		color: #DAA520;
		font-size: 1.5em;
		filter: drop-shadow(0 0 8px rgba(218, 165, 32, 0.6));
		animation: sparkle 3s ease-in-out infinite;
	}

	.consejo-contenido :global(ul li):nth-child(1)::before { animation-delay: 0s; }
	.consejo-contenido :global(ul li):nth-child(2)::before { animation-delay: 0.5s; }
	.consejo-contenido :global(ul li):nth-child(3)::before { animation-delay: 1s; }
	.consejo-contenido :global(ul li):nth-child(4)::before { animation-delay: 1.5s; }

	@keyframes sparkle {
		0%, 100% { opacity: 0.7; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.2); }
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
		color: white;
		border: none;
		box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
		cursor: pointer;
		position: relative;
		overflow: hidden;
	}

	.btn-compartir::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.2),
			transparent
		);
		transition: left 0.5s ease;
	}

	.btn-compartir:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 24px rgba(139, 92, 246, 0.5);
	}

	.btn-compartir:hover::before {
		left: 100%;
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
		color: white;
		box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
		position: relative;
		overflow: hidden;
	}

	.btn-nueva::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.2),
			transparent
		);
		transition: left 0.5s ease;
	}

	.btn-nueva:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 24px rgba(245, 158, 11, 0.5);
	}

	.btn-nueva:hover::before {
		left: 100%;
	}

	.btn-icon {
		font-size: 1.2rem;
	}

	.expiracion-info {
		text-align: center;
		padding: var(--spacing-lg);
		background: linear-gradient(
			135deg,
			rgba(245, 158, 11, 0.1),
			rgba(245, 158, 11, 0.05)
		);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: var(--radius-lg);
		color: var(--color-warning);
		font-size: 0.95rem;
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
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
