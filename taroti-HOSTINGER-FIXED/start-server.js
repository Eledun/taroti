// Script de inicio para cargar variables de entorno en producción
import 'dotenv/config';
import { handler } from './handler.js';
import express from 'express';

const app = express();

// Configurar SvelteKit como middleware
app.use(handler);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`ORIGIN: ${process.env.ORIGIN || 'No configurado'}`);
  console.log(`Variables de entorno cargadas desde .env`);
});
