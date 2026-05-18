import { error } from '@sveltejs/kit';
import { obtenerSesion } from '$lib/services/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
	const sesionId = params.sesion_id;
	const tokenAcceso = url.searchParams.get('token_acceso');

	try {
		const sesion = await obtenerSesion(sesionId, tokenAcceso || undefined);

		if (!sesion.lectura) {
			throw error(404, {
				message: 'Lectura no encontrada'
			});
		}

		// Transformar sesion a formato lectura
		const lectura = {
			id: sesion.lectura.id,
			pregunta: sesion.pregunta,
			cartas: sesion.cartas,
			ambito_detectado: sesion.lectura.ambito_detectado,
			interpretacion: sesion.lectura.interpretacion,
			expirada: sesion.lectura.expirada,
			expira_en: sesion.lectura.expira_en,
			creado_en: sesion.creado_en,
			plan: sesion.plan
		};

		return { lectura };
	} catch (err) {
		console.error('Error cargando lectura:', err);
		throw error(404, {
			message: 'Lectura no encontrada'
		});
	}
};
