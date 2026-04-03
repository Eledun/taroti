import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { autenticarAdmin } from '../../middlewares/auth-admin';

export default async function (fastify: FastifyInstance) {
  // Todas las rutas requieren autenticación de admin
  fastify.addHook('preHandler', autenticarAdmin);

  // GET /api/admin/planes - Obtener todos los planes (incluyendo inactivos)
  fastify.get('/', async (request, reply) => {
    try {
      const planes = await prisma.plan.findMany({
        orderBy: { creado_en: 'desc' },
      });

      return reply.status(200).send(planes);
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo planes');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // POST /api/admin/planes - Crear nuevo plan
  fastify.post<{
    Body: {
      nombre: string;
      tipo_tirada: string;
      num_cartas: number;
      precio_base: number;
      recargo_anonimo_pct: number;
    };
  }>('/', async (request, reply) => {
    const { nombre, tipo_tirada, num_cartas, precio_base, recargo_anonimo_pct } = request.body;

    if (!nombre || !tipo_tirada || !num_cartas || !precio_base || recargo_anonimo_pct === undefined) {
      return reply.status(400).send({
        error: 'Todos los campos son requeridos',
      });
    }

    try {
      const plan = await prisma.plan.create({
        data: {
          nombre,
          tipo_tirada,
          num_cartas,
          precio_base,
          recargo_anonimo_pct,
          activo: true,
        },
      });

      return reply.status(201).send(plan);
    } catch (error) {
      fastify.log.error({ error }, 'Error creando plan');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // PUT /api/admin/planes/:id - Actualizar plan
  fastify.put<{
    Params: { id: string };
    Body: {
      nombre?: string;
      tipo_tirada?: string;
      num_cartas?: number;
      precio_base?: number;
      recargo_anonimo_pct?: number;
      activo?: boolean;
    };
  }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const updateData = request.body;

    try {
      const plan = await prisma.plan.update({
        where: { id },
        data: updateData,
      });

      return reply.status(200).send(plan);
    } catch (error) {
      fastify.log.error({ error }, 'Error actualizando plan');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // DELETE /api/admin/planes/:id - Eliminar plan (soft delete - marcar como inactivo)
  fastify.delete<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      await prisma.plan.update({
        where: { id },
        data: { activo: false },
      });

      return reply.status(200).send({
        mensaje: 'Plan desactivado exitosamente',
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error eliminando plan');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });
}
