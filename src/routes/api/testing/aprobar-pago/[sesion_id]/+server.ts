/**
 * ENDPOINT DE TESTING - Solo para desarrollo
 * Aprueba un pago manualmente actualizando la BD
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPool } from '$lib/db';

export const POST: RequestHandler = async ({ params }) => {
	const { sesion_id } = params;

	if (!sesion_id) {
		return error(400, 'sesion_id es requerido');
	}

	const pool = getPool();
	const connection = await pool.getConnection();

	try {
		// Buscar la sesión
		const [sesiones]: any = await connection.execute(
			'SELECT * FROM sesiones WHERE sesion_id = ?',
			[sesion_id]
		);

		if (sesiones.length === 0) {
			return error(404, `Sesión ${sesion_id} no encontrada`);
		}

		const sesion = sesiones[0];

		if (sesion.estado_pago === 'approved') {
			return json({
				success: true,
				message: 'El pago ya estaba aprobado',
				sesion: {
					sesion_id: sesion.sesion_id,
					estado_pago: sesion.estado_pago,
					tipo_tirada: sesion.tipo_tirada,
					monto: sesion.monto
				}
			});
		}

		// Actualizar estado del pago
		await connection.execute(
			`UPDATE sesiones
			 SET estado_pago = 'approved',
			     fecha_pago = NOW()
			 WHERE sesion_id = ?`,
			[sesion_id]
		);

		console.log(`[TESTING] Pago aprobado manualmente para sesión: ${sesion_id}`);

		return json({
			success: true,
			message: 'Pago aprobado exitosamente',
			sesion: {
				sesion_id,
				estado_pago: 'approved',
				tipo_tirada: sesion.tipo_tirada,
				monto: sesion.monto,
				fecha_pago: new Date().toISOString()
			}
		});
	} catch (err) {
		console.error('[TESTING] Error al aprobar pago:', err);
		return error(500, 'Error al aprobar pago');
	} finally {
		connection.release();
	}
};
