# 🚀 Guía de Deploy en Hostinger - Taroti

Esta guía te llevará paso a paso para deployar la aplicación Taroti en un plan Business de Hostinger.

## 📋 Requisitos Previos

- ✅ Plan Business de Hostinger activo
- ✅ Dominio configurado (ej: `tudominio.com`)
- ✅ Acceso al panel de Hostinger (hPanel)
- ✅ Cliente FTP/SFTP (FileZilla, Cyberduck, o similar)
- ✅ Credenciales de Mercado Pago en PRODUCCIÓN
- ✅ API Key de OpenAI

---

## 🎯 Arquitectura del Deploy

```
tudominio.com (Frontend SvelteKit)
   └─ public_html/
      ├─ index.html
      ├─ _app/
      └─ assets/

api.tudominio.com (Backend Node.js)
   └─ nodejs/taroti-backend/
      ├─ dist/
      ├─ node_modules/
      ├─ prisma/
      └─ .env
```

---

## 📝 PARTE 1: Preparación Local

### 1.1 Configurar Variables de Entorno

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Edita el archivo `.env`:

```env
NODE_ENV=production
PORT=4000

# Base de datos MySQL de Hostinger
DATABASE_URL="mysql://u123456789_taroti:TuPasswordSeguro@localhost:3306/u123456789_taroti?charset=utf8mb4"

# Generar secrets seguros:
# openssl rand -base64 32
JWT_SECRET="<secret-generado-produccion>"
REFRESH_TOKEN_EXPIRES_IN="30d"
JWT_EXPIRES_IN="7d"

ADMIN_JWT_SECRET="<otro-secret-diferente>"
ADMIN_JWT_EXPIRES_IN="4h"

# Credenciales Admin
ADMIN_USER="admin"
# Generar hash: node -e "console.log(require('bcrypt').hashSync('TuPasswordSeguro123!', 10))"
ADMIN_PASSWORD_HASH="$2b$10$..."

# Mercado Pago PRODUCCIÓN (¡NO test!)
MERCADOPAGO_ACCESS_TOKEN="APP_USR-<production-token>"
MERCADOPAGO_PUBLIC_KEY="APP_USR-<production-public-key>"
MERCADOPAGO_WEBHOOK_SECRET="<webhook-secret>"

# OpenAI
OPENAI_API_KEY="sk-proj-<tu-api-key>"

# URLs de Producción
FRONTEND_URL="https://tudominio.com"
BACKEND_URL="https://api.tudominio.com/api"
```

#### Frontend (.env)

```bash
cd frontend
cp .env.example .env
```

Edita el archivo `.env`:

```env
PUBLIC_API_URL=https://api.tudominio.com/api
PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-<production-public-key>
```

### 1.2 Compilar Aplicaciones

#### Backend

```bash
cd backend
chmod +x deploy-production.sh
./deploy-production.sh
```

Esto generará:
- `/dist` - Código TypeScript compilado
- `/node_modules` - Dependencias instaladas
- Prisma Client generado

#### Frontend

```bash
cd frontend
chmod +x deploy-production.sh
./deploy-production.sh
```

Esto generará:
- `/build` - Aplicación SvelteKit compilada

---

## 🗄️ PARTE 2: Configurar MySQL en Hostinger

### 2.1 Crear Base de Datos

1. Inicia sesión en **hPanel** de Hostinger
2. Ve a **Bases de Datos** → **Administrador de MySQL**
3. Click en **Crear nueva base de datos**:
   - Nombre: `u123456789_taroti` (Hostinger agrega prefijo automáticamente)
   - Usuario: `u123456789_taroti`
   - Contraseña: Genera una contraseña segura
4. Anota las credenciales:
   ```
   Host: localhost
   Usuario: u123456789_taroti
   Contraseña: <la que generaste>
   Base de datos: u123456789_taroti
   ```

### 2.2 Actualizar DATABASE_URL

Actualiza el `.env` del backend con los datos reales:

```env
DATABASE_URL="mysql://u123456789_taroti:TuPasswordReal@localhost:3306/u123456789_taroti?charset=utf8mb4"
```

---

## 🌐 PARTE 3: Configurar Subdominios

### 3.1 Crear Subdominio para API

1. En hPanel, ve a **Dominios** → **Subdominios**
2. Crear subdominio:
   - Subdominio: `api`
   - Dominio raíz: `tudominio.com`
   - Document root: `/home/u123456789/domains/api.tudominio.com/public_html`
3. Click en **Crear**

### 3.2 Verificar DNS

Espera 10-30 minutos para que el DNS se propague.

Verifica con:
```bash
ping api.tudominio.com
```

---

## 📤 PARTE 4: Subir Archivos al Servidor

### 4.1 Obtener Credenciales FTP

