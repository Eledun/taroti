import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verificarPago } from '$lib/db.js';

/**
 * Endpoint para verificar si un pago ha sido confirmado
 * Retorna { pagado: boolean, payment_id?: string }
 *
 * REFACTORIZADO v2.3.0: Usa MariaDB en lugar de /tmp
 */
export const GET: RequestHandler = async ({ params }) => {
	const { sesion_id } = params;

	if (!sesion_id) {
		throw error(400, 'Falta parámetro: sesion_id');
	}

	try {
		// Verificar pago en MariaDB
		const resultado = await verificarPago(sesion_id);

		console.log('[VERIFICAR_PAGO] Resultado para sesión:', sesion_id, resultado);

		return json(resultado);
	} catch (err) {
		console.error('[VERIFICAR_PAGO] Error:', err);
		throw error(500, 'Error al verificar estado del pago');
	}
};
