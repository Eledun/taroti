import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { autenticarAdmin } from '../../middlewares/auth-admin';
import { obtenerErroresPendientes, marcarErrorComoResuelto } from '../../services/errores';

export default async function (fastify: FastifyInstance) {
  // Todas las rutas requieren autenticación de admin
  fastify.addHook('preHandler', autenticarAdmin);

  // GET /api/admin/errores - Obtener todos los errores
  fastify.get<{
    Querystring: { estado?: 'pendiente' | 'resuelto' };
  }>('/', async (request, reply) => {
    const { estado } = request.query;

    try {
      const whereClause = estado ? { estado } : {};

      const errores = await prisma.error.findMany({
        where: whereClause,
        orderBy: { creado_en: 'desc' },
        take: 100,
        include: {
          sesion: {
            select: {
              id: true,
              pregunta: true,
              tipo_usuario: true,
              creado_en: true,
            },
          },
        },
      });

      return reply.status(200).send(errores);
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo errores');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // GET /api/admin/errores/pendientes - Obtener solo errores pendientes
  fastify.get('/pendientes', async (request, reply) => {
    try {
      const errores = await obtenerErroresPendientes();
      return reply.status(200).send(errores);
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo errores pendientes');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // PATCH /api/admin/errores/:id/resolver - Marcar error como resuelto
  fastify.patch<{
    Params: { id: string };
  }>('/:id/resolver', async (request, reply) => {
    const { id } = request.params;

    try {
      await marcarErrorComoResuelto(id);

      return reply.status(200).send({
        mensaje: 'Error marcado como resuelto',
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error marcando error como resuelto');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // GET /api/admin/errores/:id - Obtener detalles de un error
  fastify.get<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const error = await prisma.error.findUnique({
        where: { id },
        include: {
          sesion: true,
        },
      });

      if (!error) {
        return reply.status(404).send({
          error: 'Error no encontrado',
        });
      }

      return reply.status(200).send(error);
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo detalles del error');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });
}