1. En hPanel, ve a **Archivos** → **Administrador de archivos**
2. O usa FTP:
   - Host: `ftp.tudominio.com`
   - Usuario: `u123456789` (verifica en hPanel)
   - Contraseña: Tu contraseña de hPanel
   - Puerto: 21 (FTP) o 22 (SFTP)

### 4.2 Subir Backend

Usando FileZilla o tu cliente FTP favorito:

```
Local                           →  Remoto
──────────────────────────────────────────────────────────────
backend/dist/                   →  /domains/api.tudominio.com/nodejs/taroti-backend/dist/
backend/node_modules/           →  /domains/api.tudominio.com/nodejs/taroti-backend/node_modules/
backend/prisma/                 →  /domains/api.tudominio.com/nodejs/taroti-backend/prisma/
backend/package.json            →  /domains/api.tudominio.com/nodejs/taroti-backend/package.json
backend/.env                    →  /domains/api.tudominio.com/nodejs/taroti-backend/.env
backend/.htaccess               →  /domains/api.tudominio.com/public_html/.htaccess
```

**IMPORTANTE**: No subas:
- `/src` (solo desarrollo)
- `/node_modules` de desarrollo
- `.git/`
- `.env.example`

### 4.3 Subir Frontend

```
Local                           →  Remoto
──────────────────────────────────────────────────────────────
frontend/build/*                →  /domains/tudominio.com/public_html/
frontend/.htaccess              →  /domains/tudominio.com/public_html/.htaccess
```

**Estructura final en Hostinger:**

```
/home/u123456789/
├── domains/
│   ├── tudominio.com/
│   │   └── public_html/         ← Frontend (build/)
│   │       ├── index.html
│   │       ├── _app/
│   │       ├── assets/
│   │       └── .htaccess
│   └── api.tudominio.com/
│       ├── public_html/
│       │   └── .htaccess
│       └── nodejs/
│           └── taroti-backend/  ← Backend
│               ├── dist/
│               ├── node_modules/
│               ├── prisma/
│               ├── package.json
│               └── .env
```

---

## ⚙️ PARTE 5: Configurar Node.js en Hostinger

### 5.1 Configurar Aplicación Node.js

1. En hPanel, ve a **Avanzado** → **Node.js**
2. Click en **Crear aplicación**
3. Configuración:
   - **Versión de Node.js**: 18.x o 20.x (la más reciente LTS)
   - **Modo de aplicación**: Production
   - **Carpeta de aplicación**: `/domains/api.tudominio.com/nodejs/taroti-backend`
   - **Archivo de inicio**: `dist/index.js`
   - **Dominio**: `api.tudominio.com`
   - **Puerto de la aplicación**: `4000`
4. Click en **Crear**

### 5.2 Instalar Dependencias en el Servidor

Hostinger debería instalar automáticamente. Si no:

1. Ve a **Avanzado** → **Terminal SSH**
2. Ejecuta:

```bash
cd /home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend
npm install --production
npx prisma generate
```

---

## 🗃️ PARTE 6: Migrar Base de Datos

### 6.1 Ejecutar Migraciones

Desde SSH en Hostinger:

```bash
cd /home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend

# Aplicar migraciones
npx prisma migrate deploy

# Sembrar datos iniciales (planes, etc.)
npx prisma db seed
```

### 6.2 Verificar Tablas

Accede a **phpMyAdmin** desde hPanel y verifica que se crearon las tablas:
- `usuarios`
- `planes`
- `sesiones`
- `pagos`
- `lecturas`
- `cola_lecturas`
- etc.

---

## 🔧 PARTE 7: Configurar Mercado Pago

### 7.1 Obtener Credenciales de Producción

