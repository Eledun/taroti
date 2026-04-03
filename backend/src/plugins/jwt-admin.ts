import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';

export default async function (fastify: FastifyInstance) {
  await fastify.register(fastifyJwt, {
    secret: process.env.ADMIN_JWT_SECRET as string,
    sign: {
      expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '4h',
    },
    namespace: 'admin',
    jwtDecode: 'adminJwtDecode',
    jwtSign: 'adminJwtSign',
    jwtVerify: 'adminJwtVerify',
  });
}
