import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createHmac } from 'node:crypto';

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

		// Parse payload para obtener info
		const payload = JSON.parse(body);

		// 2. Detectar notificaciones de prueba de Mercado Pago
		if (payload.id === '123456' || payload.data?.id === '123456') {
			console.log('[WEBHOOK] Notificación de prueba de Mercado Pago detectada - Aceptada');
			return json({ received: true, test: true }, { status: 200 });
		}

		// Si no hay firma, advertir pero continuar
		if (!xSignature) {
			console.warn('[WEBHOOK] Advertencia: Notificación sin firma (modo testing)');
		}

		// 3. Verificar firma HMAC SHA256 (solo si está presente y configurada)
		if (xSignature) {
			const secret = env.MERCADOPAGO_WEBHOOK_SECRET;

			// Si el secret es el de testing/placeholder, omitir validación de firma
			if (!secret || secret === 'test_webhook_secret_local' || secret.startsWith('PENDIENTE')) {
				console.warn('[WEBHOOK] Secret no configurado - OMITIENDO validación de firma (solo para testing)');
				console.warn('[WEBHOOK] IMPORTANTE: Configurar MERCADOPAGO_WEBHOOK_SECRET en producción');
			} else {
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
				// Formato: id:${data.id};request-id:${xRequestId};ts:${timestamp}
				const dataId = payload.data?.id || payload.id;
				const message = `id:${dataId};request-id:${xRequestId};ts:${timestamp}`;

				// Calcular HMAC SHA256
				const hmac = createHmac('sha256', secret);
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
			}
		}

		// 4. Procesar según el tipo de notificación
		const { type, action } = payload;

		console.log('[WEBHOOK] Tipo:', type, 'Acción:', action);

		if (type === 'payment') {
			// Obtener detalles del pago
			const paymentId = dataId;

			console.log('[WEBHOOK] Pago recibido:', paymentId);

			// Consultar el estado del pago a Mercado Pago
			const ACCESS_TOKEN = env.MERCADOPAGO_ACCESS_TOKEN;

			if (!ACCESS_TOKEN) {
				console.error('[WEBHOOK] MERCADOPAGO_ACCESS_TOKEN no configurado');
				throw error(500, 'Access token no configurado');
			}

			try {
				const pagoResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
					headers: {
						Authorization: `Bearer ${ACCESS_TOKEN}`
					}
				});

				if (!pagoResponse.ok) {
					console.error('[WEBHOOK] Error al consultar pago:', pagoResponse.statusText);
					throw error(500, 'Error al consultar estado del pago');
				}

				const pagoData = await pagoResponse.json();

				console.log('[WEBHOOK] Estado del pago:', {
					id: pagoData.id,
					status: pagoData.status,
					status_detail: pagoData.status_detail,
					external_reference: pagoData.external_reference
				});

				// Guardar/actualizar estado del pago en BD
				const sesionId = pagoData.external_reference;

				if (sesionId) {
					// Usar actualizarEstadoPago con todos los campos nuevos
					const { actualizarEstadoPago, registrarAuditLog } = await import('$lib/db.js');

					// Extraer detalles del pago
					const tipoPago = pagoData.payment_type_id || null; // credit_card, debit_card, etc.
					const metodoPago = pagoData.payment_method_id || null; // visa, mastercard, etc.
					const cuotas = pagoData.installments || 1;
					const montoNeto = pagoData.transaction_details?.net_received_amount || null;
					const feeMp = pagoData.fee_details?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || null;
					const fechaPago = pagoData.date_approved || pagoData.date_last_updated || null;

					// Actualizar con todos los datos
					await actualizarEstadoPago(
						sesionId,
						pagoData.status,
						pagoData.status_detail,
						{
							paymentIdMp: paymentId.toString(),
							tipoPago,
							metodoPago,
							cuotas,
							montoNeto,
							feeMp,
							fechaPago
						}
					);

					console.log('[WEBHOOK] Pago actualizado en BD:', {
						sesion: sesionId,
						estado: pagoData.status,
						metodo: metodoPago,
						cuotas,
						monto_neto: montoNeto
					});

					// Registrar evento específico en audit log
					await registrarAuditLog('webhook_pago_procesado', sesionId, {
						payment_id: paymentId.toString(),
						status: pagoData.status,
						status_detail: pagoData.status_detail,
						payment_type: tipoPago,
						payment_method: metodoPago,
						installments: cuotas,
						amount: pagoData.transaction_amount
					});
				}

				// Registrar evento de webhook para auditoría
				const { registrarWebhookEvent } = await import('$lib/db.js');
				await registrarWebhookEvent(
					paymentId.toString(),
					type,
					action || 'unknown',
					payload
				);
			} catch (err) {
				console.error('[WEBHOOK] Error procesando pago:', err);
				// No lanzar error para que MP reciba 200 OK
			}
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
