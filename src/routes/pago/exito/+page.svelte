<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let redirigiendo = $state(false);

	onMount(() => {
		// Redirigir a la página de lectura después de 3 segundos
		setTimeout(() => {
			if (data.sesionId) {
				redirigiendo = true;
				window.location.href = `/lectura/${data.sesionId}`;
			}
		}, 3000);
	});
</script>

<svelte:head>
	<title>Pago Exitoso - Taroti</title>
</svelte:head>

<div class="resultado-pago">
	<div class="container">
		<div class="resultado-card exito fade-in">
			<div class="icono-resultado">✓</div>
			<h1>¡Pago Exitoso!</h1>
			<p class="mensaje">
				Tu pago ha sido procesado correctamente. Estamos generando tu lectura de tarot.
			</p>

			{#if data.paymentId}
				<div class="detalle-pago">
					<p class="detalle-label">ID de pago:</p>
					<p class="detalle-valor">{data.paymentId}</p>
				</div>
			{/if}

			{#if data.sesionId}
				<div class="detalle-pago">
					<p class="detalle-label">ID de sesión:</p>
					<p class="detalle-valor">{data.sesionId}</p>
				</div>
			{/if}

			<div class="acciones">
				{#if redirigiendo}
					<div class="redirigiendo">
						<div class="spinner"></div>
						<p>Redirigiendo a tu lectura...</p>
					</div>
				{:else}
					<p class="info-redireccion">Serás redirigido automáticamente en unos segundos...</p>
					{#if data.sesionId}
						<a href="/lectura/{data.sesionId}" class="btn-ver-lectura">
							Ver mi lectura ahora
						</a>
					{/if}
				{/if}
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

	.resultado-card.exito {
		border-color: var(--color-success);
		box-shadow: 0 0 40px rgba(16, 185, 129, 0.2);
	}

	.icono-resultado {
		width: 80px;
		height: 80px;
		margin: 0 auto var(--spacing-lg);
		background: linear-gradient(135deg, var(--color-success), #059669);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		color: white;
		font-weight: 700;
		animation: scaleIn 0.5s ease-out;
	}


	.resultado-card h1 {
		margin-bottom: var(--spacing-md);
		color: var(--color-success);
	}

	.mensaje {
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-xl);
		font-size: 1.1rem;
	}

	.detalle-pago {
		background-color: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		margin-bottom: var(--spacing-md);
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
		margin-top: var(--spacing-xl);
	}

	.redirigiendo {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
	}

	.redirigiendo p {
		color: var(--color-text-muted);
	}

	.info-redireccion {
		color: var(--color-text-dim);
		font-size: 0.9rem;
		margin-bottom: var(--spacing-md);
	}

	.btn-ver-lectura {
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

	.btn-ver-lectura:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
	}
</style>
