import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    adminUser?: string;
  }
}

export async function autenticarAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.adminJwtVerify();
    request.adminUser = (request.user as any).username;
  } catch (error) {
    return reply.status(401).send({
      error: 'No autorizado',
      mensaje: 'Token de admin inválido o expirado',
    });
  }
}
