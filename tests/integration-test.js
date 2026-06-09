#!/usr/bin/env node

/**
 * Test de Integración Completo - Taroti LATAM
 * Verifica endpoints, webhooks, configuración, y base de datos
 *
 * Uso: node tests/integration-test.js
 */

import { createConnection } from 'mariadb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

// Configuración
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = BASE_URL;

// Colores para output
const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m'
};

// Resultados
const results = {
	passed: 0,
	failed: 0,
	warnings: 0,
	tests: []
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(test, message) {
	results.passed++;
	results.tests.push({ test, status: 'PASS', message });
	log(`✅ ${test}: ${message}`, 'green');
}

function fail(test, message) {
	results.failed++;
	results.tests.push({ test, status: 'FAIL', message });
	log(`❌ ${test}: ${message}`, 'red');
}

function warn(test, message) {
	results.warnings++;
	results.tests.push({ test, status: 'WARN', message });
	log(`⚠️  ${test}: ${message}`, 'yellow');
}

function section(title) {
	log(`\n${'='.repeat(70)}`, 'cyan');
	log(`  ${title}`, 'cyan');
	log('='.repeat(70), 'cyan');
}

// ============================================================================
// 1. TEST DE VARIABLES DE ENTORNO
// ============================================================================

async function testEnvironmentVariables() {
	section('1. VARIABLES DE ENTORNO');

	const required = [
		'DB_HOST',
		'DB_PORT',
		'DB_USER',
		'DB_PASSWORD',
		'DB_NAME',
		'OPENAI_API_KEY',
		'MERCADOPAGO_ACCESS_TOKEN'
	];

	const optional = [
		'MERCADOPAGO_WEBHOOK_SECRET',
		'FRONTEND_URL'
	];

	// Variables requeridas
	for (const varName of required) {
		if (process.env[varName]) {
			success(`ENV:${varName}`, 'Configurada');
		} else {
			fail(`ENV:${varName}`, 'FALTANTE - Requerida');
		}
	}

	// Variables opcionales
	for (const varName of optional) {
		if (process.env[varName]) {
			success(`ENV:${varName}`, 'Configurada');
		} else {
			warn(`ENV:${varName}`, 'No configurada - Opcional pero recomendada');
		}
	}
}

// ============================================================================
// 2. TEST DE CONEXIÓN A BASE DE DATOS
// ============================================================================

async function testDatabaseConnection() {
	section('2. CONEXIÓN A BASE DE DATOS');

	try {
		const conn = await createConnection({
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || '3306'),
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME
		});

		success('DB:Connection', 'Conectado exitosamente');

		// Verificar tablas
		const tables = await conn.query('SHOW TABLES');
		const tableNames = tables.map(t => Object.values(t)[0]);

		const requiredTables = ['pagos', 'lecturas', 'audit_log', 'webhook_events_mp'];

		for (const table of requiredTables) {
			if (tableNames.includes(table)) {
				success(`DB:Table:${table}`, 'Existe');
			} else {
				fail(`DB:Table:${table}`, 'NO EXISTE');
			}
		}

		await conn.end();
	} catch (err) {
		fail('DB:Connection', `Error: ${err.message}`);
	}
}

// ============================================================================
// 3. TEST DE SCHEMA DE BASE DE DATOS
// ============================================================================

