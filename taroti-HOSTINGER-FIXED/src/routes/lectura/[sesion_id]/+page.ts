import { error } from '@sveltejs/kit';
import { obtenerLectura } from '$lib/services/api';
import type { PageLoad } from './$types';
import type { Lectura } from '$lib/types';

export const load: PageLoad = async ({ params, url }) => {
	const sesionId = params.sesion_id;
	const tokenAcceso = url.searchParams.get('token_acceso');

	// Recuperar datos de sesión desde sessionStorage
	if (typeof window === 'undefined') {
		// Si estamos en SSR, simplemente retornar el sesionId
		return { sesionId, lecturaGenerada: false, lectura: null };
	}

	const sesionDataRaw = sessionStorage.getItem(`sesion_${sesionId}`);
	if (!sesionDataRaw) {
		throw error(404, {
			message: 'Sesión no encontrada. Por favor, inicia una nueva consulta.'
		});
	}

	const sesionData = JSON.parse(sesionDataRaw);

	try {
		// Llamar al endpoint de lecturas para generar la lectura con OpenAI
		const lectura: Lectura = await obtenerLectura(sesionId, {
			pregunta: sesionData.pregunta,
			cartas: sesionData.cartas,
			tipo_tirada: sesionData.plan.tipo_tirada,
			plan_nombre: sesionData.plan.nombre,
			token_acceso: tokenAcceso || undefined
		});

		return {
			lecturaGenerada: true,
			lectura
		};
	} catch (err) {
		console.error('Error generando lectura:', err);
		throw error(500, {
			message: 'Error al generar la lectura. Por favor, intenta nuevamente.'
		});
	}
};
