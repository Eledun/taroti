import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

interface MercadoPagoItem {
	title: string;
	quantity: number;
	unit_price: number;
	currency_id: string;
}

interface MercadoPagoPreference {
	items: MercadoPagoItem[];
	back_urls: {
		success: string;
		failure: string;
		pending: string;
	};
	auto_return: string;
	external_reference: string;
	notification_url?: string;
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

	// Crear preferencia de pago en Mercado Pago
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
		external_reference: sesion_id
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
