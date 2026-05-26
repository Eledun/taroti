# 🔮 Taroti

Plataforma web de lecturas de tarot personalizadas.

## Descripción

Taroti es una aplicación web que ofrece lecturas de tarot personalizadas. Los usuarios pueden elegir entre tres tipos de tiradas, realizar su consulta, pagar de forma segura con Mercado Pago y recibir una interpretación detallada generada con IA.

## Características principales

- **Tres tipos de tirada**: Tres Cartas, Cruz Celta y Rueda del Año
- **Lecturas personalizadas**: Interpretaciones profundas y detalladas generadas con OpenAI GPT-4o
- **Modalidad anónima**: Sin necesidad de registro, pago directo
- **Pagos seguros**: Integración con Mercado Pago (Chile)
- **Arquitectura simplificada**: Todo en una aplicación SvelteKit, sin base de datos
- **Sesiones temporales**: Datos almacenados en sessionStorage del navegador

## Stack tecnológico

### Aplicación
- **Framework**: SvelteKit 5 con adapter-node
- **Runtime**: Node.js 22
- **Tipografía**: Cinzel (Google Fonts)
- **Deployment**: Node.js server (SSR + API endpoints)

### Integraciones
- **Pagos**: Mercado Pago API REST
- **IA**: OpenAI GPT-4o para generación de lecturas
- **Hosting**: Hostinger Business con Node.js

## Arquitectura

Esta aplicación utiliza una **arquitectura simplificada** con SvelteKit:

- **Sin base de datos**: Los planes están hardcodeados en el código
- **Sin backend separado**: API endpoints integrados en SvelteKit (+server.ts)
- **Sesiones temporales**: Uso de sessionStorage para datos de consulta
- **Stateless**: Cada lectura es independiente

## Estructura del proyecto

```
taroti/
├── frontend/                    # Aplicación SvelteKit completa
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/      # Componentes UI
│   │   │   ├── data/
│   │   │   │   ├── arcanos-mayores.ts
│   │   │   │   └── planes.ts    # Planes hardcodeados
│   │   │   ├── services/
│   │   │   │   └── api.ts       # Cliente API interno
│   │   │   └── types/           # TypeScript types
│   │   ├── routes/
│   │   │   ├── api/             # Server endpoints
│   │   │   │   ├── planes/+server.ts
│   │   │   │   ├── sesiones/+server.ts
│   │   │   │   ├── pagos/+server.ts
│   │   │   │   └── lecturas/+server.ts
│   │   │   └── [páginas .svelte]
│   │   └── app.css
│   ├── static/                  # Imágenes y audios
│   ├── build/                   # Output de producción
│   ├── .env                     # Variables de entorno
│   └── package.json
├── deploy-sveltekit.sh          # Script de deploy
├── README.md
└── ARQUITECTURA_SIMPLIFICADA.md
```

## Inicio Rápido

### Desarrollo Local

1. **Instalar dependencias:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar variables de entorno:**

   Crea un archivo `frontend/.env` basado en `.env.example`:
   ```bash
   # Mercado Pago (usa credenciales de TEST)
   MERCADOPAGO_ACCESS_TOKEN=TEST-...
   PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-...
   MERCADOPAGO_WEBHOOK_SECRET=...

   # OpenAI
   OPENAI_API_KEY=sk-proj-...

   # URL del frontend (para redirects)
   FRONTEND_URL=http://localhost:5173
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:5173`

### Build de Producción

```bash
cd frontend
npm run build
```

Esto genera el build en `frontend/build/` listo para desplegar.

## Configuración de Mercado Pago

### 1. Crear aplicación

1. Ve a: https://www.mercadopago.cl/developers/panel/app
2. Crea una nueva aplicación
3. Obtén tus credenciales (Access Token y Public Key)

### 2. Configurar Webhooks

Los webhooks son esenciales para recibir notificaciones de pagos en tiempo real.

#### En desarrollo (con ngrok):

1. **Instalar y ejecutar ngrok:**
   ```bash
   brew install ngrok
   ngrok http 5173
   ```

2. **Configurar en Mercado Pago:**
   - Ve a: https://www.mercadopago.cl/developers/panel/app
   - Click en **Webhooks > Configurar notificaciones**
   - Pestaña: **Modo de pruebas**
   - URL: `https://tu-url-ngrok.ngrok.io/api/pagos/webhook`
   - Evento: **Pagos** ✓
   - Guardar y copiar la **clave secreta**

3. **Actualizar .env:**
   ```bash
   MERCADOPAGO_WEBHOOK_SECRET=clave_secreta_copiada
   FRONTEND_URL=https://tu-url-ngrok.ngrok.io
   ```

4. **Reiniciar el servidor de desarrollo**

#### En producción:

1. Usa tu dominio público: `https://taroti.fun/api/pagos/webhook`
2. Configura en la pestaña **Modo productivo**
3. Usa las credenciales de producción en `.env`

### 3. Probar pagos

#### Tarjetas de prueba para Chile (CLP):

**Mastercard - Pago Aprobado:**
```
Número: 5474 9254 3267 0366
CVV: 123
Fecha: 11/25 (cualquier fecha futura)
Titular: APRO
```

