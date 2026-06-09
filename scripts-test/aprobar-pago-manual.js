#!/usr/bin/env node

/**
 * Script para aprobar manualmente un pago en la BD
 * Uso: node aprobar-pago-manual.js SESION_ID
 */

import { createPool } from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

const sesionId = process.argv[2] || '1779759270465-kpk8n974z';

console.log(`\n🔧 Aprobando pago para sesión: ${sesionId}\n`);

const pool = createPool({
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '3306'),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	connectionLimit: 1
});

try {
	const conn = await pool.getConnection();

	// Verificar que existe el pago
	let [pago] = await conn.query('SELECT * FROM pagos WHERE sesion_id = ?', [sesionId]);

	if (!pago) {
		console.warn(`⚠️  No se encontró pago para sesión: ${sesionId}`);
		console.log('🔨 Creando registro de pago...');

		// Crear el registro de pago
		await conn.query(`
			INSERT INTO pagos (sesion_id, plan_nombre, monto_clp, estado_mp, estado_detalle_mp, fecha_creacion)
			VALUES (?, ?, ?, ?, ?, NOW())
		`, [sesionId, 'Tres Cartas', 1000, 'pending', 'pending_payment_in_process']);

		console.log('✅ Registro de pago creado');

		// Leer el pago recién creado
		[pago] = await conn.query('SELECT * FROM pagos WHERE sesion_id = ?', [sesionId]);
	}

	console.log('📋 Pago encontrado:', {
		sesion_id: pago.sesion_id,
		preference_id: pago.preference_id || 'N/A',
		estado_actual: pago.estado_mp
	});

	// Actualizar pago
	const result = await conn.query(`
		UPDATE pagos
		SET estado_mp = ?,
		    estado_detalle_mp = ?,
		    payment_id_mp = ?,
		    tipo_pago = ?,
		    metodo_pago = ?,
		    cuotas = ?,
		    fecha_pago = NOW(),
		    fecha_actualizacion = NOW()
		WHERE sesion_id = ?
	`, [
		'approved',
		'accredited',
		'TEST_PAYMENT_MANUAL_' + Date.now(),
		'credit_card',
		'visa',
		1,
		sesionId
	]);

	console.log(`\n✅ Pago actualizado! Filas afectadas: ${result.affectedRows}`);

	// Verificar cambio
	const [pagoActualizado] = await conn.query('SELECT estado_mp, estado_detalle_mp, payment_id_mp FROM pagos WHERE sesion_id = ?', [sesionId]);

	console.log('📋 Estado final:', pagoActualizado);
	console.log('\n✨ El frontend debería detectar el pago en el próximo poll (3 segundos)\n');

	await conn.release();
	await pool.end();
	process.exit(0);
} catch (err) {
	console.error('❌ Error:', err.message);
	await pool.end();
	process.exit(1);
}
