import { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

export default async function (fastify: FastifyInstance) {
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    cache: 10000,
    allowList: ['127.0.0.1'],
    skipOnError: false,
  });
}
