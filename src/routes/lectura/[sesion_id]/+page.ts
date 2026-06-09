import { error } from '@sveltejs/kit';
import { obtenerLectura } from '$lib/services/api';
import type { PageLoad } from './$types';
import type { Lectura } from '$lib/types';

export const load: PageLoad = async ({ params, url, fetch }) => {
	const sesionId = params.sesion_id;
	const tokenAcceso = url.searchParams.get('token_acceso');

	// Recuperar datos de sesión desde sessionStorage O base de datos
	let sesionData: any = null;

	if (typeof window !== 'undefined') {
		// En el navegador: intentar primero sessionStorage
		const sesionDataRaw = sessionStorage.getItem(`sesion_${sesionId}`);
		if (sesionDataRaw) {
			sesionData = JSON.parse(sesionDataRaw);
			console.log('[LECTURA] Sesión recuperada desde sessionStorage');
		}
	}

	// Si no hay datos en sessionStorage, cargar desde la API
	if (!sesionData) {
		console.log('[LECTURA] Cargando sesión desde base de datos');
		try {
			const sesionResponse = await fetch(`/api/sesiones?id=${sesionId}`);
			if (!sesionResponse.ok) {
				throw error(404, {
					message: 'Sesión no encontrada. Por favor, inicia una nueva consulta.'
				});
			}
			sesionData = await sesionResponse.json();
			console.log('[LECTURA] Sesión recuperada desde BD');
		} catch (err) {
			console.error('[LECTURA] Error cargando sesión:', err);
			throw error(404, {
				message: 'Sesión no encontrada. Por favor, inicia una nueva consulta.'
			});
		}
	}

	// Verificar si hay una lectura ya generada en sessionStorage
	if (typeof window !== 'undefined') {
		const lecturaGuardadaRaw = sessionStorage.getItem(`lectura_${sesionId}`);
		if (lecturaGuardadaRaw) {
			try {
				const lecturaGuardada = JSON.parse(lecturaGuardadaRaw);
				console.log('[LECTURA] Lectura ya existe en sessionStorage');
				return {
					lecturaGenerada: true,
					lectura: lecturaGuardada
				};
			} catch {
				// Si hay error parseando, continuar con el flujo normal
			}
		}
	}

	try {
		// PASO 1: Verificar que el pago haya sido confirmado
		const pagoResponse = await fetch(`/api/pagos/verificar/${sesionId}`);

		if (!pagoResponse.ok) {
			console.error('[LECTURA] Error verificando pago');
			return {
				lecturaGenerada: false,
				lectura: null,
				esperandoPago: true,
				error: 'Error al verificar el pago'
			};
		}

		const pagoData = await pagoResponse.json();

		if (!pagoData.pagado) {
			console.log('[LECTURA] Pago aún no confirmado, mostrando pantalla de espera');
			return {
				lecturaGenerada: false,
				lectura: null,
				esperandoPago: true
			};
		}

		console.log('[LECTURA] Pago confirmado, generando lectura con OpenAI');

		// PASO 2: Pago confirmado, generar lectura con OpenAI
		const lectura: Lectura = await obtenerLectura(sesionId, {
			pregunta: sesionData.pregunta,
			cartas: sesionData.cartas,
			tipo_tirada: sesionData.plan.tipo_tirada,
			plan_nombre: sesionData.plan.nombre,
			token_acceso: tokenAcceso || undefined
		}, fetch);

		// Guardar lectura en sessionStorage para no regenerarla
		if (typeof window !== 'undefined') {
			sessionStorage.setItem(`lectura_${sesionId}`, JSON.stringify(lectura));
		}

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
