// Script to check session data
import * as mariadb from 'mariadb';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = mariadb.createPool({
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '3306'),
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'taroti_latam',
	connectionLimit: 5
});

async function checkSession(sesionId) {
	let conn;
	try {
		conn = await pool.getConnection();

		const rows = await conn.query(
			'SELECT sesion_id, cartas_seleccionadas, lectura_ia, estado FROM lecturas WHERE sesion_id = ?',
			[sesionId]
		);

		if (rows.length === 0) {
			console.log(`❌ No se encontró la sesión: ${sesionId}`);
		} else {
			const row = rows[0];
			console.log(`\n📋 Sesión: ${sesionId}`);
			console.log(`Estado: ${row.estado}`);
			console.log(`\nCartas seleccionadas:`);
			console.log(JSON.stringify(row.cartas_seleccionadas, null, 2));
			console.log(`\nLectura IA (primeros 200 chars):`);
			console.log(row.lectura_ia ? row.lectura_ia.substring(0, 200) + '...' : 'NO GENERADA AÚN');
		}
	} catch (err) {
		console.error('❌ Error:', err);
	} finally {
		if (conn) conn.release();
		await pool.end();
	}
}

const sesionId = process.argv[2];
if (!sesionId) {
	console.error('❌ Uso: node check-session.js <sesion_id>');
	process.exit(1);
}

checkSession(sesionId);
