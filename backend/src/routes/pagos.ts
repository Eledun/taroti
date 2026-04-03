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
          mp_payment_id: 'pending',
          mp_preference_id: preference.id!,
          monto: sesion.precio_calculado,
          precio_cobrado: sesion.plan.precio_base,
          recargo_aplicado: sesion.tipo_usuario === 'anonimo' ? sesion.plan.recargo_anonimo_pct : 0,
          estado: 'pendiente',
        },
      });

      return reply.status(200).send({
        preference_id: preference.id,
        init_point:
          process.env.NODE_ENV === 'production' ? preference.init_point : preference.sandbox_init_point,
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
    Body: { type?: string; data?: { id?: string } };
    Headers: {
      'x-signature'?: string;
      'x-request-id'?: string;
    };
  }>('/webhook', async (request, reply) => {
    const { type, data } = request.body;
    const xSignature = request.headers['x-signature'];
    const xRequestId = request.headers['x-request-id'];

    fastify.log.info({ type, data }, 'Webhook recibido');

    try {
      // Verificar firma del webhook
      if (xSignature && xRequestId && data?.id) {
        const firmaValida = verificarWebhookSignature(xSignature, xRequestId, data.id);
        if (!firmaValida) {
          return reply.status(401).send({ error: 'Firma inválida' });
        }
      }

      // Solo procesar notificaciones de pago
      if (type === 'payment') {
        const paymentId = data.id;

        // Obtener información del pago
        const paymentInfo = await obtenerPago(paymentId);

        // Buscar el pago en BD por preference_id
        const pago = await prisma.pago.findFirst({
          where: { mp_preference_id: String(paymentInfo.id) || '' },
          include: { sesion: true },
        });

        if (!pago) {
          await registrarError({
            tipo: 'webhook_fallo',
            mensaje: `Pago no encontrado para preference_id: ${paymentInfo.id}`,
            contexto: { paymentInfo },
          });
          return reply.status(404).send({ error: 'Pago no encontrado' });
        }

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
