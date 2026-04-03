import PQueue from 'p-queue';
import { prisma } from '../lib/prisma';
import { generarLectura, CartaTarot } from './openai';
import { registrarError } from './errores';

// Cola con concurrencia 1 para evitar saturar OpenAI
const cola = new PQueue({ concurrency: 1 });

export async function agregarLecturaACola(sesionId: string): Promise<void> {
  await cola.add(async () => {
    try {
      // Obtener sesión con plan
      const sesion = await prisma.sesion.findUnique({
        where: { id: sesionId },
        include: { plan: true },
      });

      if (!sesion) {
        throw new Error(`Sesión ${sesionId} no encontrada`);
      }

      // Verificar que la sesión esté pagada
      if (sesion.estado !== 'pagada') {
        throw new Error(`Sesión ${sesionId} no está pagada`);
      }

      // Verificar que no esté generando
      if (sesion.generando) {
        console.log(`Sesión ${sesionId} ya está generando`);
        return;
      }

      // Verificar que no tenga lectura
      const lecturaExistente = await prisma.lectura.findUnique({
        where: { sesion_id: sesionId },
      });

      if (lecturaExistente) {
        console.log(`Sesión ${sesionId} ya tiene lectura`);
        return;
      }

      // Marcar como generando
      await prisma.sesion.update({
        where: { id: sesionId },
        data: { generando: true },
      });

      // Parsear cartas
      const cartas: CartaTarot[] = JSON.parse(sesion.cartas_json);

      // Generar lectura con OpenAI
      const lecturaGenerada = await generarLectura(sesion.pregunta, cartas, sesion.plan.tipo_tirada);

      // Calcular fecha de expiración
      let expiraEn: Date | null = null;
      if (sesion.tipo_usuario === 'anonimo') {
        // Anónimos: expira en 7 días
        expiraEn = new Date();
        expiraEn.setDate(expiraEn.getDate() + 7);
      }
      // Registrados: no expira (null)

      // Guardar lectura en BD
      await prisma.lectura.create({
        data: {
          sesion_id: sesionId,
          usuario_id: sesion.usuario_id,
          ambito_detectado: lecturaGenerada.ambito_detectado,
          interpretacion: lecturaGenerada.interpretacion,
          expira_en: expiraEn,
        },
      });

      // Actualizar sesión
      await prisma.sesion.update({
        where: { id: sesionId },
        data: {
          estado: 'completada',
          generando: false,
        },
      });

      console.log(`Lectura generada exitosamente para sesión ${sesionId}`);
    } catch (error) {
      console.error(`Error generando lectura para sesión ${sesionId}:`, error);

      // Registrar error en BD
      await registrarError({
        tipo: 'lectura_fallo',
        sesionId,
        mensaje: error instanceof Error ? error.message : 'Error desconocido',
        contexto: { error: String(error) },
      });

      // Marcar sesión como no generando
      await prisma.sesion.update({
        where: { id: sesionId },
        data: { generando: false },
      });
    }
  });
}

export function obtenerEstadoCola() {
  return {
    size: cola.size,
    pending: cola.pending,
    isPaused: cola.isPaused,
  };
}
