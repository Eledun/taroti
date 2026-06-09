import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { guardarPreferenceId, registrarAuditLog } from '$lib/db.js';

interface MercadoPagoItem {
	title: string;
	description: string; // Campo obligatorio según MP
	quantity: number;
	unit_price: number;
	currency_id: string;
}

interface MercadoPagoPayer {
	name?: string;
	surname?: string;
	email?: string;
	phone?: {
		area_code?: string;
		number?: number;
	};
	identification?: {
		type: string;
		number: string;
	};
	address?: {
		zip_code?: string;
		street_name?: string;
		street_number?: number;
	};
}

interface MercadoPagoPaymentMethods {
	excluded_payment_methods?: Array<{ id: string }>;
	excluded_payment_types?: Array<{ id: string }>;
	installments?: number;
	default_installments?: number;
}

interface MercadoPagoPreference {
	items: MercadoPagoItem[];
	payer?: MercadoPagoPayer;
	back_urls: {
		success: string;
		failure: string;
		pending: string;
	};
	auto_return?: string;
	external_reference: string;
	notification_url?: string;
	payment_methods?: MercadoPagoPaymentMethods;
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { sesion_id, plan_nombre, precio, email, nombre, telefono } = body;

	if (!sesion_id) {
		throw error(400, 'Falta parámetro: sesion_id');
	}

	const MERCADOPAGO_ACCESS_TOKEN = env.MERCADOPAGO_ACCESS_TOKEN;
	const FRONTEND_URL = env.FRONTEND_URL;

	if (!MERCADOPAGO_ACCESS_TOKEN) {
		throw error(500, 'MERCADOPAGO_ACCESS_TOKEN no configurado en el servidor');
	}

	// Validar campos obligatorios según requerimientos de Mercado Pago
	if (!email) {
		throw error(400, 'El email del comprador es obligatorio para procesar el pago');
	}

	if (!nombre) {
		throw error(400, 'El nombre del comprador es obligatorio para procesar el pago');
	}

	// Crear preferencia de pago en Mercado Pago según mejores prácticas de MP Chile
	const preference: MercadoPagoPreference = {
		items: [
			{
				title: plan_nombre || 'Lectura de Tarot',
				description: `Lectura personalizada de Tarot - ${plan_nombre || 'Plan estándar'}. Incluye interpretación detallada de cartas seleccionadas.`,
				quantity: 1,
				unit_price: precio || 5000,
				currency_id: 'CLP'
			}
		],
		back_urls: {
			success: `${FRONTEND_URL || 'http://localhost:5173'}/pago/exito`,
			failure: `${FRONTEND_URL || 'http://localhost:5173'}/pago/error`,
			pending: `${FRONTEND_URL || 'http://localhost:5173'}/pago/pendiente`
		},
		auto_return: 'approved',
		external_reference: sesion_id,
		notification_url: `${FRONTEND_URL || 'http://localhost:5173'}/api/pagos/webhook`,
		payment_methods: {
			excluded_payment_methods: [],
			excluded_payment_types: [],
			installments: 1,
			default_installments: 1
		}
	};

	// Agregar información del comprador (campos obligatorios)
	preference.payer = {
		email: email
	};

	// Procesar nombre y apellido
	const partesNombre = nombre.trim().split(' ');
	preference.payer.name = partesNombre[0];

	// El apellido es obligatorio - si no hay, usar el mismo nombre
	if (partesNombre.length > 1) {
		preference.payer.surname = partesNombre.slice(1).join(' ');
	} else {
		// Si solo dio un nombre, duplicarlo como apellido (requerimiento de MP)
		preference.payer.surname = partesNombre[0];
	}

	// Agregar teléfono si se proporciona (opcional pero recomendado)
	if (telefono) {
		preference.payer.phone = {
			number: parseInt(telefono.replace(/\D/g, ''))
		};
	}

	try {
		const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
			},
			body: JSON.stringify(preference)
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('[MercadoPago] Error:', errorData);
			throw error(500, `Error al crear preferencia de pago: ${errorData.message || 'Error desconocido'}`);
		}

		const data = await response.json();

		// Guardar preference_id en BD
		try {
			await guardarPreferenceId(sesion_id, data.id, sesion_id);
			console.log('[PREFERENCE] Guardada en BD:', sesion_id, '| Preference:', data.id);

			// Registrar evento en audit log
			await registrarAuditLog('preferencia_creada', sesion_id, {
				preference_id: data.id,
				plan_nombre: plan_nombre,
				precio: precio,
				email: email || null
			});
		} catch (dbErr) {
			console.error('[PREFERENCE] Error guardando en BD:', dbErr);
			// No fallar la request si falla el guardado
		}

		return json({
			preference_id: data.id,
			init_point: data.init_point
		});
	} catch (err) {
		console.error('[MercadoPago] Error:', err);

		// Si ya es un error de SvelteKit, re-lanzarlo
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, 'Error al comunicarse con Mercado Pago');
	}
};
