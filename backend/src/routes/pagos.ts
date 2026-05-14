import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { crearPreferencia, obtenerPago, verificarWebhookSignature } from '../services/mercadopago';
import { agregarLecturaACola } from '../services/cola-lecturas';
import { registrarError } from '../services/errores';

export default async function (fastify: FastifyInstance) {
  // POST /api/pagos/preference - Crear preferencia de pago
  fastify.post<{
    Body: { sesion_id: string };
  }>('/preference', async (request, reply) => {
    const { sesion_id } = request.body;

    if (!sesion_id) {
      return reply.status(400).send({
        error: 'sesion_id requerido',
      });
    }

    try {
      // Obtener sesión
      const sesion = await prisma.sesion.findUnique({
        where: { id: sesion_id },
        include: { plan: true },
      });

      if (!sesion) {
        return reply.status(404).send({
          error: 'Sesión no encontrada',
        });
      }

      // Verificar que la sesión esté pendiente
      if (sesion.estado !== 'pendiente') {
        return reply.status(400).send({
          error: 'La sesión no está pendiente de pago',
        });
      }

      // Crear preferencia en Mercado Pago
      const preference = await crearPreferencia({
        titulo: `Taroti - ${sesion.plan.nombre}`,
        descripcion: `Lectura de tarot: ${sesion.plan.tipo_tirada}`,
        monto: sesion.precio_calculado,
        sesionId: sesion.id,
        backUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      });

      // Crear registro de pago en BD
      await prisma.pago.create({
        data: {
          sesion_id: sesion.id,
          mp_payment_id: null, // Se actualizará cuando recibamos el webhook
          mp_preference_id: preference.id!,
          monto: sesion.precio_calculado,
          precio_cobrado: sesion.plan.precio_base,
          recargo_aplicado: sesion.tipo_usuario === 'anonimo' ? sesion.plan.recargo_anonimo_pct : 0,
          estado: 'pendiente',
        },
      });

      return reply.status(200).send({
        preference_id: preference.id,
        init_point: preference.init_point, // El SDK ya devuelve la URL correcta según las credenciales
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error creando preferencia');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // POST /api/pagos/webhook - Webhook de Mercado Pago
  fastify.post<{
    Body: { type?: string; action?: string; data?: { id?: string } };
    Querystring: { 'data.id'?: string; type?: string };
    Headers: {
      'x-signature'?: string;
      'x-request-id'?: string;
    };
  }>('/webhook', async (request, reply) => {
    const { type, action, data } = request.body;
    const queryParams = request.query;
    const xSignature = request.headers['x-signature'];
    const xRequestId = request.headers['x-request-id'];

    // Mercado Pago puede enviar el data.id por query params o por body
    const dataId = queryParams['data.id'] || data?.id;

    fastify.log.info(
      {
        body: { type, action, data },
        query: queryParams,
        headers: { 'x-signature': xSignature, 'x-request-id': xRequestId },
      },
      'Webhook recibido'
    );

    try {
      // Verificar firma del webhook (solo en producción)
      if (process.env.NODE_ENV === 'production') {
        if (xSignature && xRequestId && dataId) {
          const firmaValida = verificarWebhookSignature(xSignature, xRequestId, dataId);
          if (!firmaValida) {
            fastify.log.warn('Firma del webhook inválida');
            return reply.status(401).send({ error: 'Firma inválida' });
          }
          fastify.log.info('Firma del webhook verificada correctamente');
        } else {
          fastify.log.warn({
            hasSignature: !!xSignature,
            hasRequestId: !!xRequestId,
            hasDataId: !!dataId,
          }, 'Webhook sin firma o datos incompletos');
          return reply.status(401).send({ error: 'Firma requerida' });
        }
      } else {
        // En desarrollo, permitir webhooks sin firma (para simulador de MP)
        fastify.log.info('[DEV MODE] Webhook recibido sin verificación de firma');
      }

      // Solo procesar notificaciones de pago
      if (type === 'payment' && data?.id) {
        const paymentId = data.id;

        // Obtener información del pago
        const paymentInfo = await obtenerPago(paymentId);

        fastify.log.info({ paymentInfo }, 'Información del pago obtenida');

        // Buscar el pago en BD por external_reference (que es el sesion_id)
        const externalReference = paymentInfo.external_reference;
        if (!externalReference) {
          await registrarError({
            tipo: 'webhook_fallo',
            mensaje: 'No se encontró external_reference en el pago',
            contexto: { paymentInfo },
          });
          return reply.status(400).send({ error: 'External reference no encontrado' });
        }

        const sesion = await prisma.sesion.findUnique({
          where: { id: externalReference },
          include: { pagos: true },
        });

        if (!sesion) {
          await registrarError({
            tipo: 'webhook_fallo',
            mensaje: `Sesión no encontrada para external_reference: ${externalReference}`,
            contexto: { paymentInfo },
          });
          return reply.status(404).send({ error: 'Sesión no encontrada' });
        }

        // Buscar el pago pendiente de esta sesión
        const pago = sesion.pagos.find(p => p.estado === 'pendiente');

        if (!pago) {
          await registrarError({
            tipo: 'webhook_fallo',
            mensaje: `No se encontró pago pendiente para la sesión: ${externalReference}`,
            contexto: { paymentInfo, sesion_id: externalReference },
          });
          return reply.status(404).send({ error: 'Pago pendiente no encontrado' });
        }

        fastify.log.info({ pago_id: pago.id, mp_payment_id: paymentId }, 'Pago encontrado, actualizando...');

        // Actualizar pago en BD
        await prisma.pago.update({
          where: { id: pago.id },
          data: {
            mp_payment_id: paymentId,
            estado: paymentInfo.status === 'approved' ? 'aprobado' : paymentInfo.status || 'pendiente',
          },
        });

        // Si el pago fue aprobado, marcar sesión como pagada y agregar a cola
        if (paymentInfo.status === 'approved') {
          await prisma.sesion.update({
            where: { id: pago.sesion_id },
            data: { estado: 'pagada' },
          });

          // Agregar lectura a cola
          await agregarLecturaACola(pago.sesion_id);

          fastify.log.info(`Pago aprobado - Sesión ${pago.sesion_id} agregada a cola de lecturas`);
        }
      }

      return reply.status(200).send({ received: true });
    } catch (error) {
      fastify.log.error({ error }, 'Error procesando webhook');

      await registrarError({
        tipo: 'webhook_fallo',
        mensaje: error instanceof Error ? error.message : 'Error desconocido',
        contexto: { body: request.body, error: String(error) },
      });

      return reply.status(500).send({ error: 'Error procesando webhook' });
    }
  });
}
