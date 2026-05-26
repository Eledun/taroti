<script lang="ts">
	import { page } from '$app/stores';

	let showMobileMenu = $state(false);
	const currentPath = $derived($page.url.pathname);

	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}
</script>

<header class="header">
	<div class="container">
		<nav class="nav">
			<a href="/" class="logo">
				<span class="logo-icon">🔮</span>
				<span class="logo-text">Taroti</span>
			</a>

			<button class="mobile-menu-button" onclick={toggleMobileMenu} aria-label="Toggle menu">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					{#if showMobileMenu}
						<path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
					{:else}
						<path d="M3 12h18M3 6h18M3 18h18" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
					{/if}
				</svg>
			</button>

			<div class="nav-links" class:show={showMobileMenu}>
				<a href="/" class:active={currentPath === '/'} onclick={() => showMobileMenu = false}>
					Inicio
				</a>
			</div>
		</nav>
	</div>
</header>

<style>
	.header {
		background: linear-gradient(180deg, var(--color-bg-card) 0%, transparent 100%);
		backdrop-filter: blur(10px);
		position: sticky;
		top: 0;
		z-index: 100;
		border-bottom: 1px solid var(--color-border);
	}

	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md) 0;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-family: var(--font-primary);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
		text-decoration: none;
		transition: transform var(--transition-base);
	}

	.logo:hover {
		transform: scale(1.05);
	}

	.logo-icon {
		font-size: 2rem;
		filter: drop-shadow(0 0 10px var(--color-primary));
	}

	.mobile-menu-button {
		display: none;
		background: none;
		color: var(--color-text);
		padding: var(--spacing-xs);
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.nav-links a {
		color: var(--color-text-muted);
		font-weight: 500;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
	}

	.nav-links a:hover,
	.nav-links a.active {
		color: var(--color-text);
		background-color: var(--color-bg-hover);
	}

	.user-menu {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		background-color: var(--color-bg-hover);
		border-radius: var(--radius-lg);
	}

	.user-avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--color-primary);
	}

	.user-name {
		color: var(--color-text);
		font-weight: 500;
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.btn-logout {
		padding: var(--spacing-xs) var(--spacing-sm);
		background-color: transparent;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		border-radius: var(--radius-md);
	}

	.btn-logout:hover {
		background-color: var(--color-error);
		color: var(--color-text);
	}

	.btn-login {
		padding: var(--spacing-sm) var(--spacing-lg);
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
		color: var(--color-text);
		font-weight: 600;
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
	}

	.btn-login:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
	}

	@media (max-width: 768px) {
		.mobile-menu-button {
			display: block;
		}

		.nav-links {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			flex-direction: column;
			background-color: var(--color-bg-card);
			border-bottom: 1px solid var(--color-border);
			padding: var(--spacing-md);
			gap: var(--spacing-sm);
			transform: translateY(-100%);
			opacity: 0;
			pointer-events: none;
			transition: all var(--transition-base);
		}

		.nav-links.show {
			transform: translateY(0);
			opacity: 1;
			pointer-events: all;
		}

		.nav-links a,
		.user-menu,
		.btn-login {
			width: 100%;
			justify-content: center;
		}

		.user-menu {
			flex-direction: column;
			padding: var(--spacing-md);
		}

		.user-name {
			max-width: none;
		}
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		max-width: 500px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(50px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-close {
		position: absolute;
		top: var(--spacing-md);
		right: var(--spacing-md);
		background: none;
		color: var(--color-text-muted);
		font-size: 1.5rem;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		padding: 0;
	}

	.modal-close:hover {
		background-color: var(--color-bg-hover);
		color: var(--color-text);
	}

	.modal-header {
		text-align: center;
		margin-bottom: var(--spacing-xl);
	}

	.modal-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: var(--spacing-md);
		filter: drop-shadow(0 0 20px var(--color-primary));
	}

	.modal-header h2 {
		margin-bottom: var(--spacing-sm);
	}

	.modal-description {
		color: var(--color-text-muted);
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.modal-body {
		margin-bottom: var(--spacing-lg);
	}

	.modal-footer {
		text-align: center;
		padding-top: var(--spacing-lg);
		border-top: 1px solid var(--color-border);
	}

	.privacy-note {
		color: var(--color-text-dim);
		font-size: 0.75rem;
		margin: 0;
	}
</style>
