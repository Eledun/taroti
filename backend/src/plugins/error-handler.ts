import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export default async function (fastify: FastifyInstance) {
  fastify.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.error(error);

    // Error de validación
    if (error.validation) {
      return reply.status(400).send({
        error: 'Error de validación',
        detalles: error.validation,
      });
    }

    // Error de JWT
    if (error.statusCode === 401) {
      return reply.status(401).send({
        error: 'No autorizado',
        mensaje: error.message,
      });
    }

    // Error de permisos
    if (error.statusCode === 403) {
      return reply.status(403).send({
        error: 'Acceso denegado',
        mensaje: error.message,
      });
    }

    // Error no encontrado
    if (error.statusCode === 404) {
      return reply.status(404).send({
        error: 'No encontrado',
        mensaje: error.message,
      });
    }

    // Registrar error crítico en BD
    try {
      await prisma.error.create({
        data: {
          tipo: 'bd_fallo',
          mensaje: error.message,
          contexto_json: JSON.stringify({
            stack: error.stack,
            url: request.url,
            method: request.method,
          }),
          estado: 'pendiente',
        },
      });
    } catch (dbError) {
      fastify.log.error({ dbError }, 'Error al guardar error en BD');
    }

    // Error interno del servidor
    return reply.status(error.statusCode || 500).send({
      error: 'Error interno del servidor',
      mensaje: process.env.NODE_ENV === 'production' ? 'Ocurrió un error inesperado' : error.message,
    });
  });
}
