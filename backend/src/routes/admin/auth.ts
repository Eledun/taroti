import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
      const adminJwtSecret = process.env.ADMIN_JWT_SECRET;

      if (!adminUser || !adminPasswordHash || !adminJwtSecret) {
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

      // Generar token admin - expires in 4 hours (14400 seconds)
      const token = jwt.sign(
        { username: adminUser },
        adminJwtSecret,
        { expiresIn: 14400 }
      );

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
