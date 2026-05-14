import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

declare module 'fastify' {
  interface FastifyRequest {
    adminUser?: string;
  }
}

export async function autenticarAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'No autorizado',
        mensaje: 'Token de admin requerido',
      });
    }

    const token = authHeader.substring(7);
    const adminJwtSecret = process.env.ADMIN_JWT_SECRET;

    if (!adminJwtSecret) {
      return reply.status(500).send({
        error: 'Error de configuración',
      });
    }

    const decoded = jwt.verify(token, adminJwtSecret) as { username: string };
    request.adminUser = decoded.username;
  } catch (error) {
    return reply.status(401).send({
      error: 'No autorizado',
      mensaje: 'Token de admin inválido o expirado',
    });
  }
}
