import { prisma } from '../lib/prisma';

export interface ErrorData {
  tipo: 'openai_fallo' | 'webhook_fallo' | 'lectura_fallo' | 'bd_fallo';
  sesionId?: string;
  mensaje: string;
  contexto?: Record<string, any>;
}

export async function registrarError(data: ErrorData): Promise<void> {
  try {
    await prisma.error.create({
      data: {
        tipo: data.tipo,
        sesion_id: data.sesionId,
        mensaje: data.mensaje,
        contexto_json: data.contexto ? JSON.stringify(data.contexto) : null,
        estado: 'pendiente',
      },
    });

    console.error(`Error registrado: ${data.tipo} - ${data.mensaje}`);
  } catch (error) {
    console.error('Error al registrar error en BD:', error);
  }
}

export async function obtenerErroresPendientes() {
  return await prisma.error.findMany({
    where: { estado: 'pendiente' },
    orderBy: { creado_en: 'desc' },
    include: {
      sesion: {
        select: {
          id: true,
          pregunta: true,
          tipo_usuario: true,
          creado_en: true,
        },
      },
    },
  });
}

export async function marcarErrorComoResuelto(errorId: string): Promise<void> {
  await prisma.error.update({
    where: { id: errorId },
    data: {
      estado: 'resuelto',
      resuelto_en: new Date(),
    },
  });
}
