import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

interface MercadoPagoItem {
	title: string;
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
	payment_methods?: MercadoPagoPaymentMethods;
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { sesion_id, plan_nombre, precio } = body;

	if (!sesion_id) {
		throw error(400, 'Falta parámetro: sesion_id');
	}

	const MERCADOPAGO_ACCESS_TOKEN = env.MERCADOPAGO_ACCESS_TOKEN;
	const FRONTEND_URL = env.FRONTEND_URL;

	if (!MERCADOPAGO_ACCESS_TOKEN) {
		throw error(500, 'MERCADOPAGO_ACCESS_TOKEN no configurado en el servidor');
	}

	// Crear preferencia de pago en Mercado Pago según mejores prácticas de MP Chile
	const preference: MercadoPagoPreference = {
		items: [
			{
				title: plan_nombre || 'Lectura de Tarot',
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
		payment_methods: {
			excluded_payment_methods: [],
			excluded_payment_types: [],
			installments: 1,
			default_installments: 1
		}
	};

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

		return json({
			preference_id: data.id,
			init_point: data.init_point
		});
	} catch (err) {
		console.error('[MercadoPago] Error:', err);
		throw error(500, 'Error al comunicarse con Mercado Pago');
	}
};
