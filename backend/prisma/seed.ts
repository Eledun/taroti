import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear planes de tarot
  console.log('📋 Creando planes...');

  const planesData = [
    {
      nombre: 'Tres Cartas',
      tipo_tirada: 'tres_cartas',
      num_cartas: 3,
      precio_base: 5000, // $5.000 CLP
      recargo_anonimo_pct: 20, // 20% recargo para anónimos = $6.000
      activo: true,
    },
    {
      nombre: 'Cruz Celta',
      tipo_tirada: 'cruz_celta',
      num_cartas: 10,
      precio_base: 12000, // $12.000 CLP
      recargo_anonimo_pct: 20, // 20% recargo para anónimos = $14.400
      activo: true,
    },
    {
      nombre: 'Rueda del Año',
      tipo_tirada: 'rueda_del_anio',
      num_cartas: 13, // 12 meses + 1 carta central
      precio_base: 18000, // $18.000 CLP
      recargo_anonimo_pct: 20, // 20% recargo para anónimos = $21.600
      activo: true,
    },
  ];

  for (const planData of planesData) {
    const existingPlan = await prisma.plan.findFirst({
      where: { tipo_tirada: planData.tipo_tirada },
    });

    if (!existingPlan) {
      await prisma.plan.create({ data: planData });
      console.log(`  ✅ Plan "${planData.nombre}" creado`);
    } else {
      console.log(`  ⏭️  Plan "${planData.nombre}" ya existe`);
    }
  }

  // 2. Crear configuraciones de administrador por defecto
  console.log('\n⚙️  Creando configuraciones...');

  const configsData = [
    {
      clave: 'openai_system_prompt',
      valor: 'Eres un experto tarotista con años de experiencia. Proporciona lecturas detalladas, profundas y personalizadas basadas en las cartas que se te presentan y la consulta del usuario.',
    },
    {
      clave: 'mercadopago_webhook_url',
      valor: process.env.BACKEND_URL + '/pagos/webhook',
    },
  ];

  for (const configData of configsData) {
    const existingConfig = await prisma.configAdmin.findUnique({
      where: { clave: configData.clave },
    });

    if (!existingConfig) {
      await prisma.configAdmin.create({ data: configData });
      console.log(`  ✅ Config "${configData.clave}" creada`);
    } else {
      console.log(`  ⏭️  Config "${configData.clave}" ya existe`);
    }
  }

  console.log('\n✨ Seed completado exitosamente!');
  console.log('\n📊 Resumen:');
  const totalPlanes = await prisma.plan.count();
  const totalConfigs = await prisma.configAdmin.count();
  console.log(`  - Planes: ${totalPlanes}`);
  console.log(`  - Configuraciones: ${totalConfigs}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
