# 🔮 Taroti

Plataforma web de lecturas de tarot personalizadas.

## Descripción

Taroti es una aplicación web que ofrece lecturas de tarot personalizadas. Los usuarios pueden elegir entre tres tipos de tiradas, realizar su consulta, pagar de forma segura con Mercado Pago y recibir una interpretación detallada.

## Características principales

- **Tres tipos de tirada**: Tres Cartas, Cruz Celta y Rueda del Año
- **Lecturas personalizadas**: Interpretaciones profundas y detalladas para cada consulta
- **Modalidad anónima**: Sin necesidad de registro, pago directo
- **Pagos seguros**: Integración con Mercado Pago (Chile)
- **Lecturas con expiración**: Las lecturas expiran inmediatamente después de ser leídas
- **Panel administrativo**: Gestión de planes, configuraciones y estadísticas

## Stack tecnológico

### Backend
- **Runtime**: Node.js 24
- **Framework**: Fastify
- **ORM**: Prisma
- **Base de datos**: MySQL
- **Autenticación Admin**: JWT
- **Pagos**: Mercado Pago SDK v2.12.0

### Frontend
- **Framework**: SvelteKit 5
- **Tipografía**: Cinzel (Google Fonts)
- **Deployment**: Static export

### Infraestructura
- **Hosting**: Hostinger Business
- **Entornos**:
  - Producción: `taroti.fun`
  - Test: `dev.taroti.fun`

## Estructura del proyecto

```
taroti/
├── backend/          # API REST con Fastify
│   ├── src/
│   │   ├── routes/   # Rutas de la API
│   │   ├── services/ # Lógica de negocio
│   │   ├── middlewares/
│   │   ├── plugins/
│   │   └── jobs/     # Trabajos programados
│   ├── prisma/       # Esquema y migraciones
│   └── .env          # Variables de entorno
├── frontend/         # Aplicación SvelteKit
│   ├── src/
│   │   ├── routes/   # Páginas
│   │   ├── lib/      # Componentes y utilidades
│   │   └── app.css   # Estilos globales
│   └── .env          # Variables de entorno
└── README.md
```

## Inicio Rápido

### Opción 1: Script Automático (Recomendado)

```bash
# Levantar todo el proyecto
./start.sh

# Detener todo el proyecto
./stop.sh
```

El script `start.sh` automáticamente:
- ✅ Verifica que MySQL esté corriendo
- ✅ Crea archivos `.env` desde `.env.example` si no existen
- ✅ Instala dependencias del backend y frontend
- ✅ Aplica migraciones de base de datos
- ✅ Inicia ambos servidores en segundo plano
- 📝 Guarda logs en `logs/backend.log` y `logs/frontend.log`

### Opción 2: Manual

Si prefieres configurar manualmente, sigue las instrucciones en las secciones Backend y Frontend más abajo.

## Configuración

### Backend

1. **Instalar dependencias:**
   ```bash
   cd backend
   npm install
   ```

2. **Configurar variables de entorno:**

   Crea un archivo `.env` basado en `.env.example`:
   ```bash
   # Servidor
   NODE_ENV=development
   PORT=4000

   # Base de datos
   DATABASE_URL=mysql://usuario:contraseña@localhost:3306/taroti_dev

   # JWT Admin
   ADMIN_JWT_SECRET=tu_secret_muy_largo_y_aleatorio
   ADMIN_JWT_EXPIRES_IN=4h

   # Credenciales Admin
   ADMIN_USER=admin
   ADMIN_PASSWORD_HASH=$2b$10$...

   # Mercado Pago
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
   MERCADOPAGO_PUBLIC_KEY=APP_USR-...
   MERCADOPAGO_WEBHOOK_SECRET=...

   # OpenAI
   OPENAI_API_KEY=sk-proj-...

   # URLs
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=https://tu-ngrok-url.ngrok-free.dev/api
   ```

3. **Configurar la base de datos:**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Iniciar el servidor:**
   ```bash
   npm run dev
   ```

### Frontend

1. **Instalar dependencias:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar variables de entorno:**

   Crea un archivo `.env` con:
   ```bash
   PUBLIC_API_URL=http://localhost:4000/api
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

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
   ngrok http 4000
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
   BACKEND_URL=https://tu-url-ngrok.ngrok.io/api
   MERCADOPAGO_WEBHOOK_SECRET=clave_secreta_copiada
   ```

4. **Reiniciar el backend**

#### En producción:

1. Usa tu dominio público: `https://api.taroti.fun/pagos/webhook`
2. Configura en la pestaña **Modo productivo**
3. Usa las credenciales de producción

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

