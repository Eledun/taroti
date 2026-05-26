import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { obtenerPago, registrarAuditLog } from '$lib/db.js';

/**
 * POST /api/pagos/verificar
 * Verifica el estado de un pago por sesion_id
 *
 * Body:
 * - sesion_id: ID de sesión único
 *
 * Response:
 * - pagado: boolean
 * - pago: objeto completo del pago (si existe)
 * - mensaje: string descriptivo
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { sesion_id } = body;

		if (!sesion_id) {
			throw error(400, 'Falta parámetro: sesion_id');
		}

		// Obtener pago de BD
		const pago = await obtenerPago(sesion_id);

		if (!pago) {
			return json({
				pagado: false,
				pago: null,
				mensaje: 'No se encontró información de pago para esta sesión'
			});
		}

		// Verificar si está aprobado y acreditado
		const pagado = pago.estado_mp === 'approved' && pago.estado_detalle_mp === 'accredited';

		// Registrar verificación en audit log
		try {
			await registrarAuditLog('pago_verificado', sesion_id, {
				pagado,
				estado_mp: pago.estado_mp,
				estado_detalle_mp: pago.estado_detalle_mp,
				payment_id_mp: pago.payment_id_mp
			});
		} catch (auditErr) {
			console.error('[VERIFICAR] Error registrando audit:', auditErr);
		}

		// Construir respuesta
		const response = {
			pagado,
			pago: {
				sesion_id: pago.sesion_id,
				preference_id: pago.preference_id,
				payment_id_mp: pago.payment_id_mp,
				estado_mp: pago.estado_mp,
				estado_detalle_mp: pago.estado_detalle_mp,
				plan_nombre: pago.plan_nombre,
				monto_clp: pago.monto_clp,
				tipo_pago: pago.tipo_pago,
				metodo_pago: pago.metodo_pago,
				fecha_pago: pago.fecha_pago,
				fecha_creacion: pago.fecha_creacion
			},
			mensaje: pagado
				? 'Pago aprobado y acreditado'
				: `Pago en estado: ${pago.estado_mp} (${pago.estado_detalle_mp})`
		};

		console.log('[VERIFICAR] Sesión:', sesion_id, '| Pagado:', pagado);

		return json(response);

	} catch (err) {
		console.error('[VERIFICAR] Error:', err);

		// Si ya es un error de SvelteKit, re-lanzarlo
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, 'Error al verificar estado del pago');
	}
};

/**
 * GET /api/pagos/verificar?sesion_id=xxx
 * Alternativa con query param
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const sesion_id = url.searchParams.get('sesion_id');

		if (!sesion_id) {
			throw error(400, 'Falta parámetro: sesion_id');
		}

		// Obtener pago de BD
		const pago = await obtenerPago(sesion_id);

		if (!pago) {
			return json({
				pagado: false,
				pago: null,
				mensaje: 'No se encontró información de pago para esta sesión'
			});
		}

		// Verificar si está aprobado y acreditado
		const pagado = pago.estado_mp === 'approved' && pago.estado_detalle_mp === 'accredited';

		// Registrar verificación en audit log
		try {
			await registrarAuditLog('pago_verificado', sesion_id, {
				pagado,
				estado_mp: pago.estado_mp,
				metodo: 'GET'
			});
		} catch (auditErr) {
			console.error('[VERIFICAR] Error registrando audit:', auditErr);
		}

		// Construir respuesta
		const response = {
			pagado,
			pago: {
				sesion_id: pago.sesion_id,
				preference_id: pago.preference_id,
				payment_id_mp: pago.payment_id_mp,
				estado_mp: pago.estado_mp,
				estado_detalle_mp: pago.estado_detalle_mp,
				plan_nombre: pago.plan_nombre,
				monto_clp: pago.monto_clp,
				tipo_pago: pago.tipo_pago,
				metodo_pago: pago.metodo_pago,
				fecha_pago: pago.fecha_pago,
				fecha_creacion: pago.fecha_creacion
			},
			mensaje: pagado
				? 'Pago aprobado y acreditado'
				: `Pago en estado: ${pago.estado_mp} (${pago.estado_detalle_mp})`
		};

		console.log('[VERIFICAR] GET Sesión:', sesion_id, '| Pagado:', pagado);

		return json(response);

	} catch (err) {
		console.error('[VERIFICAR] Error:', err);

		// Si ya es un error de SvelteKit, re-lanzarlo
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, 'Error al verificar estado del pago');
	}
};
