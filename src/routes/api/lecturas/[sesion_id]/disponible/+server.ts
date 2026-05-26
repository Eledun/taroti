import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { obtenerLectura } from '$lib/db.js';

/**
 * GET /api/lecturas/[sesion_id]/disponible
 * Verifica si una lectura está disponible para consulta
 *
 * Retorna:
 * - disponible: boolean - Si la lectura existe, no ha expirado y tiene contenido
 * - razon: string - Razón si no está disponible
 * - lectura_generada: boolean - Si ya se generó la lectura
 * - expira_en: string | null - Fecha de expiración
 *
 * Query params:
 * - token_acceso: Token de acceso opcional para validación
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const { sesion_id } = params;
	const tokenAcceso = url.searchParams.get('token_acceso');

	if (!sesion_id) {
		throw error(400, 'Falta parámetro: sesion_id');
	}

	try {
		// Intentar obtener lectura con validación de token y expiración
		const lectura = await obtenerLectura(sesion_id, tokenAcceso || undefined);

		// Lectura no existe
		if (!lectura) {
			// Verificar si es por token inválido o por no existir
			const lecturaSinToken = await obtenerLectura(sesion_id);

			if (!lecturaSinToken) {
				return json({
					disponible: false,
					razon: 'no_existe',
					lectura_generada: false,
					expira_en: null,
					mensaje: 'La sesión no existe'
				});
			}

			// Si existe sin token pero no con token, es token inválido
			if (tokenAcceso) {
				return json({
					disponible: false,
					razon: 'token_invalido',
					lectura_generada: !!lecturaSinToken.lectura_ia,
					expira_en: lecturaSinToken.expira_en,
					mensaje: 'Token de acceso inválido'
				});
			}

			// Validar expiración manualmente ya que obtenerLectura retorna null si expiró
			const ahora = new Date();
			const expiracion = new Date(lecturaSinToken.expira_en);

			if (lecturaSinToken.expira_en && ahora > expiracion) {
				return json({
					disponible: false,
					razon: 'expirada',
					lectura_generada: !!lecturaSinToken.lectura_ia,
					expira_en: lecturaSinToken.expira_en,
					mensaje: `La lectura expiró el ${expiracion.toISOString()}`
				});
			}
		}

		// Lectura existe y es válida
		const lecturaGenerada = !!(lectura?.lectura_ia && lectura.lectura_ia.trim() !== '');

		if (!lecturaGenerada) {
			return json({
				disponible: false,
				razon: 'no_generada',
				lectura_generada: false,
				expira_en: lectura?.expira_en || null,
				mensaje: 'La lectura aún no ha sido generada'
			});
		}

		// Todo OK - lectura disponible
		return json({
			disponible: true,
			razon: null,
			lectura_generada: true,
			expira_en: lectura?.expira_en || null,
			estado: lectura?.estado || 'completada',
			plan_nombre: lectura?.plan_nombre || null,
			tipo_tirada: lectura?.tipo_tirada || null,
			fecha_creacion: lectura?.fecha_creacion || null,
			mensaje: 'Lectura disponible para consulta'
		});
	} catch (err) {
		console.error('[API] Error verificando disponibilidad:', err);

		// Si ya es un error de SvelteKit, re-lanzarlo
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Error genérico
		throw error(500, 'Error al verificar disponibilidad de lectura');
	}
};
