import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';

export default async function (fastify: FastifyInstance) {
  // POST /api/admin/auth/login - Login de admin
  fastify.post<{
    Body: { username: string; password: string };
  }>('/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.status(400).send({
        error: 'Usuario y contraseña requeridos',
      });
    }

    try {
      // Verificar credenciales
      const adminUser = process.env.ADMIN_USER;
      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

      if (!adminUser || !adminPasswordHash) {
        return reply.status(500).send({
          error: 'Configuración de admin incompleta',
        });
      }

      if (username !== adminUser) {
        return reply.status(401).send({
          error: 'Credenciales inválidas',
        });
      }

      const passwordValido = await bcrypt.compare(password, adminPasswordHash);

      if (!passwordValido) {
        return reply.status(401).send({
          error: 'Credenciales inválidas',
        });
      }

      // Generar token admin
      const token = fastify.adminJwtSign({
        username: adminUser,
      });

      return reply.status(200).send({
        token,
        username: adminUser,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error en login de admin');
      return reply.status(500).send({
        error: 'Error interno del servidor',
      });
    }
  });
}
