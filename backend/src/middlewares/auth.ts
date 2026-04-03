import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

export async function autenticarUsuario(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    request.userId = (request.user as any).id;
  } catch (error) {
    return reply.status(401).send({
      error: 'No autorizado',
      mensaje: 'Token inválido o expirado',
    });
  }
}
