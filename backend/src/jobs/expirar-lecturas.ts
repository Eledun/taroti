import cron from 'node-cron';
import { prisma } from '../lib/prisma';

export function iniciarJobExpiracionLecturas() {
  // Ejecutar todos los días a las 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('[JOB] Iniciando expiración de lecturas...');

    try {
      const ahora = new Date();

      // Buscar lecturas que deben expirar
      const lecturasAExpirar = await prisma.lectura.findMany({
        where: {
          expirada: false,
          expira_en: {
            lte: ahora,
          },
        },
      });

      if (lecturasAExpirar.length === 0) {
        console.log('[JOB] No hay lecturas para expirar');
        return;
      }

      // Marcar lecturas como expiradas
      const resultado = await prisma.lectura.updateMany({
        where: {
          id: {
            in: lecturasAExpirar.map((l) => l.id),
          },
        },
        data: {
          expirada: true,
        },
      });

      console.log(`[JOB] ${resultado.count} lecturas marcadas como expiradas`);

      // Opcional: marcar sesiones como abandonadas si están pendientes después de 30 días
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);

      const sesionesAbandonadas = await prisma.sesion.updateMany({
        where: {
          estado: 'pendiente',
          creado_en: {
            lte: hace30Dias,
          },
        },
        data: {
          estado: 'abandonada',
        },
      });

      if (sesionesAbandonadas.count > 0) {
        console.log(`[JOB] ${sesionesAbandonadas.count} sesiones marcadas como abandonadas`);
      }
    } catch (error) {
      console.error('[JOB] Error expirando lecturas:', error);
    }
  });

  console.log('[JOB] Job de expiración de lecturas programado para las 3:00 AM diariamente');
}
