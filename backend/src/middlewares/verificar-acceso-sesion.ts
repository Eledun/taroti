import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

interface VerificarAccesoParams {
  sesionId: string;
  tokenAcceso?: string;
}

export async function verificarAccesoSesion(request: FastifyRequest, reply: FastifyReply) {
  const { sesionId, tokenAcceso } = request.query as VerificarAccesoParams;

  if (!sesionId) {
    return reply.status(400).send({
      error: 'Sesión ID requerido',
    });
  }

  try {
    // Buscar sesión
    const sesion = await prisma.sesion.findUnique({
      where: { id: sesionId },
    });

    if (!sesion) {
      return reply.status(404).send({
        error: 'Sesión no encontrada',
      });
    }

    // Si es usuario registrado, verificar JWT
    if (sesion.tipo_usuario === 'registrado') {
      try {
        await request.jwtVerify();
        const userId = (request.user as any).id;

        // Verificar que la sesión pertenezca al usuario
        if (sesion.usuario_id !== userId) {
          return reply.status(403).send({
            error: 'Acceso denegado',
            mensaje: 'Esta sesión no te pertenece',
          });
        }

        // Usuario autorizado
        return;
      } catch (error) {
        return reply.status(401).send({
          error: 'No autorizado',
          mensaje: 'Token inválido o expirado',
        });
      }
    }

    // Si es usuario anónimo, verificar token de acceso
    if (sesion.tipo_usuario === 'anonimo') {
      if (!tokenAcceso) {
        return reply.status(401).send({
          error: 'Token de acceso requerido',
          mensaje: 'Debes proporcionar el token de acceso para usuarios anónimos',
        });
      }

      // Verificar token hasheado
      const tokenValido = await bcrypt.compare(tokenAcceso, sesion.token_acceso);

      if (!tokenValido) {
        return reply.status(403).send({
          error: 'Acceso denegado',
          mensaje: 'Token de acceso inválido',
        });
      }

      // Token válido
      return;
    }

    // Tipo de usuario no reconocido
    return reply.status(500).send({
      error: 'Error interno',
      mensaje: 'Tipo de usuario no reconocido',
    });
  } catch (error) {
    console.error('Error verificando acceso a sesión:', error);
    return reply.status(500).send({
      error: 'Error interno del servidor',
    });
  }
}
