import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listarLecturas } from '$lib/db.js';

/**
 * GET /api/lecturas
 * Lista lecturas con filtros opcionales
 *
 * Query params:
 * - estado: pendiente | pagada | completada | cancelada
 * - plan_id: ID del plan
 * - desde: Fecha inicio (ISO 8601)
 * - hasta: Fecha fin (ISO 8601)
 * - limit: Límite de resultados (default: 100, max: 1000)
 * - offset: Offset para paginación (default: 0)
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		// Extraer query params
		const estado = url.searchParams.get('estado') || undefined;
		const plan_id = url.searchParams.get('plan_id') || undefined;
		const desdeStr = url.searchParams.get('desde');
		const hastaStr = url.searchParams.get('hasta');
		const limitStr = url.searchParams.get('limit');
		const offsetStr = url.searchParams.get('offset');

		// Validar estado si se proporciona
		if (estado && !['pendiente', 'pagada', 'completada', 'cancelada'].includes(estado)) {
			throw error(400, `Estado inválido: ${estado}. Valores permitidos: pendiente, pagada, completada, cancelada`);
		}

		// Parsear fechas
		let desde: Date | undefined;
		let hasta: Date | undefined;

		if (desdeStr) {
			desde = new Date(desdeStr);
			if (isNaN(desde.getTime())) {
				throw error(400, 'Fecha "desde" inválida. Use formato ISO 8601.');
			}
		}

		if (hastaStr) {
			hasta = new Date(hastaStr);
			if (isNaN(hasta.getTime())) {
				throw error(400, 'Fecha "hasta" inválida. Use formato ISO 8601.');
			}
		}

		// Parsear limit y offset
		let limit = 100;
		let offset = 0;

		if (limitStr) {
			limit = parseInt(limitStr);
			if (isNaN(limit) || limit < 1 || limit > 1000) {
				throw error(400, 'Límite inválido. Debe ser un número entre 1 y 1000.');
			}
		}

		if (offsetStr) {
			offset = parseInt(offsetStr);
			if (isNaN(offset) || offset < 0) {
				throw error(400, 'Offset inválido. Debe ser un número mayor o igual a 0.');
			}
		}

		// Consultar base de datos
		const lecturas = await listarLecturas({
			estado,
			plan_id,
			desde,
			hasta,
			limit,
			offset
		});

		// Construir respuesta con metadata de paginación
		return json({
			lecturas,
			metadata: {
				total: lecturas.length,
				limit,
				offset,
				filtros_aplicados: {
					estado: estado || null,
					plan_id: plan_id || null,
					desde: desde?.toISOString() || null,
					hasta: hasta?.toISOString() || null
				}
			}
		});
	} catch (err) {
		console.error('[API] Error listando lecturas:', err);

		// Si ya es un error de SvelteKit, re-lanzarlo
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Error genérico
		throw error(500, 'Error al consultar lecturas');
	}
};
