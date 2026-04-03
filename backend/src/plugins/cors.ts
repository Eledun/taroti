import { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';

export default async function (fastify: FastifyInstance) {
  await fastify.register(fastifyCors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });
}
