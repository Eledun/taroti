import { json, error } from '@sveltejs/kit';
import { obtenerPlanPorId } from '$lib/data/planes';
import type { RequestHandler } from './$types';
import type { Sesion, CartaTarot } from '$lib/types';
import { getPool } from '$lib/db.js';

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

	// Guardar en MariaDB
	try {
		const pool = getPool();
		const conn = await pool.getConnection();

		try {
			await conn.query(
				`INSERT INTO lecturas (sesion_id, pregunta, cartas_seleccionadas, lectura_ia)
				 VALUES (?, ?, ?, ?)`,
				[sesionId, pregunta, JSON.stringify(cartas), ''] // lectura_ia vacía por ahora
			);

			console.log('[SESION] Sesión guardada en BD:', sesionId);
		} finally {
			conn.release();
		}
	} catch (err) {
		console.error('[SESION] Error guardando en BD:', err);
		throw error(500, 'Error al crear sesión');
	}

	return json(sesion);
};

export const GET: RequestHandler = async ({ url }) => {
	const sesionId = url.searchParams.get('id');
	const tokenAcceso = url.searchParams.get('token_acceso');

	if (!sesionId) {
		throw error(400, 'Falta parámetro: id');
	}

	// Buscar en MariaDB
	try {
		const pool = getPool();
		const conn = await pool.getConnection();

		try {
			const rows = await conn.query(
				'SELECT * FROM lecturas WHERE sesion_id = ?',
				[sesionId]
			);

			if (!rows || rows.length === 0) {
				throw error(404, 'Sesión no encontrada');
			}

			const row = rows[0];

			// Parsear cartas
			const cartas = typeof row.cartas_seleccionadas === 'string' ? JSON.parse(row.cartas_seleccionadas) : row.cartas_seleccionadas;

			// Inferir plan basado en número de cartas
			let planNombre = 'Lectura de Tarot';
			let tipoTirada = 'tres_cartas';
			let precio = 5000;

			const numCartas = cartas.length;
			if (numCartas === 3) {
				planNombre = 'Tirada de 3 Cartas';
				tipoTirada = 'tres_cartas';
				precio = 5000;
			} else if (numCartas === 10) {
				planNombre = 'Cruz Celta';
				tipoTirada = 'cruz_celta';
				precio = 15000;
			} else if (numCartas === 13) {
				planNombre = 'Rueda del Año';
				tipoTirada = 'rueda_del_anio';
				precio = 20000;
			}

			// Reconstruir objeto Sesion desde la BD
			const sesion: Sesion = {
				id: row.sesion_id,
				pregunta: row.pregunta,
				cartas,
				estado: row.lectura_ia ? 'completada' : 'pendiente',
				precio,
				generando: false,
				creado_en: row.fecha_creacion?.toISOString() || new Date().toISOString(),
				tipo_usuario: 'anonimo',
				token_acceso: '', // No guardamos el token en BD
				plan: {
					nombre: planNombre,
					tipo_tirada: tipoTirada
				}
			};

			return json(sesion);
		} finally {
			conn.release();
		}
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('[SESION] Error buscando en BD:', err);
		throw error(500, 'Error al buscar sesión');
	}
};
