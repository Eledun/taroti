import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';

export default async function (fastify: FastifyInstance) {
  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET as string,
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  });
}
