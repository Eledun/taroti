// Wrapper CommonJS para cargar el servidor ESM en Hostinger Passenger
// Este archivo es necesario porque Passenger requiere CommonJS pero nuestro build es ESM
const path = require('path');

// Cargar dotenv de forma CommonJS
require('dotenv').config();

// Importar dinámicamente el handler de SvelteKit
(async () => {
  try {
    const { handler } = await import('./build/handler.js');
    const express = (await import('express')).default;

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

    // Exportar app para Passenger
    module.exports = app;
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
})();
