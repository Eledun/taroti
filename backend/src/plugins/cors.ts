import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  // Hook onRequest para manejar OPTIONS preflight
  fastify.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;

    // Solo manejamos OPTIONS aquí
    if (request.method === 'OPTIONS') {
      // En desarrollo, permitir todos los orígenes
      if (process.env.NODE_ENV === 'development') {
        reply.header('Access-Control-Allow-Origin', origin || '*');
        reply.header('Access-Control-Allow-Credentials', 'true');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        reply.header('Access-Control-Expose-Headers', 'Content-Type, Authorization');
        reply.header('Vary', 'Origin');
        return reply.status(204).send();
      }

      // En producción, validar orígenes permitidos
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
      ];

      if (origin && allowedOrigins.includes(origin)) {
        reply.header('Access-Control-Allow-Origin', origin);
        reply.header('Access-Control-Allow-Credentials', 'true');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        reply.header('Access-Control-Expose-Headers', 'Content-Type, Authorization');
        reply.header('Vary', 'Origin');
        return reply.status(204).send();
      } else {
        return reply.status(403).send({ error: 'Not allowed by CORS' });
      }
    }
  });

  // Hook onSend para agregar headers CORS a TODAS las respuestas (GET, POST, etc.)
  fastify.addHook('onSend', async (request, reply, payload) => {
    const origin = request.headers.origin;

    fastify.log.info({ origin, method: request.method, url: request.url }, 'CORS onSend hook ejecutando');

    // En desarrollo, permitir todos los orígenes
    if (process.env.NODE_ENV === 'development') {
      reply.header('Access-Control-Allow-Origin', origin || '*');
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Expose-Headers', 'Content-Type, Authorization');
      reply.header('Vary', 'Origin');
      fastify.log.info('CORS headers agregados en desarrollo');
      return payload;
    }

    // En producción, validar orígenes permitidos
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
    ];

    if (origin && allowedOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Expose-Headers', 'Content-Type, Authorization');
      reply.header('Vary', 'Origin');
      fastify.log.info('CORS headers agregados en producción');
    }

    return payload;
  });
}
