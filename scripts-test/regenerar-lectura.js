// Script to force regeneration of a reading by clearing the cached AI response
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

async function regenerarLectura(sesionId) {
	let conn;
	try {
		conn = await pool.getConnection();

		// Clear the cached lectura_ia so it will regenerate
		const result = await conn.query(
			'UPDATE lecturas SET lectura_ia = "" WHERE sesion_id = ?',
			[sesionId]
		);

		if (result.affectedRows === 0) {
			console.log(`❌ No se encontró la sesión: ${sesionId}`);
		} else {
			console.log(`✅ Lectura limpiada para sesión: ${sesionId}`);
			console.log(`   La próxima vez que se acceda, se regenerará con OpenAI`);
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
	console.error('❌ Uso: node regenerar-lectura.js <sesion_id>');
	process.exit(1);
}

regenerarLectura(sesionId);
