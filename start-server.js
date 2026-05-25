// Script de inicio para cargar variables de entorno en producción
import 'dotenv/config';
import { handler } from './handler.js';
import express from 'express';

const app = express();

// Configurar SvelteKit como middleware
app.use(handler);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Configurar ORIGIN si no está establecido
if (!process.env.ORIGIN) {
  process.env.ORIGIN = process.env.FRONTEND_URL || 'http://taroti.fun';
}

app.listen(PORT, HOST, () => {
  console.log(`✓ Taroti Server running on http://${HOST}:${PORT}`);
  console.log(`✓ ORIGIN: ${process.env.ORIGIN}`);
  console.log(`✓ FRONTEND_URL: ${process.env.FRONTEND_URL || 'No configurado'}`);
  console.log(`✓ Variables de entorno cargadas desde .env`);
  console.log(`✓ Mercado Pago: ${process.env.MERCADOPAGO_ACCESS_TOKEN ? 'Configurado' : 'NO configurado'}`);
  console.log(`✓ OpenAI: ${process.env.OPENAI_API_KEY ? 'Configurado' : 'NO configurado'}`);
});
