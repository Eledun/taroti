<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="container">
		<div class="footer-content">
			<div class="social-links">
				<a href="#" aria-label="Instagram" title="Instagram">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
					</svg>
				</a>
				<a href="https://www.youtube.com/@cosmosen30/shorts" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
						<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
					</svg>
				</a>
			</div>
			<p class="footer-text"><em>Lecturas de tarot que revelan tu camino</em></p>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: linear-gradient(
			to bottom,
			rgba(192, 192, 192, 0.15) 0%,
			rgba(169, 169, 169, 0.12) 50%,
			rgba(128, 128, 128, 0.1) 100%
		);
		backdrop-filter: blur(8px);
		border-top: 1px solid rgba(192, 192, 192, 0.25);
		margin-top: 0;
		padding: clamp(1.5rem, 3vh, 2rem) 0 var(--spacing-sm);
		position: relative;
		overflow: hidden;
		z-index: 2;
	}

	.footer .container {
		max-width: 900px;
	}

	.footer::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg,
			transparent,
			var(--color-primary),
			var(--color-secondary),
			transparent);
		opacity: 0.6;
	}

	.footer-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
	}

	.footer-text {
		color: var(--color-text-muted);
		font-size: 0.95rem;
		text-align: center;
	}

	.social-links {
		display: flex;
		gap: var(--spacing-lg);
		justify-content: center;
	}

	.social-links a {
		color: var(--color-text-muted);
		transition: all var(--transition-base);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 50px;
		height: 50px;
		border-radius: var(--radius-lg);
		background: rgba(224, 122, 60, 0.15);
		border: 2px solid rgba(224, 122, 60, 0.3);
	}

	.social-links a:hover {
		color: var(--color-primary-light);
		transform: translateY(-6px) scale(1.1);
		background: rgba(224, 122, 60, 0.25);
		border-color: var(--color-primary);
		box-shadow: 0 10px 25px rgba(224, 122, 60, 0.4);
	}


</style>