async function testDatabaseSchema() {
	section('3. SCHEMA DE BASE DE DATOS');

	try {
		const conn = await createConnection({
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || '3306'),
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME
		});

		// Verificar columnas de pagos (v2.3.6)
		const pagosColumns = await conn.query(`
			SELECT COLUMN_NAME
			FROM information_schema.COLUMNS
			WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pagos'
		`, [process.env.DB_NAME]);

		const expectedPagosColumns = [
			'id', 'sesion_id', 'payment_id_mp', 'preference_id', 'external_reference',
			'merchant_order_id', 'estado_mp', 'estado_detalle_mp', 'plan_nombre',
			'monto_clp', 'monto_neto', 'fee_mp', 'email_usuario', 'nombre_usuario',
			'telefono_usuario', 'tipo_pago', 'metodo_pago', 'cuotas', 'ip_address',
			'user_agent', 'metadata_extra', 'fecha_pago', 'fecha_creacion', 'fecha_actualizacion'
		];

		const actualColumns = pagosColumns.map(c => c.COLUMN_NAME);

		for (const col of expectedPagosColumns) {
			if (actualColumns.includes(col)) {
				success(`DB:pagos:${col}`, 'Columna existe');
			} else {
				fail(`DB:pagos:${col}`, 'COLUMNA FALTANTE');
			}
		}

		// Verificar columnas de lecturas (v2.3.4)
		const lecturasColumns = await conn.query(`
			SELECT COLUMN_NAME
			FROM information_schema.COLUMNS
			WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lecturas'
		`, [process.env.DB_NAME]);

		const expectedLecturasColumns = [
			'id', 'sesion_id', 'plan_id', 'plan_nombre', 'tipo_tirada', 'precio',
			'pregunta', 'cartas_seleccionadas', 'lectura_ia', 'token_acceso',
			'estado', 'tipo_usuario', 'tokens_usados', 'modelo_ia', 'fecha_creacion',
			'expira_en', 'fecha_actualizacion'
		];

		const actualLecturas = lecturasColumns.map(c => c.COLUMN_NAME);

		for (const col of expectedLecturasColumns) {
			if (actualLecturas.includes(col)) {
				success(`DB:lecturas:${col}`, 'Columna existe');
			} else {
				fail(`DB:lecturas:${col}`, 'COLUMNA FALTANTE');
			}
		}

		// Verificar índices importantes
		const indexes = await conn.query(`
			SELECT DISTINCT INDEX_NAME, TABLE_NAME
			FROM information_schema.STATISTICS
			WHERE TABLE_SCHEMA = ?
		`, [process.env.DB_NAME]);

		const expectedIndexes = [
			{ table: 'pagos', index: 'idx_preference_id' },
			{ table: 'pagos', index: 'idx_email_usuario' },
			{ table: 'lecturas', index: 'idx_plan_id' },
			{ table: 'lecturas', index: 'idx_token_acceso' },
			{ table: 'lecturas', index: 'idx_estado' },
			{ table: 'audit_log', index: 'idx_evento' }
		];

		for (const { table, index } of expectedIndexes) {
			const found = indexes.find(i => i.TABLE_NAME === table && i.INDEX_NAME === index);
			if (found) {
				success(`DB:Index:${table}.${index}`, 'Índice existe');
			} else {
				warn(`DB:Index:${table}.${index}`, 'Índice no encontrado - Puede afectar performance');
			}
		}

		await conn.end();
	} catch (err) {
		fail('DB:Schema', `Error: ${err.message}`);
	}
}

// ============================================================================
// 4. TEST DE ENDPOINTS API
// ============================================================================

async function testAPIEndpoints() {
	section('4. ENDPOINTS API');

	const endpoints = [
		{ method: 'GET', path: '/api/planes', description: 'Lista de planes' },
		{ method: 'POST', path: '/api/sesiones', description: 'Crear sesión' },
		{ method: 'GET', path: '/api/pagos/webhook', description: 'Webhook status' },
		{ method: 'GET', path: '/api/lecturas', description: 'Listar lecturas' }
	];

	for (const { method, path, description } of endpoints) {
		try {
			const url = `${API_URL}${path}`;
			const options = { method };

			const response = await fetch(url, options);

			if (response.status < 500) {
				success(`API:${method}:${path}`, `${description} - Status ${response.status}`);
			} else {
				fail(`API:${method}:${path}`, `${description} - Status ${response.status}`);
			}
		} catch (err) {
			fail(`API:${method}:${path}`, `Error: ${err.message}`);
		}
	}
}

// ============================================================================
// 5. TEST DE FLUJO COMPLETO
// ============================================================================