**Visa - Pago Aprobado:**
```
Número: 4509 9535 6623 3704
CVV: 123
Fecha: 11/25
Titular: APRO
```

Más tarjetas: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/cards

### 4. Verificar webhook

Después de un pago, revisa los logs del backend:
```bash
# Deberías ver:
[INFO] Webhook recibido
[INFO] Firma del webhook verificada correctamente
[INFO] Pago procesado exitosamente
```

## Flujo de la aplicación

1. **Usuario elige un plan** → Selecciona tipo de tirada (3 cartas, Cruz Celta, Rueda del Año)
2. **Formulario de consulta** → Ingresa pregunta y contexto
3. **Selección de cartas** → Elige N cartas del mazo de Arcanos Mayores
4. **Creación de sesión** → API `/api/sesiones` genera sesión con token único
5. **Guardado en sessionStorage** → Datos temporales en el navegador
6. **Pago con Mercado Pago** → Redirige a checkout de MP
7. **Webhook de confirmación** → MP notifica a `/api/pagos/webhook`
8. **Generación de lectura** → OpenAI GPT-4o crea interpretación personalizada
9. **Lectura disponible** → Usuario ve su lectura en `/lectura/[sesion_id]`

## Seguridad

- **Tokens de acceso únicos**: Cada sesión anónima tiene un token UUID de un solo uso
- **Verificación de firma HMAC SHA256**: Valida webhooks de Mercado Pago
- **CORS configurado**: Headers de seguridad en SvelteKit
- **Sesiones temporales**: No se persiste información personal
- **Stateless**: Sin base de datos, sin historial

## Scripts útiles

```bash
cd frontend
npm run dev          # Servidor de desarrollo (puerto 5173)
npm run build        # Build para producción
npm run preview      # Preview del build
npm run check        # Verificar TypeScript
```

## Troubleshooting

### El webhook no se recibe

1. Verifica que ngrok esté corriendo (en desarrollo)
2. Confirma que la URL en Mercado Pago sea correcta
3. Revisa las DevTools del navegador (Network tab)
4. Usa el simulador de webhooks en el Panel de MP

### Error "Una de las partes es de prueba"

- Usa tarjetas de prueba (ver sección anterior)
- En modo test, NO uses tu cuenta personal de Mercado Pago
- Paga como invitado con tarjetas de prueba

### La lectura no se genera

1. Verifica que tu API key de OpenAI tenga créditos
2. Revisa la consola del servidor de desarrollo
3. Confirma que el webhook de Mercado Pago se recibió correctamente
4. Verifica que sessionStorage tiene los datos de la sesión

### Error en sessionStorage

- Asegúrate de que el navegador permite sessionStorage
- Verifica que estás usando el mismo navegador/pestaña
- No uses modo incógnito (puede limpiar sessionStorage antes)

## Estado del proyecto

**Última actualización:** Mayo 2026
**Estado:** En desarrollo
**Versión:** 2.0.0 (Arquitectura simplificada)

### Cambios recientes (v2.0.0)

- ✅ **Migración a arquitectura simplificada**: Eliminado backend separado
- ✅ **SvelteKit unificado**: Todo en una sola aplicación con adapter-node
- ✅ **Sin base de datos**: Planes hardcodeados, sesiones en sessionStorage
- ✅ **API endpoints integrados**: Server routes en SvelteKit (+server.ts)
- ✅ **Limpieza completa**: Eliminados 15+ archivos obsoletos y backend antiguo

### Roadmap

- [x] Deploy a Hostinger con nueva arquitectura ✅
- [ ] Exportar lectura a PDF
- [ ] Sistema de descuentos/cupones
- [ ] Múltiples idiomas
- [ ] Panel de estadísticas (opcional, sin base de datos)

---

## 🚀 Deploy en Producción

**Estado:** ✅ **Funcionando en producción**
**URL:** https://taroti.fun
**Última actualización:** 23 de mayo de 2026

### Documentación de Deploy

Ver **[SOLUCION_FINAL_HOSTINGER.md](./SOLUCION_FINAL_HOSTINGER.md)** para instrucciones completas de deploy en Hostinger.

### Resumen Técnico

El proyecto utiliza un **script de postbuild** que copia automáticamente los archivos necesarios al directorio `build/` después de compilar:

```json
{
  "scripts": {
    "build": "vite build && npm run postbuild",
    "postbuild": "cp start-server.js build/ && cp .env build/ 2>/dev/null || echo 'No .env to copy'"
  }
}
```

Esto asegura que `start-server.js` y `.env` estén disponibles después del build, evitando que se borren al hacer redeploy.

### Requisitos Hostinger

- ✅ Plan Business (incluye Node.js)
- ✅ Node.js 22.x
- ✅ Dominio: taroti.fun
- ✅ SSL: Let's Encrypt activado

### Costos Estimados

- Hostinger Business: ~$4-8 USD/mes
- OpenAI API: ~$5-20 USD/mes (según uso)
- Mercado Pago: Comisión por transacción (~3-5%)
- **Total**: ~$10-30 USD/mes

---

## Licencia

Privado - Todos los derechos reservados

---

*Desarrollado con ❤️ por Dr. Herrera - Figotilabs*
