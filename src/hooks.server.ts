import type { Handle } from '@sveltejs/kit';

/**
 * Hook del servidor de SvelteKit
 * Configura Content Security Policy (CSP) para permitir Mercado Pago
 */
export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Configurar CSP para permitir scripts de Mercado Pago y GSAP
	const cspDirectives = [
		"default-src 'self'",
		// Permitir scripts de Mercado Pago, GSAP y propios
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.mercadopago.com https://*.mlstatic.com https://*.mercadopago.com https://cdnjs.cloudflare.com",
		// Permitir estilos de Mercado Pago y Google Fonts
		"style-src 'self' 'unsafe-inline' https://sdk.mercadopago.com https://*.mlstatic.com https://*.mercadopago.com https://fonts.googleapis.com",
		// Permitir imágenes de Mercado Pago
		"img-src 'self' data: https: https://*.mlstatic.com https://*.mercadopago.com",
		// Permitir fuentes de Mercado Pago y Google Fonts
		"font-src 'self' data: https://*.mlstatic.com https://*.mercadopago.com https://fonts.gstatic.com",
		// Permitir conexiones a Mercado Pago API
		"connect-src 'self' https://api.mercadopago.com https://*.mercadopago.com https://sdk.mercadopago.com",
		// Permitir iframes de Mercado Pago
		"frame-src 'self' https://www.mercadopago.com https://*.mercadopago.com",
		// Base URI
		"base-uri 'self'",
		// Form actions
		"form-action 'self' https://www.mercadopago.com https://*.mercadopago.com"
	];

	response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

	// Otras cabeceras de seguridad
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	return response;
};
