import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { verificarTokenGoogle } from '../services/google';
import { autenticarUsuario } from '../middlewares/auth';

export default async function (fastify: FastifyInstance) {
  // POST /api/auth/google - Login con Google
  fastify.post<{
    Body: { token: string };
  }>('/google', async (request, reply) => {
    const { token } = request.body;

    if (!token) {
      return reply.status(400).send({
        error: 'Token de Google requerido',
      });
    }

    try {
      // Verificar token con Google
      const googleUser = await verificarTokenGoogle(token);

      if (!googleUser) {
        return reply.status(401).send({
          error: 'Token de Google inválido',
        });
      }

      // Buscar o crear usuario
      let usuario = await prisma.usuario.findUnique({
        where: { google_id: googleUser.sub },
      });

      const ahora = new Date();
      const expiraEn = new Date();
      expiraEn.setDate(expiraEn.getDate() + 365); // 1 año

      const refreshTokenExpiraEn = new Date();
      refreshTokenExpiraEn.setDate(refreshTokenExpiraEn.getDate() + 30); // 30 días

      if (!usuario) {
        // Crear nuevo usuario
        usuario = await prisma.usuario.create({
          data: {
            google_id: googleUser.sub,
            email: googleUser.email,
            nombre: googleUser.name,
            expira_en: expiraEn,
          },
        });
      } else {
        // Actualizar última vez visto
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            nombre: googleUser.name,
            email: googleUser.email,
          },
        });
      }

      // Generar JWT
      const jwtToken = fastify.jwt.sign({
        id: usuario.id,
        email: usuario.email,
      });

      // Generar refresh token
      const refreshToken = fastify.jwt.sign(
        { id: usuario.id },
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
      );

      // Guardar refresh token en BD
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          refresh_token: refreshToken,
          refresh_token_expira_en: refreshTokenExpiraEn,
        },
      });

      return reply.status(200).send({
        token: jwtToken,
        refreshToken,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
        },
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error en autenticación con Google');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // POST /api/auth/refresh - Refrescar token
  fastify.post<{
    Body: { refreshToken: string };
  }>('/refresh', async (request, reply) => {
    const { refreshToken } = request.body;

    if (!refreshToken) {
      return reply.status(400).send({
        error: 'Refresh token requerido',
      });
    }

    try {
      // Verificar refresh token
      const decoded = fastify.jwt.verify(refreshToken) as { id: string };

      // Buscar usuario
      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.id },
      });

      if (!usuario) {
        return reply.status(401).send({
          error: 'Usuario no encontrado',
        });
      }

      // Verificar que el refresh token coincida
      if (usuario.refresh_token !== refreshToken) {
        return reply.status(401).send({
          error: 'Refresh token inválido',
        });
      }

      // Verificar que no haya expirado
      if (usuario.refresh_token_expira_en && usuario.refresh_token_expira_en < new Date()) {
        return reply.status(401).send({
          error: 'Refresh token expirado',
        });
      }

      // Generar nuevo JWT
      const nuevoToken = fastify.jwt.sign({
        id: usuario.id,
        email: usuario.email,
      });

      return reply.status(200).send({
        token: nuevoToken,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error refrescando token');
      return reply.status(401).send({
        error: 'Refresh token inválido o expirado',
      });
    }
  });

  // POST /api/auth/logout - Cerrar sesión
  fastify.post('/logout', { preHandler: autenticarUsuario }, async (request, reply) => {
    try {
      // Eliminar refresh token de BD
      await prisma.usuario.update({
        where: { id: request.userId },
        data: {
          refresh_token: null,
          refresh_token_expira_en: null,
        },
      });

      return reply.status(200).send({
        mensaje: 'Sesión cerrada exitosamente',
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error cerrando sesión');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });

  // GET /api/auth/me - Obtener usuario actual
  fastify.get('/me', { preHandler: autenticarUsuario }, async (request, reply) => {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: request.userId },
        select: {
          id: true,
          email: true,
          nombre: true,
          creado_en: true,
          expira_en: true,
        },
      });

      if (!usuario) {
        return reply.status(404).send({
          error: 'Usuario no encontrado',
        });
      }

      return reply.status(200).send(usuario);
    } catch (error) {
      fastify.log.error({ error }, 'Error obteniendo usuario');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });
}
