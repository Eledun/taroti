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

	// DEBUG: Verificar qué estamos recibiendo
	console.log('[DEBUG SESIONES] ========================================');
	console.log('[DEBUG SESIONES] Body recibido:', body);
	console.log('[DEBUG SESIONES] typeof cartas:', typeof cartas);
	console.log('[DEBUG SESIONES] Array.isArray(cartas):', Array.isArray(cartas));
	console.log('[DEBUG SESIONES] cartas raw:', cartas);
	console.log('[DEBUG SESIONES] cartas[0]:', cartas && cartas[0]);
	console.log('[DEBUG SESIONES] JSON.stringify(cartas):', JSON.stringify(cartas));
	console.log('[DEBUG SESIONES] ========================================');

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

	// Guardar en MariaDB con TODOS los campos
	try {
		const pool = getPool();
		const conn = await pool.getConnection();

		try {
			// Calcular fecha de expiración (30 días)
			const expiraEn = new Date();
			expiraEn.setDate(expiraEn.getDate() + 30);

			// Insertar en lecturas
			await conn.query(
				`INSERT INTO lecturas (
					sesion_id, plan_id, plan_nombre, tipo_tirada, precio,
					pregunta, cartas_seleccionadas, lectura_ia,
					token_acceso, estado, tipo_usuario, expira_en
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					sesionId,
					plan_id,
					plan.nombre,
					plan.tipo_tirada,
					plan.precio_final,
					pregunta,
					JSON.stringify(cartas),
					'', // lectura_ia vacía por ahora
					tokenAcceso,
					'pendiente',
					'anonimo',
					expiraEn.toISOString().slice(0, 19).replace('T', ' ')
				]
			);

			// Insertar en pagos (registro inicial pendiente)
			await conn.query(
				`INSERT INTO pagos (
					sesion_id, plan_nombre, monto_clp, estado_mp, estado_detalle_mp
				) VALUES (?, ?, ?, ?, ?)`,
				[
					sesionId,
					plan.nombre,
					plan.precio_final,
					'pending',
					'pending_payment_in_process'
				]
			);

			console.log('[SESION] Sesión guardada en BD:', sesionId, '| Plan:', plan.nombre, '| Token:', tokenAcceso);
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

			// Usar datos REALES de la BD (ya no inferimos)
			const planNombre = row.plan_nombre || 'Lectura de Tarot';
			const tipoTirada = row.tipo_tirada || 'tres_cartas';
			const precio = row.precio || 5000;

			// Reconstruir objeto Sesion desde la BD
			const sesion: Sesion = {
				id: row.sesion_id,
				pregunta: row.pregunta,
				cartas,
				estado: row.estado || 'pendiente',
				precio,
				generando: false,
				creado_en: row.fecha_creacion?.toISOString() || new Date().toISOString(),
				tipo_usuario: row.tipo_usuario || 'anonimo',
				token_acceso: row.token_acceso || '',
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
