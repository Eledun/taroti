<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const mensaje = 'El pago no pudo ser procesado. Por favor, intenta nuevamente.';
</script>

<svelte:head>
	<title>Error en el Pago - Taroti</title>
</svelte:head>

<div class="resultado-pago">
	<div class="container">
		<div class="resultado-card error fade-in">
			<div class="icono-resultado">✕</div>
			<h1>Pago no completado</h1>
			<p class="mensaje">
				{mensaje}
			</p>

			<div class="info-box">
				<h3>¿Qué puedes hacer?</h3>
				<ul>
					<li>Verifica que tu método de pago tenga fondos suficientes</li>
					<li>Intenta con un método de pago diferente</li>
					<li>Contacta con tu banco si el problema persiste</li>
				</ul>
			</div>

			{#if data.sesionId}
				<div class="detalle-pago">
					<p class="detalle-label">ID de sesión:</p>
					<p class="detalle-valor">{data.sesionId}</p>
				</div>
			{/if}

			{#if data.paymentId}
				<div class="detalle-pago">
					<p class="detalle-label">ID de pago:</p>
					<p class="detalle-valor">{data.paymentId}</p>
				</div>
			{/if}

			<div class="acciones">
				{#if data.sesionId}
					<a href="/consulta/{data.sesionId}" class="btn-reintentar">
						Reintentar pago
					</a>
				{/if}
				<a href="/" class="btn-inicio">
					Volver al inicio
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.resultado-pago {
		min-height: calc(100vh - 200px);
		display: flex;
		align-items: center;
		padding: var(--spacing-xl) 0;
	}

	.resultado-card {
		max-width: 600px;
		margin: 0 auto;
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		text-align: center;
	}

	.resultado-card.error {
		border-color: var(--color-error);
		box-shadow: 0 0 40px rgba(239, 68, 68, 0.2);
	}

	.icono-resultado {
		width: 80px;
		height: 80px;
		margin: 0 auto var(--spacing-lg);
		background: linear-gradient(135deg, var(--color-error), #dc2626);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		color: white;
		font-weight: 700;
		animation: scaleIn 0.5s ease-out;
	}

	@keyframes scaleIn {
		from {
			transform: scale(0);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.resultado-card h1 {
		margin-bottom: var(--spacing-md);
		color: var(--color-error);
	}

	.mensaje {
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-xl);
		font-size: 1.1rem;
	}

	.info-box {
		background-color: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-xl);
		text-align: left;
	}

	.info-box h3 {
		margin-bottom: var(--spacing-md);
		color: var(--color-text);
	}

	.info-box ul {
		margin: 0;
		padding-left: var(--spacing-lg);
		color: var(--color-text-muted);
	}

	.info-box li {
		margin-bottom: var(--spacing-sm);
	}

	.detalle-pago {
		background-color: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.detalle-label {
		color: var(--color-text-muted);
		font-size: 0.875rem;
		margin-bottom: var(--spacing-xs);
	}

	.detalle-valor {
		color: var(--color-text);
		font-family: monospace;
		font-size: 0.9rem;
		word-break: break-all;
	}

	.acciones {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		margin-top: var(--spacing-xl);
	}

	.btn-reintentar {
		display: inline-block;
		padding: var(--spacing-md) var(--spacing-xl);
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
		color: var(--color-text);
		font-weight: 600;
		font-size: 1.1rem;
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
		transition: all var(--transition-base);
	}

	.btn-reintentar:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
	}

	.btn-inicio {
		display: inline-block;
		padding: var(--spacing-sm) var(--spacing-lg);
		background-color: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-weight: 500;
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
	}

	.btn-inicio:hover {
		background-color: var(--color-bg-hover);
		border-color: var(--color-primary);
		color: var(--color-text);
	}
</style>
