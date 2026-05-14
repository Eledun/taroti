import { error } from '@sveltejs/kit';
import { obtenerLectura } from '$lib/services/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
	const sesionId = params.sesion_id;
	const tokenAcceso = url.searchParams.get('token_acceso');

	try {
		const lectura = await obtenerLectura(sesionId, tokenAcceso || undefined);
		return { lectura };
	} catch (err) {
		console.error('Error cargando lectura:', err);
		throw error(404, {
			message: 'Lectura no encontrada'
		});
	}
};
