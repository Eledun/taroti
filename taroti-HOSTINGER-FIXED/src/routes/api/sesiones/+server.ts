import { json, error } from '@sveltejs/kit';
import { obtenerPlanPorId } from '$lib/data/planes';
import type { RequestHandler } from './$types';
import type { Sesion, CartaTarot } from '$lib/types';

// Almacenamiento en memoria (solo durante ejecución del servidor)
// En producción, esto solo vive mientras el request está activo
const sesionesEnMemoria = new Map<string, Sesion>();

function generarId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generarToken(): string {
	return Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { plan_id, pregunta, cartas } = body;

	if (!plan_id || !pregunta || !cartas) {
		throw error(400, 'Faltan datos requeridos: plan_id, pregunta, cartas');
	}

	const plan = obtenerPlanPorId(plan_id);
	if (!plan) {
		throw error(404, `Plan con id ${plan_id} no encontrado`);
	}

	// Validar número de cartas
	if (cartas.length !== plan.num_cartas) {
		throw error(400, `El plan ${plan.nombre} requiere ${plan.num_cartas} cartas, recibidas: ${cartas.length}`);
	}

	const sesionId = generarId();
	const tokenAcceso = generarToken();

	const sesion: Sesion = {
		id: sesionId,
		pregunta,
		cartas: cartas as CartaTarot[],
		estado: 'pendiente',
		precio: plan.precio_final,
		generando: false,
		creado_en: new Date().toISOString(),
		tipo_usuario: 'anonimo',
		token_acceso: tokenAcceso,
		plan: {
			nombre: plan.nombre,
			tipo_tirada: plan.tipo_tirada
		}
	};

	// Guardar en memoria (temporal)
	sesionesEnMemoria.set(sesionId, sesion);

	return json(sesion);
};

export const GET: RequestHandler = async ({ url }) => {
	const sesionId = url.searchParams.get('id');
	const tokenAcceso = url.searchParams.get('token_acceso');

	if (!sesionId) {
		throw error(400, 'Falta parámetro: id');
	}

	const sesion = sesionesEnMemoria.get(sesionId);

	if (!sesion) {
		throw error(404, 'Sesión no encontrada');
	}

	// Validar token si existe
	if (tokenAcceso && sesion.token_acceso !== tokenAcceso) {
		throw error(403, 'Token de acceso inválido');
	}

	return json(sesion);
};
