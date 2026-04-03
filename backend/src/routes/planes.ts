import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export default async function (fastify: FastifyInstance) {
  // GET /api/planes - Obtener todos los planes activos
  fastify.get<{
    Querystring: { tipo_usuario?: 'anonimo' | 'registrado' };
  }>('/', async (request, reply) => {
    const { tipo_usuario } = request.query;

    try {
      // Obtener planes activos
      const planes = await prisma.plan.findMany({
        where: { activo: true },
        orderBy: { precio_base: 'asc' },
      });

      // Calcular precio según tipo de usuario
      const planesConPrecio = planes.map((plan) => {
        let precioFinal = plan.precio_base;

        // Si es anónimo, aplicar recargo
        if (tipo_usuario === 'anonimo') {
          const recargo = Math.round((plan.precio_base * plan.recargo_anonimo_pct) / 100);
          precioFinal = plan.precio_base + recargo;
        }

        return {
          id: plan.id,
          nombre: plan.nombre,
          tipo_tirada: plan.tipo_tirada,
          num_cartas: plan.num_cartas,
          precio_base: plan.precio_base,
          recargo_anonimo_pct: plan.recargo_anonimo_pct,
          precio_final: precioFinal,
        };
      });

      return reply.status(200).send(planesConPrecio);
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo planes');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // GET /api/planes/:id - Obtener un plan por ID
  fastify.get<{
    Params: { id: string };
    Querystring: { tipo_usuario?: 'anonimo' | 'registrado' };
  }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { tipo_usuario } = request.query;

    try {
      const plan = await prisma.plan.findUnique({
        where: { id, activo: true },
      });

      if (!plan) {
        return reply.status(404).send({
          error: 'Plan no encontrado',
        });
      }

      let precioFinal = plan.precio_base;

      // Si es anónimo, aplicar recargo
      if (tipo_usuario === 'anonimo') {
        const recargo = Math.round((plan.precio_base * plan.recargo_anonimo_pct) / 100);
        precioFinal = plan.precio_base + recargo;
      }

      return reply.status(200).send({
        id: plan.id,
        nombre: plan.nombre,
        tipo_tirada: plan.tipo_tirada,
        num_cartas: plan.num_cartas,
        precio_base: plan.precio_base,
        recargo_anonimo_pct: plan.recargo_anonimo_pct,
        precio_final: precioFinal,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo plan');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });
}
