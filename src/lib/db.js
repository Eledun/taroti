/**
 * MariaDB Connection Pool for Taroti LATAM
 *
 * Reemplaza el sistema de archivos /tmp con persistencia real en BD
 * Performance: 5,650 ops/seg (2x más rápido que mysql2)
 */

import * as mariadb from 'mariadb';
import { env } from '$env/dynamic/private';

// Pool de conexiones (reutilizable)
let pool;

/**
 * Obtener pool de conexiones MariaDB
 * Lazy initialization para evitar problemas en build time
 */
export function getPool() {
	if (!pool) {
		const DB_HOST = env.DB_HOST || 'localhost';
		const DB_PORT = parseInt(env.DB_PORT || '3306');
		const DB_USER = env.DB_USER;
		const DB_PASSWORD = env.DB_PASSWORD;
		const DB_NAME = env.DB_NAME;

		if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
			throw new Error('Faltan variables de entorno: DB_USER, DB_PASSWORD, DB_NAME');
		}

		pool = mariadb.createPool({
			host: DB_HOST,
			port: DB_PORT,
			user: DB_USER,
			password: DB_PASSWORD,
			database: DB_NAME,
			connectionLimit: 10,
			connectTimeout: 5000,
			acquireTimeout: 5000,
			// Configuración para mejor rendimiento
			timezone: 'America/Santiago',
			charset: 'utf8mb4',
			// Manejo de conexiones
			idleTimeout: 60000, // 60 segundos
			minimumIdle: 2
		});

		console.log('[DB] Pool MariaDB creado:', {
			host: DB_HOST,
			port: DB_PORT,
			database: DB_NAME,
			connectionLimit: 10
		});
	}

	return pool;
}

/**
 * Ejecutar query con manejo automático de conexión
 *
 * @param {string} sql - Query SQL
 * @param {any[]} params - Parámetros para query preparado
 * @returns {Promise<any>} Resultado de la query
 */
export async function query(sql, params = []) {
	const pool = getPool();
	let conn;

	try {
		conn = await pool.getConnection();
		const result = await conn.query(sql, params);
		return result;
	} catch (err) {
		console.error('[DB] Error en query:', err);
		throw err;
	} finally {
		if (conn) {
			conn.release();
		}
	}
}

/**
 * Guardar estado de pago en BD
 * Reemplaza: writeFileSync('/tmp/pago_${sesionId}.json')
 *
 * @param {string} sesionId - ID de sesión único
 * @param {string} paymentId - ID del pago de Mercado Pago
 * @param {string} status - Estado del pago (approved, rejected, etc.)
 * @param {string} statusDetail - Detalle del estado (accredited, etc.)
 * @returns {Promise<void>}
 */
export async function guardarPago(sesionId, paymentId, status, statusDetail) {
	const sql = `
		INSERT INTO pagos (sesion_id, payment_id_mp, estado_mp, estado_detalle_mp, fecha_pago, fecha_actualizacion)
		VALUES (?, ?, ?, ?, NOW(), NOW())
		ON DUPLICATE KEY UPDATE
			payment_id_mp = VALUES(payment_id_mp),
			estado_mp = VALUES(estado_mp),
			estado_detalle_mp = VALUES(estado_detalle_mp),
			fecha_actualizacion = NOW()
	`;

	await query(sql, [sesionId, paymentId, status, statusDetail]);
	console.log('[DB] Pago guardado:', { sesionId, paymentId, status, statusDetail });
}

/**
 * Verificar si un pago está aprobado
 * Reemplaza: readFileSync('/tmp/pago_${sesionId}.json')
 *
 * @param {string} sesionId - ID de sesión único
 * @returns {Promise<{pagado: boolean, payment_id?: string, fecha_pago?: string}>}
 */
export async function verificarPago(sesionId) {
	const sql = `
		SELECT payment_id_mp, estado_mp, estado_detalle_mp, fecha_pago
		FROM pagos
		WHERE sesion_id = ?
		LIMIT 1
	`;

	const rows = await query(sql, [sesionId]);

	if (rows.length === 0) {
		return { pagado: false };
	}

	const pago = rows[0];

	// Verificar si está aprobado
	if (pago.estado_mp === 'approved' && pago.estado_detalle_mp === 'accredited') {
		return {
			pagado: true,
			payment_id: pago.payment_id_mp,
			fecha_pago: pago.fecha_pago
		};
	}

	// Existe pero no aprobado
	return {
		pagado: false,
		status: pago.estado_mp,
		status_detail: pago.estado_detalle_mp
	};
}

/**
 * Actualizar lectura con resultado de OpenAI
 * @param {string} sesionId
 * @param {string} lecturaIA
 * @param {number} tokensUsados
 * @param {string} modeloIA
 */
export async function actualizarLectura(sesionId, lecturaIA, tokensUsados, modeloIA) {
	const sql = `
		UPDATE lecturas
		SET lectura_ia = ?,
			tokens_usados = ?,
			modelo_ia = ?,
			estado = 'completada',
			fecha_actualizacion = NOW()
		WHERE sesion_id = ?
	`;
	await query(sql, [lecturaIA, tokensUsados, modeloIA, sesionId]);
	console.log('[DB] Lectura actualizada:', sesionId, '| Modelo:', modeloIA, '| Tokens:', tokensUsados);
}

/**
 * Registrar evento de webhook para auditoría
 *
 * @param {string} paymentId - ID del pago
 * @param {string} tipo - Tipo de notificación
 * @param {string} accion - Acción del webhook
 * @param {object} payload - Payload completo del webhook
 * @returns {Promise<void>}
 */
export async function registrarWebhookEvent(paymentId, tipo, accion, payload) {
	const sql = `
		INSERT INTO webhook_events_mp (payment_id, tipo, accion, payload, fecha_recepcion)
		VALUES (?, ?, ?, ?, NOW())
	`;

	await query(sql, [paymentId, tipo, accion, JSON.stringify(payload)]);
	console.log('[DB] Webhook registrado:', { paymentId, tipo, accion });
}

/**
 * Cerrar pool de conexiones (para testing o shutdown)
 */
export async function closePool() {
	if (pool) {
		await pool.end();
		pool = null;
		console.log('[DB] Pool cerrado');
	}
}
