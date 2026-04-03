import { FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';

export default async function (fastify: FastifyInstance) {
  await fastify.register(fastifyCookie, {
    secret: process.env.JWT_SECRET,
    parseOptions: {},
  });
}
