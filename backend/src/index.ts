import Fastify from 'fastify';
import { prisma } from './lib/prisma';
import { iniciarJobExpiracionLecturas } from './jobs/expirar-lecturas';

// Plugins
import corsPlugin from './plugins/cors';
import helmetPlugin from './plugins/helmet';
import rateLimitPlugin from './plugins/rate-limit';
import sensiblePlugin from './plugins/sensible';
import cookiePlugin from './plugins/cookie';
import jwtPlugin from './plugins/jwt';
import jwtAdminPlugin from './plugins/jwt-admin';
import errorHandlerPlugin from './plugins/error-handler';

// Rutas
import authRoutes from './routes/auth';
import planesRoutes from './routes/planes';
import sesionesRoutes from './routes/sesiones';
import pagosRoutes from './routes/pagos';
import lecturasRoutes from './routes/lecturas';

// Rutas Admin
import adminAuthRoutes from './routes/admin/auth';
import adminPlanesRoutes from './routes/admin/planes';
import adminConfigRoutes from './routes/admin/config';
import adminErroresRoutes from './routes/admin/errores';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
});

// Registrar plugins
async function registerPlugins() {
  // Orden importante: primero cors, helmet, rate-limit
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(rateLimitPlugin);
  await app.register(sensiblePlugin);
  await app.register(cookiePlugin);
  await app.register(jwtPlugin);
  await app.register(jwtAdminPlugin);
  await app.register(errorHandlerPlugin);
}

// Registrar rutas
async function registerRoutes() {
  // Rutas públicas
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(planesRoutes, { prefix: '/api/planes' });
  await app.register(sesionesRoutes, { prefix: '/api/sesiones' });
  await app.register(pagosRoutes, { prefix: '/api/pagos' });
  await app.register(lecturasRoutes, { prefix: '/api/lecturas' });

  // Rutas admin
  await app.register(adminAuthRoutes, { prefix: '/api/admin/auth' });
  await app.register(adminPlanesRoutes, { prefix: '/api/admin/planes' });
  await app.register(adminConfigRoutes, { prefix: '/api/admin/config' });
  await app.register(adminErroresRoutes, { prefix: '/api/admin/errores' });
}

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
    // Registrar plugins
    await registerPlugins();
    app.log.info('Plugins registrados');

    // Registrar rutas
    await registerRoutes();
    app.log.info('Rutas registradas');

    // Iniciar job de expiración de lecturas
    iniciarJobExpiracionLecturas();
    app.log.info('Jobs iniciados');

    const PORT = Number(process.env.PORT) || 4000;
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`Servidor corriendo en http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
