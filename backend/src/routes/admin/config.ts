import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { autenticarAdmin } from '../../middlewares/auth-admin';

export default async function (fastify: FastifyInstance) {
  // Todas las rutas requieren autenticación de admin
  fastify.addHook('preHandler', autenticarAdmin);

  // GET /api/admin/config - Obtener todas las configuraciones
  fastify.get('/', async (request, reply) => {
    try {
      const configs = await prisma.configAdmin.findMany({
        orderBy: { clave: 'asc' },
      });

      return reply.status(200).send(configs);
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo configuraciones');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // GET /api/admin/config/:clave - Obtener una configuración por clave
  fastify.get<{
    Params: { clave: string };
  }>('/:clave', async (request, reply) => {
    const { clave } = request.params;

    try {
      const config = await prisma.configAdmin.findUnique({
        where: { clave },
      });

      if (!config) {
        return reply.status(404).send({
          error: 'Configuración no encontrada',
        });
      }

      return reply.status(200).send(config);
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo configuración');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // POST /api/admin/config - Crear o actualizar configuración
  fastify.post<{
    Body: { clave: string; valor: string };
  }>('/', async (request, reply) => {
    const { clave, valor } = request.body;

    if (!clave || valor === undefined) {
      return reply.status(400).send({
        error: 'clave y valor son requeridos',
      });
    }

    try {
      const config = await prisma.configAdmin.upsert({
        where: { clave },
        update: { valor },
        create: { clave, valor },
      });

      return reply.status(200).send(config);
    } catch (error) {
      fastify.log.error({ error }, 'Error guardando configuración');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // DELETE /api/admin/config/:clave - Eliminar configuración
  fastify.delete<{
    Params: { clave: string };
  }>('/:clave', async (request, reply) => {
    const { clave } = request.params;

    try {
      await prisma.configAdmin.delete({
        where: { clave },
      });

      return reply.status(200).send({
        mensaje: 'Configuración eliminada exitosamente',
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error eliminando configuración');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });
}
