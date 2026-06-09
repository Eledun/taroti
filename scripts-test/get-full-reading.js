// Script to get full reading
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

async function getFullReading(sesionId) {
	let conn;
	try {
		conn = await pool.getConnection();

		const rows = await conn.query(
			'SELECT lectura_ia FROM lecturas WHERE sesion_id = ?',
			[sesionId]
		);

		if (rows.length === 0) {
			console.log(`❌ No se encontró la sesión: ${sesionId}`);
		} else {
			console.log(rows[0].lectura_ia);
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
	console.error('❌ Uso: node get-full-reading.js <sesion_id>');
	process.exit(1);
}

getFullReading(sesionId);
