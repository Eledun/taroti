import { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';

export default async function (fastify: FastifyInstance) {
  // En desarrollo, desactivar Helmet completamente para evitar conflictos con CORS
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  // En producción, configurar Helmet con CORS habilitado
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Desactivar CSP ya que puede bloquear recursos
    crossOriginResourcePolicy: false, // CRÍTICO: No bloquear CORS
    crossOriginEmbedderPolicy: false, // CRÍTICO: No bloquear embeds cross-origin
    crossOriginOpenerPolicy: false, // CRÍTICO: No bloquear popups cross-origin
  });
}