1. Ve a [Mercado Pago Developers](https://www.mercadopago.cl/developers/)
2. En tu aplicación, cambia de **Modo Test** → **Modo Producción**
3. Copia:
   - **Access Token** → `MERCADOPAGO_ACCESS_TOKEN`
   - **Public Key** → `MERCADOPAGO_PUBLIC_KEY`

### 7.2 Configurar Webhook

1. En el panel de MP Developers, ve a **Webhooks**
2. Configurar nueva URL:
   - **URL**: `https://api.tudominio.com/api/pagos/webhook`
   - **Eventos**:
     - `payment`
     - `merchant_order`
3. Copia el **Webhook Secret** → `MERCADOPAGO_WEBHOOK_SECRET` en `.env`
4. Guarda cambios

### 7.3 Actualizar .env con Credenciales

Edita `/domains/api.tudominio.com/nodejs/taroti-backend/.env`:

```env
MERCADOPAGO_ACCESS_TOKEN="APP_USR-<production-token-real>"
MERCADOPAGO_PUBLIC_KEY="APP_USR-<production-key-real>"
MERCADOPAGO_WEBHOOK_SECRET="<webhook-secret-real>"
```

---

## 🚀 PARTE 8: Iniciar Aplicación

### 8.1 Iniciar Backend

1. En hPanel, ve a **Avanzado** → **Node.js**
2. Encuentra tu aplicación `taroti-backend`
3. Click en **Restart** o **Start**

### 8.2 Verificar que Funciona

Abre en el navegador:

```
https://api.tudominio.com/api/planes
```

Deberías ver un JSON con los planes disponibles.

### 8.3 Verificar Frontend

Abre:

```
https://tudominio.com
```

Deberías ver la página principal de Taroti.

---

## ✅ PARTE 9: Testing en Producción

### 9.1 Test del Flujo Completo

1. **Crear Sesión**:
   - Ve a `https://tudominio.com`
   - Selecciona un plan
   - Ingresa una pregunta
   - Selecciona cartas

2. **Realizar Pago Real**:
   - Te redirigirá a Mercado Pago
   - Usa una tarjeta REAL de prueba aprobada
   - Completa el pago

3. **Verificar Webhook**:
   - Revisa logs en hPanel → Node.js → Logs
   - Verifica que se recibió el webhook de MP

4. **Ver Lectura**:
   - El sistema debería generar la lectura con OpenAI
   - Deberías poder verla en la URL de lectura

### 9.2 Verificar Logs

```bash
# Desde SSH
cd /home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend
pm2 logs
```

O desde hPanel:
- **Avanzado** → **Node.js** → Tu app → **Logs**

---

## 🔐 PARTE 10: Seguridad Post-Deploy

### 10.1 SSL/HTTPS

Hostinger incluye SSL gratis con Let's Encrypt:

1. Ve a **Seguridad** → **SSL**
2. Activa SSL para:
   - `tudominio.com`
   - `api.tudominio.com`

### 10.2 Firewall y Seguridad

1. Activa **Cloudflare** (gratis en Hostinger):
   - Protección DDoS
   - WAF
   - Cache global

2. Configura **ModSecurity** en hPanel si está disponible

### 10.3 Backups

1. Configura **Backup automático** en hPanel
2. O manualmente:
   - **Archivos**: hPanel → Backups → Crear backup
   - **Base de datos**: phpMyAdmin → Exportar

---

## 📊 PARTE 11: Monitoreo

### 11.1 Logs de Aplicación

```bash
# Ver logs en tiempo real
pm2 logs taroti-backend --lines 100
```

### 11.2 Logs de MySQL

En hPanel:
- **Bases de Datos** → **phpMyAdmin**
- Revisa queries lentas o errores

### 11.3 Métricas de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/usage)
2. Monitorea:
   - Tokens usados
   - Costos diarios
   - Rate limits

### 11.4 Mercado Pago

1. Panel de MP → **Actividad**
2. Verifica:
   - Pagos recibidos
   - Webhooks entregados
   - Errores

---

## 🛠️ Troubleshooting

### Error: "Cannot connect to database"

```bash
# Verifica credenciales
cat .env | grep DATABASE_URL

# Prueba conexión manualmente
mysql -u u123456789_taroti -p -h localhost u123456789_taroti
```

### Error: "Port 4000 already in use"

```bash
# Mata proceso
pm2 delete all
pm2 start dist/index.js --name taroti-backend
```

### Frontend muestra página en blanco

1. Verifica que `.htaccess` esté en `public_html/`
2. Verifica que `PUBLIC_API_URL` en `.env` sea correcto
3. Abre DevTools → Console para ver errores

### Webhook de Mercado Pago no llega

1. Verifica que la URL sea pública y accesible
2. Prueba manualmente:
   ```bash
   curl -X POST https://api.tudominio.com/api/pagos/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"payment","data":{"id":"123"}}'
   ```

---

## 📞 Soporte

- **Hostinger**: Chat 24/7 en hPanel
- **Mercado Pago**: developers@mercadopago.com
- **OpenAI**: help.openai.com

---

## ✨ Listo!

Tu aplicación Taroti ahora está en producción en Hostinger. 🎉

**URLs Finales:**
- Frontend: `https://tudominio.com`
- Backend API: `https://api.tudominio.com/api`
- Panel Admin: `https://tudominio.com/admin`

---

## 📋 Checklist Final

- [ ] Base de datos MySQL creada y configurada
- [ ] Migraciones aplicadas (`prisma migrate deploy`)
- [ ] Datos iniciales sembrados (`prisma db seed`)
- [ ] Variables de entorno configuradas (producción)
- [ ] Archivos del backend subidos
- [ ] Archivos del frontend subidos
- [ ] Aplicación Node.js iniciada
- [ ] SSL activado en ambos dominios
- [ ] Mercado Pago configurado (credenciales producción)
- [ ] Webhook de MP configurado y funcionando
- [ ] OpenAI funcionando correctamente
- [ ] Test completo del flujo realizado
- [ ] Backups configurados
- [ ] Monitoreo activo

🔮 **¡Tu aplicación de Tarot está lista para recibir usuarios!**
