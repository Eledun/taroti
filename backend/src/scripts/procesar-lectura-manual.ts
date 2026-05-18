import { agregarLecturaACola } from '../services/cola-lecturas';

const sesionId = process.argv[2];

if (!sesionId) {
  console.error('❌ Error: Debes proporcionar un ID de sesión');
  console.error('Uso: npx tsx src/scripts/procesar-lectura-manual.ts <sesion_id>');
  process.exit(1);
}

console.log(`🔮 Procesando lectura para sesión: ${sesionId}...`);

agregarLecturaACola(sesionId)
  .then(() => {
    console.log('✅ Lectura procesada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error procesando lectura:', error);
    process.exit(1);
  });
