import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import crypto from 'crypto';

/**
 * Webhook de Mercado Pago para notificaciones de pagos
 * Documentación: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// 1. Obtener headers y body
		const xSignature = request.headers.get('x-signature');
		const xRequestId = request.headers.get('x-request-id');
		const body = await request.text();

		console.log('[WEBHOOK] Recibido:', {
			signature: xSignature ? 'presente' : 'ausente',
			requestId: xRequestId,
			bodyLength: body.length
		});

		// 2. Verificar que tengamos la firma
		if (!xSignature) {
			console.error('[WEBHOOK] No se recibió x-signature header');
			throw error(401, 'Firma ausente');
		}

		// 3. Verificar firma HMAC SHA256
		const secret = env.MERCADOPAGO_WEBHOOK_SECRET;

		if (!secret || secret === 'PENDIENTE_CONFIGURAR_AL_CREAR_WEBHOOK') {
			console.error('[WEBHOOK] MERCADOPAGO_WEBHOOK_SECRET no configurado');
			throw error(500, 'Webhook secret no configurado');
		}

		// Parsear la firma (formato: ts=123456789,v1=hash)
		const parts = xSignature.split(',');
		const tsMatch = parts.find(p => p.startsWith('ts='));
		const v1Match = parts.find(p => p.startsWith('v1='));

		if (!tsMatch || !v1Match) {
			console.error('[WEBHOOK] Formato de firma inválido');
			throw error(401, 'Formato de firma inválido');
		}

		const timestamp = tsMatch.split('=')[1];
		const receivedHash = v1Match.split('=')[1];

		// Crear el mensaje firmado según documentación de MP
		// Formato: id:${data.id}request-id:${xRequestId}ts:${timestamp}
		const payload = JSON.parse(body);
		const dataId = payload.data?.id || payload.id;

		const message = `id:${dataId};request-id:${xRequestId};ts:${timestamp}`;

		// Calcular HMAC SHA256
		const hmac = crypto.createHmac('sha256', secret);
		hmac.update(message);
		const calculatedHash = hmac.digest('hex');

		// Comparar hashes
		if (calculatedHash !== receivedHash) {
			console.error('[WEBHOOK] Firma inválida', {
				received: receivedHash,
				calculated: calculatedHash,
				message
			});
			throw error(401, 'Firma inválida');
		}

		console.log('[WEBHOOK] Firma verificada correctamente');

		// 4. Procesar según el tipo de notificación
		const { type, action } = payload;

		console.log('[WEBHOOK] Tipo:', type, 'Acción:', action);

		if (type === 'payment') {
			// Obtener detalles del pago
			const paymentId = dataId;

			console.log('[WEBHOOK] Pago recibido:', paymentId);

			// Aquí normalmente consultarías el estado del pago a MP
			// y actualizarías tu base de datos o generarías la lectura

			// Por ahora solo logueamos
			console.log('[WEBHOOK] Pago procesado:', {
				paymentId,
				action,
				timestamp: new Date().toISOString()
			});
		}

		// 5. Responder 200 OK (MP requiere esto)
		return json({ received: true }, { status: 200 });

	} catch (err) {
		console.error('[WEBHOOK] Error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, 'Error procesando webhook');
	}
};

/**
 * GET no permitido, solo POST
 */
export const GET: RequestHandler = async () => {
	return json({
		message: 'Endpoint de webhook de Mercado Pago. Solo acepta POST.',
		status: 'active'
	}, { status: 200 });
};
