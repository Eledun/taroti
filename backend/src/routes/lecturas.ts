import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { autenticarUsuario } from '../middlewares/auth';
import bcrypt from 'bcrypt';

export default async function (fastify: FastifyInstance) {
  // GET /api/lecturas/:sesion_id - Obtener lectura por sesión
  fastify.get<{
    Params: { sesion_id: string };
    Querystring: { token_acceso?: string };
  }>('/:sesion_id', async (request, reply) => {
    const { sesion_id } = request.params;
    const { token_acceso } = request.query;

    try {
      // Buscar sesión
      const sesion = await prisma.sesion.findUnique({
        where: { id: sesion_id },
        include: {
          lectura: true,
          plan: true,
        },
      });

      if (!sesion) {
        return reply.status(404).send({
          error: 'Sesión no encontrada',
        });
      }

      // Verificar acceso
      if (sesion.tipo_usuario === 'registrado') {
        try {
          await request.jwtVerify();
          const userId = (request.user as any).id;

          if (sesion.usuario_id !== userId) {
            return reply.status(403).send({
              error: 'Acceso denegado',
            });
          }
        } catch (error) {
          return reply.status(401).send({
            error: 'No autorizado',
          });
        }
      } else if (sesion.tipo_usuario === 'anonimo') {
        if (!token_acceso) {
          return reply.status(401).send({
            error: 'Token de acceso requerido',
          });
        }

        const tokenValido = await bcrypt.compare(token_acceso, sesion.token_acceso);
        if (!tokenValido) {
          return reply.status(403).send({
            error: 'Token de acceso inválido',
          });
        }
      }

      // Verificar que la lectura existe
      if (!sesion.lectura) {
        return reply.status(404).send({
          error: 'Lectura no disponible',
          mensaje: sesion.generando ? 'La lectura se está generando' : 'La lectura no ha sido generada',
          generando: sesion.generando,
        });
      }

      // Verificar si la lectura ha expirado
      if (sesion.lectura.expirada || (sesion.lectura.expira_en && sesion.lectura.expira_en < new Date())) {
        return reply.status(410).send({
          error: 'Lectura expirada',
          mensaje: 'Esta lectura ha expirado. Los usuarios registrados no tienen lecturas que expiren.',
        });
      }

      return reply.status(200).send({
        id: sesion.lectura.id,
        sesion_id: sesion.id,
        pregunta: sesion.pregunta,
        cartas: JSON.parse(sesion.cartas_json),
        ambito_detectado: sesion.lectura.ambito_detectado,
        interpretacion: sesion.lectura.interpretacion,
        creado_en: sesion.lectura.creado_en,
        expira_en: sesion.lectura.expira_en,
        plan: {
          nombre: sesion.plan.nombre,
          tipo_tirada: sesion.plan.tipo_tirada,
        },
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo lectura');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // GET /api/lecturas - Obtener historial de lecturas (solo usuarios registrados)
  fastify.get('/', { preHandler: autenticarUsuario }, async (request, reply) => {
    try {
      const lecturas = await prisma.lectura.findMany({
        where: {
          usuario_id: request.userId,
          expirada: false,
        },
        include: {
          sesion: {
            include: {
              plan: true,
            },
          },
        },
        orderBy: {
          creado_en: 'desc',
        },
      });

      const lecturasFormateadas = lecturas.map((lectura) => ({
        id: lectura.id,
        sesion_id: lectura.sesion_id,
        pregunta: lectura.sesion.pregunta,
        ambito_detectado: lectura.ambito_detectado,
        creado_en: lectura.creado_en,
        plan: {
          nombre: lectura.sesion.plan.nombre,
          tipo_tirada: lectura.sesion.plan.tipo_tirada,
        },
      }));

      return reply.status(200).send(lecturasFormateadas);
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo historial de lecturas');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });
}
