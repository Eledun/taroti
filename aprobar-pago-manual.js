/**
 * Script para aprobar pagos manualmente en modo TEST
 * Uso: node aprobar-pago-manual.js <sesion_id>
 */

import mysql from 'mysql2/promise';

const MYSQL_CONFIG = {
	host: 'localhost',
	user: 'taroti_user',
	password: 'taroti_dev_2024',
	database: 'taroti_latam'
};

async function aprobarPago(sesionId) {
	const connection = await mysql.createConnection(MYSQL_CONFIG);

	try {
		console.log(`\n🔍 Buscando pago: ${sesionId}\n`);

		// Buscar el pago
		const [pagos] = await connection.execute(
			'SELECT * FROM pagos WHERE sesion_id = ?',
			[sesionId]
		);

		if (pagos.length === 0) {
			console.error(`❌ No se encontró el pago con sesion_id ${sesionId}`);
			process.exit(1);
		}

		const pago = pagos[0];
		console.log('📋 Pago encontrado:');
		console.log(`   Sesión ID: ${pago.sesion_id}`);
		console.log(`   Estado MP: ${pago.estado_mp}`);
		console.log(`   Plan: ${pago.plan_nombre || 'N/A'}`);
		console.log(`   Monto: $${pago.monto_clp || 'N/A'}`);
		console.log();

		if (pago.estado_mp === 'approved') {
			console.log('✅ El pago ya está aprobado');
			process.exit(0);
		}

		// Actualizar estado del pago
		await connection.execute(
			`UPDATE pagos
			 SET estado_mp = 'approved',
			     estado_detalle_mp = 'accredited',
			     fecha_pago = NOW()
			 WHERE sesion_id = ?`,
			[sesionId]
		);

		console.log('✅ Pago aprobado exitosamente');
		console.log(`   Estado: approved`);
		console.log(`   Estado detalle: accredited`);
		console.log(`   Fecha pago: ${new Date().toISOString()}`);
		console.log();
		console.log(`🔗 URL de lectura: http://localhost:5173/lectura/${sesionId}`);
		console.log();

	} catch (error) {
		console.error('❌ Error al aprobar pago:', error.message);
		process.exit(1);
	} finally {
		await connection.end();
	}
}

// Obtener sesion_id del argumento
const sesionId = process.argv[2];

if (!sesionId) {
	console.error('❌ Uso: node aprobar-pago-manual.js <sesion_id>');
	process.exit(1);
}

aprobarPago(sesionId);
