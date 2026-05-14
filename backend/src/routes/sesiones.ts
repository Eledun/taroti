import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export default async function (fastify: FastifyInstance) {
  // POST /api/sesiones - Crear nueva sesión
  fastify.post<{
    Body: {
      plan_id: string;
      pregunta: string;
      cartas: any[];
      sesion_origen_id?: string;
    };
    Headers: { authorization?: string };
  }>('/', async (request, reply) => {
    const { plan_id, pregunta, cartas, sesion_origen_id } = request.body;

    if (!plan_id || !pregunta || !cartas || cartas.length === 0) {
      return reply.status(400).send({
        error: 'Datos incompletos',
        mensaje: 'plan_id, pregunta y cartas son requeridos',
      });
    }

    try {
      // Verificar que el plan existe y está activo
      const plan = await prisma.plan.findUnique({
        where: { id: plan_id },
      });

      if (!plan || !plan.activo) {
        return reply.status(404).send({
          error: 'Plan no encontrado o inactivo',
        });
      }

      // Verificar que el número de cartas coincida con el plan
      if (cartas.length !== plan.num_cartas) {
        return reply.status(400).send({
          error: 'Número de cartas incorrecto',
          mensaje: `Este plan requiere ${plan.num_cartas} cartas`,
        });
      }

      // Todos los usuarios son anónimos ahora (sin autenticación)
      const tipo_usuario = 'anonimo';
      const usuario_id = null;

      // Precio único para todos (sin recargo)
      const precio_calculado = plan.precio_base;

      // Generar token de acceso único para esta sesión
      const tokenAcceso = crypto.randomBytes(32).toString('hex');
      const tokenAccesoHasheado = await bcrypt.hash(tokenAcceso, 10);

      // Crear sesión
      const sesion = await prisma.sesion.create({
        data: {
          usuario_id,
          plan_id,
          sesion_origen_id,
          tipo_usuario,
          pregunta,
          cartas_json: JSON.stringify(cartas),
          estado: 'pendiente',
          token_acceso: tokenAccesoHasheado,
          precio_calculado,
        },
      });

      // Devolver información de sesión
      return reply.status(201).send({
        sesion_id: sesion.id,
        precio: precio_calculado,
        estado: sesion.estado,
        tipo_usuario: sesion.tipo_usuario,
        ...(tipo_usuario === 'anonimo' && { token_acceso: tokenAcceso }),
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error creando sesión');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // GET /api/sesiones/:id - Obtener una sesión por ID
  fastify.get<{
    Params: { id: string };
    Querystring: { token_acceso?: string };
  }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { token_acceso } = request.query;

    try {
      const sesion = await prisma.sesion.findUnique({
        where: { id },
        include: {
          plan: true,
          lectura: true,
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

      // IMPORTANTE: Marcar lectura como expirada inmediatamente después de ser vista
      if (sesion.lectura && !sesion.lectura.expirada) {
        await prisma.lectura.update({
          where: { id: sesion.lectura.id },
          data: { expirada: true },
        });
      }

      return reply.status(200).send({
        id: sesion.id,
        pregunta: sesion.pregunta,
        cartas: JSON.parse(sesion.cartas_json),
        estado: sesion.estado,
        precio: sesion.precio_calculado,
        generando: sesion.generando,
        creado_en: sesion.creado_en,
        plan: {
          nombre: sesion.plan.nombre,
          tipo_tirada: sesion.plan.tipo_tirada,
        },
        lectura: sesion.lectura
          ? {
              id: sesion.lectura.id,
              ambito_detectado: sesion.lectura.ambito_detectado,
              interpretacion: sesion.lectura.interpretacion,
              expirada: true, // Siempre true ya que marcamos como expirada antes de devolver
              expira_en: sesion.lectura.expira_en,
            }
          : null,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo sesión');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });
}