1. **Usuario elige un plan** → Selecciona tipo de tirada (3 cartas, Cruz Celta, etc.)
2. **Formulario de consulta** → Ingresa pregunta y contexto
3. **Selección de cartas** → Elige N cartas del mazo
4. **Creación de sesión** → Backend genera sesión con token de acceso único
5. **Pago con Mercado Pago** → Redirige a checkout de MP
6. **Webhook de confirmación** → MP notifica al backend del pago
7. **Generación de lectura** → Sistema genera interpretación personalizada
8. **Lectura disponible** → Usuario ve su lectura (expira al leerla)

## Seguridad

- **Tokens de acceso únicos**: Cada sesión anónima tiene un token de un solo uso
- **Verificación de firma HMAC SHA256**: Valida webhooks de Mercado Pago
- **Rate limiting**: Protección contra ataques de fuerza bruta
- **CORS configurado**: Solo orígenes permitidos
- **Helmet**: Headers de seguridad HTTP
- **JWT para admin**: Autenticación segura del panel

## Scripts útiles

### Proyecto completo
```bash
./start.sh           # Levantar backend + frontend
./stop.sh            # Detener backend + frontend
tail -f logs/backend.log   # Ver logs del backend
tail -f logs/frontend.log  # Ver logs del frontend
```

### Backend
```bash
cd backend
npm run dev          # Servidor de desarrollo
npm run build        # Compilar TypeScript
npm start            # Servidor de producción
npx prisma studio    # Interfaz visual de BD
npx prisma migrate   # Crear migración
```

### Frontend
```bash
cd frontend
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
```

## Troubleshooting

### El webhook no se recibe

1. Verifica que ngrok esté corriendo
2. Confirma que la URL en Mercado Pago sea correcta
3. Revisa los logs del backend
4. Usa el simulador de webhooks en el Panel de MP

### Error "Una de las partes es de prueba"

- Usa tarjetas de prueba (ver sección anterior)
- En modo test, NO uses tu cuenta personal de Mercado Pago
- Paga como invitado con tarjetas de prueba

### La lectura no se genera

1. Revisa la tabla `errores` en la BD:
   ```sql
   SELECT * FROM errores ORDER BY creado_en DESC LIMIT 10;
   ```
3. Confirma que la sesión pasó a estado "pagada"

### Errores de CORS

- Verifica que `FRONTEND_URL` en backend coincida con la URL del frontend
- En desarrollo, debería ser `http://localhost:5173`
- Reinicia el backend después de cambiar `.env`

## Estado del proyecto

**Última actualización:** Abril 2026
**Estado:** Listo para producción
**Versión:** 1.0.0

### Cambios recientes

- ✅ Eliminado sistema de autenticación OAuth (ahora 100% anónimo)
- ✅ Implementada expiración inmediata de lecturas
- ✅ Limpieza completa de código (sin archivos de prueba)
- ✅ Integración completa con Mercado Pago
- ✅ Sistema de generación de lecturas optimizado

## Roadmap

- [ ] Panel de estadísticas en admin
- [ ] Exportar lectura a PDF
- [ ] Sistema de descuentos/cupones
- [ ] Múltiples idiomas

---

## 🚀 Deploy a Producción (Hostinger)

### Documentación Completa

- **📖 [DEPLOY_HOSTINGER.md](./DEPLOY_HOSTINGER.md)** - Guía paso a paso completa (11 partes)
- **⚡ [PRODUCCION.md](./PRODUCCION.md)** - Resumen rápido y checklist

### Quick Start

```bash
# 1. Compilar backend
cd backend
./deploy-production.sh

# 2. Compilar frontend
cd ../frontend
./deploy-production.sh

# 3. Subir archivos a Hostinger vía FTP
# 4. Configurar Node.js app en hPanel
# 5. Aplicar migraciones en producción
```

### Archivos de Configuración

- `backend/.htaccess` - Proxy Apache → Node.js
- `backend/deploy-production.sh` - Script de build backend
- `frontend/.htaccess` - SPA routing para SvelteKit
- `frontend/deploy-production.sh` - Script de build frontend
- `.env.example` - Templates de variables de entorno (actualizados)

### Requisitos Hostinger

- ✅ Plan Business (incluye Node.js + MySQL)
- ✅ Dominio configurado
- ✅ SSL activado (Let's Encrypt incluido)
- ✅ Subdomain `api.tudominio.com` creado

### Costos Estimados

- Hostinger Business: ~$4-8 USD/mes
- OpenAI API: ~$5-20 USD/mes (según uso)
- Mercado Pago: 0% + comisión por transacción
- **Total**: ~$10-30 USD/mes

---

## Licencia

Privado - Todos los derechos reservados

---

*Desarrollado con ❤️ por Dr. Herrera - Figotilabs*