async function testCompleteFlow() {
	section('5. FLUJO COMPLETO DE PAGO');

	try {
		// 1. Crear sesión
		log('\nPaso 1: Crear sesión...', 'blue');
		const sesionResponse = await fetch(`${API_URL}/api/sesiones`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				plan_id: 'tres_cartas',
				pregunta: 'Test de integración',
				cartas: [
					{ arcano: '0', invertida: false },
					{ arcano: '1', invertida: false },
					{ arcano: '2', invertida: false }
				]
			})
		});

		if (!sesionResponse.ok) {
			fail('Flow:CreateSession', `Error ${sesionResponse.status}`);
			return;
		}

		const sesionData = await sesionResponse.json();
		const sesionId = sesionData.sesion_id;

		success('Flow:CreateSession', `Sesión creada: ${sesionId}`);

		// 2. Crear preferencia de pago
		log('\nPaso 2: Crear preferencia de pago...', 'blue');
		const prefResponse = await fetch(`${API_URL}/api/pagos/preference`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sesion_id: sesionId,
				plan_nombre: 'Tres Cartas',
				precio: 1000,
				email: 'test@taroti.com',
				nombre: 'Test User'
			})
		});

		if (!prefResponse.ok) {
			fail('Flow:CreatePreference', `Error ${prefResponse.status}`);
			return;
		}

		const prefData = await prefResponse.json();
		success('Flow:CreatePreference', `Preferencia: ${prefData.preference_id}`);

		// Verificar que preference_id tiene formato correcto
		if (prefData.preference_id && prefData.preference_id.length > 10) {
			success('Flow:PreferenceFormat', 'Formato válido de preference_id');
		} else {
			warn('Flow:PreferenceFormat', 'preference_id parece inválido');
		}

		// Verificar que init_point es una URL válida
		if (prefData.init_point && prefData.init_point.startsWith('http')) {
			success('Flow:InitPoint', 'URL de pago válida');
		} else {
			fail('Flow:InitPoint', 'URL de pago inválida');
		}

		// 3. Verificar estado del pago
		log('\nPaso 3: Verificar estado del pago...', 'blue');
		const verifyResponse = await fetch(`${API_URL}/api/pagos/verificar`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sesion_id: sesionId })
		});

		if (!verifyResponse.ok) {
			fail('Flow:VerifyPayment', `Error ${verifyResponse.status}`);
			return;
		}

		const verifyData = await verifyResponse.json();
		success('Flow:VerifyPayment', `Estado: ${verifyData.mensaje}`);

		// 4. Verificar sesión en base de datos
		log('\nPaso 4: Verificar datos en base de datos...', 'blue');
		const conn = await createConnection({
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || '3306'),
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME
		});

		const [lectura] = await conn.query('SELECT * FROM lecturas WHERE sesion_id = ?', [sesionId]);
		if (lectura) {
			success('Flow:DB:Lectura', 'Lectura guardada en BD');

			// Verificar campos importantes
			if (lectura.plan_nombre) success('Flow:DB:plan_nombre', lectura.plan_nombre);
			if (lectura.token_acceso) success('Flow:DB:token_acceso', 'Token generado');
			if (lectura.estado) success('Flow:DB:estado', lectura.estado);
		} else {
			fail('Flow:DB:Lectura', 'Lectura NO encontrada en BD');
		}

		const [pago] = await conn.query('SELECT * FROM pagos WHERE sesion_id = ?', [sesionId]);
		if (pago) {
			success('Flow:DB:Pago', 'Pago guardado en BD');

			// Verificar campos de v2.3.6
			if (pago.preference_id) success('Flow:DB:preference_id', pago.preference_id);
			if (pago.email_usuario) success('Flow:DB:email_usuario', pago.email_usuario);
		} else {
			fail('Flow:DB:Pago', 'Pago NO encontrado en BD');
		}

		await conn.end();

		success('Flow:Complete', 'Flujo completo ejecutado exitosamente');

	} catch (err) {
		fail('Flow:Complete', `Error: ${err.message}`);
	}
}

// ============================================================================
// 6. TEST DE CONFIGURACIÓN DE BACK_URLS
// ============================================================================

async function testBackUrls() {
	section('6. CONFIGURACIÓN DE BACK_URLS');

	const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

	const backUrls = [
		`${frontendUrl}/pago/exito`,
		`${frontendUrl}/pago/error`,
		`${frontendUrl}/pago/pendiente`
	];

	for (const url of backUrls) {
		try {
			const response = await fetch(url, { method: 'HEAD' });
			if (response.status < 500) {
				success(`BackURL:${url.split('/').pop()}`, `Accesible - Status ${response.status}`);
			} else {
				warn(`BackURL:${url.split('/').pop()}`, `Status ${response.status} - Verificar ruta`);
			}
		} catch (err) {
			warn(`BackURL:${url.split('/').pop()}`, `Error al acceder: ${err.message}`);
		}
	}
}

// ============================================================================
// EJECUTAR TODOS LOS TESTS
// ============================================================================

async function runAllTests() {
	log('\n╔════════════════════════════════════════════════════════════════════╗', 'cyan');
	log('║          TEST DE INTEGRACIÓN - TAROTI LATAM v2.3.7               ║', 'cyan');
	log('╚════════════════════════════════════════════════════════════════════╝', 'cyan');

	await testEnvironmentVariables();
	await testDatabaseConnection();
	await testDatabaseSchema();
	await testAPIEndpoints();
	await testCompleteFlow();
	await testBackUrls();

	// Resumen final
	section('RESUMEN DE TESTS');
	log(`\n✅ Passed:   ${results.passed}`, 'green');
	log(`❌ Failed:   ${results.failed}`, 'red');
	log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
	log(`📊 Total:    ${results.passed + results.failed + results.warnings}\n`);

	if (results.failed === 0) {
		log('🎉 TODOS LOS TESTS CRÍTICOS PASARON', 'green');
		process.exit(0);
	} else {
		log('⚠️  ALGUNOS TESTS FALLARON - REVISAR ERRORES', 'red');
		process.exit(1);
	}
}

// Ejecutar
runAllTests().catch(err => {
	log(`\n❌ Error fatal: ${err.message}`, 'red');
	console.error(err);
	process.exit(1);
});
