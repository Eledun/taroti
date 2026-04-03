import { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';

export default async function (fastify: FastifyInstance) {
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  });
}
