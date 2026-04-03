import Fastify from 'fastify';
import { prisma } from './lib/prisma';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
});

// Health check endpoint
app.get('/api/health', async (request, reply) => {
  try {
    // Verificar conexión a BD
    await prisma.$queryRaw`SELECT 1`;

    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      entorno: process.env.NODE_ENV,
      servicios: {
        base_de_datos: 'ok',
      },
    });
  } catch (error) {
    app.log.error('Health check falló — BD no disponible');
    return reply.status(503).send({
      status: 'error',
      timestamp: new Date().toISOString(),
      servicios: {
        base_de_datos: 'error',
      },
    });
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  app.log.info(`Señal ${signal} recibida — iniciando cierre ordenado`);

  await app.close();
  await prisma.$disconnect();

  app.log.info('Servidor cerrado correctamente');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  app.log.error({ reason }, 'Promesa rechazada no manejada');
});

process.on('uncaughtException', (error) => {
  app.log.fatal({ error }, 'Excepción no capturada — proceso terminando');
  process.exit(1);
});

// Iniciar servidor
const start = async () => {
  try {
    const PORT = Number(process.env.PORT) || 4000;
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`Servidor corriendo en http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
