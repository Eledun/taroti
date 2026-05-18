# ✅ Checklist de Despliegue a Producción - Taroti

Este checklist te guía paso a paso en el despliegue de Taroti a Hostinger.

---

## 📋 Pre-Despliegue (En tu computadora local)

### 1. Verificar Archivos de Configuración

- [x] `.vscode/sftp.json.example` existe
- [ ] Crear `.vscode/sftp.json` con tus credenciales reales de Hostinger
- [x] `backend/.env` tiene credenciales de PRODUCCIÓN de Mercado Pago
- [x] `frontend/.env` tiene PUBLIC_KEY de PRODUCCIÓN de Mercado Pago
- [x] `backend/deploy-production.sh` existe y es ejecutable
- [x] `frontend/deploy-production.sh` existe y es ejecutable
- [x] `backend/.htaccess` existe
- [x] `frontend/.htaccess` existe

### 2. Compilar Aplicaciones

```bash
# Backend
cd backend
./deploy-production.sh

# Verificar que se creó /dist
ls -la dist/

# Frontend
cd ../frontend
./deploy-production.sh

# Verificar que se creó /build
ls -la build/
```

- [ ] Backend compilado (`/backend/dist/` existe)
- [ ] Frontend compilado (`/frontend/build/` existe)
- [ ] No hay errores de TypeScript
- [ ] Todas las dependencias instaladas

---

## 🔧 Configurar Hostinger

### 3. Preparar Base de Datos MySQL

En hPanel de Hostinger:

1. Ve a **Bases de datos** → **MySQL Databases**
2. Crea una nueva base de datos:
   - **Nombre**: `u123_taroti` (ajusta el prefijo según tu usuario)
   - **Usuario**: `u123_taroti`
   - **Contraseña**: (genera una segura)
3. Anota las credenciales:

```
Host: localhost
Puerto: 3306
Base de datos: u123_taroti
Usuario: u123_taroti
Contraseña: [la que generaste]
```

- [ ] Base de datos MySQL creada
- [ ] Usuario y contraseña anotados
- [ ] Conexión verificada

### 4. Configurar Aplicación Node.js

En hPanel:

1. Ve a **Avanzado** → **Node.js**
2. Click en **Create Application**
3. Configura:
   - **Application mode**: Production
   - **Node version**: 18.x o superior
   - **Application root**: `/domains/api.tudominio.com/nodejs/taroti-backend`
   - **Application URL**: `api.tudominio.com`
   - **Application startup file**: `dist/index.js`
   - **Port**: 4000 (o el que uses)

- [ ] Aplicación Node.js creada
- [ ] Puerto configurado (4000)
- [ ] URL configurada (api.tudominio.com)

### 5. Configurar Dominios

En hPanel → **Dominios**:

1. **Dominio principal** (Frontend):
   - Dominio: `tudominio.com`
   - Document root: `/domains/tudominio.com/public_html`

2. **Subdominio API** (Backend):
   - Subdominio: `api.tudominio.com`
   - Document root: `/domains/api.tudominio.com/public_html`

- [ ] Dominio principal configurado
- [ ] Subdominio API configurado
- [ ] SSL/HTTPS activo en ambos

---

## 📤 Subir Archivos con VS Code SFTP

### 6. Configurar SFTP en VS Code

1. Abre VS Code en la carpeta del proyecto
2. Copia `.vscode/sftp.json.example` → `.vscode/sftp.json`
3. Actualiza con tus credenciales de Hostinger:

```json
{
    "host": "ftp.tudominio.com",
    "username": "u123456789",
    "password": "tu-password-de-hostinger",
    "remotePath": "/home/u123456789/domains"
}
```

- [ ] SFTP configurado en VS Code
- [ ] Credenciales actualizadas
- [ ] Conexión probada

### 7. Subir Backend

**Archivos a subir**:
- `backend/dist/` → `/domains/api.tudominio.com/nodejs/taroti-backend/dist/`
- `backend/prisma/` → `/domains/api.tudominio.com/nodejs/taroti-backend/prisma/`
- `backend/package.json` → `/domains/api.tudominio.com/nodejs/taroti-backend/package.json`
- `backend/package-lock.json` → `/domains/api.tudominio.com/nodejs/taroti-backend/package-lock.json`
- `backend/.htaccess` → `/domains/api.tudominio.com/public_html/.htaccess`

**En VS Code**:
1. Click derecho en `backend/dist/` → **SFTP: Upload Folder**
2. Click derecho en `backend/prisma/` → **SFTP: Upload Folder**
3. Click derecho en `backend/package.json` → **SFTP: Upload**
4. Click derecho en `backend/package-lock.json` → **SFTP: Upload**
5. Click derecho en `backend/.htaccess` → **SFTP: Upload**

- [ ] `/dist/` subido
- [ ] `/prisma/` subido
- [ ] `package.json` subido
- [ ] `package-lock.json` subido
- [ ] `.htaccess` subido

### 8. Subir Frontend

**Archivos a subir**:
- **CONTENIDO** de `frontend/build/` → `/domains/tudominio.com/public_html/`
- `frontend/.htaccess` → `/domains/tudominio.com/public_html/.htaccess`

**IMPORTANTE**: Sube el CONTENIDO de `build/`, no la carpeta `build/` en sí.

**En VS Code**:
1. Abre la carpeta `frontend/build/`
2. Selecciona todos los archivos y carpetas dentro
3. Click derecho → **SFTP: Upload**
4. Confirma la ruta: `/domains/tudominio.com/public_html/`

- [ ] Archivos estáticos del frontend subidos
- [ ] `.htaccess` subido
- [ ] `index.html` en la raíz de `public_html/`

---

## ⚙️ Configurar el Servidor

### 9. Instalar Dependencias Backend (vía SSH)

En hPanel → **Avanzado** → **Terminal SSH**:

```bash
cd /home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend

# Instalar dependencias (solo producción)
npm install --production

# Generar Prisma Client
npx prisma generate
```

- [ ] `npm install` ejecutado sin errores
- [ ] Prisma Client generado
- [ ] `node_modules/` creado

### 10. Crear Archivo .env de Producción

**Vía SSH**:

```bash
cd /home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend

# Crear .env
nano .env
```

**Pega el contenido de producción** (actualiza con tus valores reales):

```bash
NODE_ENV=production
PORT=4000

# Base de datos
DATABASE_URL="mysql://u123_taroti:tu-password-mysql@localhost:3306/u123_taroti?charset=utf8mb4"

# JWT
JWT_SECRET="GENERA-UN-SECRETO-ALEATORIO-LARGO"
ADMIN_JWT_SECRET="GENERA-OTRO-SECRETO-DIFERENTE"
ADMIN_PASSWORD_HASH="$2a$10$..." # Genera con bcrypt

# Mercado Pago (PRODUCCIÓN)
MERCADOPAGO_ACCESS_TOKEN="APP_USR-8356147486860198-032514-a227c17180bf1f40d43ca9250260cd17-3291172411"
MERCADOPAGO_PUBLIC_KEY="APP_USR-f04ae6a6-0e9c-413d-9a86-ce5b0e28c059"
MERCADOPAGO_WEBHOOK_SECRET="37c01d6e8b981aacc925d35079eff02ec8d042f5a77af8ac954bbf6827cdb91a"

# OpenAI
OPENAI_API_KEY="sk-proj-..." # Tu API key real

# URLs
FRONTEND_URL="https://tudominio.com"
BACKEND_URL="https://api.tudominio.com/api"
```

**Generar JWT Secrets**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Guardar**: `Ctrl+X` → `Y` → `Enter`

- [ ] `.env` creado en el servidor
- [ ] Todos los valores actualizados
- [ ] JWT_SECRET generado
- [ ] ADMIN_JWT_SECRET generado

### 11. Aplicar Migraciones de Base de Datos

```bash
cd /home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend

# Aplicar migraciones
npx prisma migrate deploy

# Sembrar datos iniciales (planes, tiradas)
npx tsx prisma/seed.ts
```

- [ ] Migraciones aplicadas sin errores
- [ ] Seed ejecutado (planes y tiradas creados)
- [ ] Tablas creadas en MySQL

### 12. Iniciar Aplicación Node.js

**Vía hPanel**:

1. Ve a **Avanzado** → **Node.js**
2. Encuentra tu aplicación `taroti-backend`
3. Click en **Start** o **Restart**

**O vía SSH con PM2**:

```bash
cd /home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend

# Instalar PM2 (si no está)
npm install -g pm2

# Iniciar aplicación
pm2 start dist/index.js --name taroti-backend

# Ver estado
pm2 status

# Ver logs
pm2 logs taroti-backend
```

- [ ] Aplicación iniciada
- [ ] Sin errores en los logs
- [ ] Responde en puerto 4000

---

## 🔔 Configurar Webhook de Mercado Pago

### 13. Configurar Webhook en Panel de MP

1. Ve a: https://www.mercadopago.cl/developers/
2. Selecciona tu aplicación
3. Cambia a modo **PRODUCCIÓN** ✅
4. Ve a **Webhooks**
5. Agrega nueva URL:

```
https://api.tudominio.com/api/pagos/webhook
```

6. Suscríbete a eventos:
   - ✅ `payment`
   - ✅ `merchant_order` (opcional)

7. Copia el **Webhook Secret**
8. Si cambió, actualiza en el `.env` del servidor

- [ ] Webhook configurado en MP (modo producción)
- [ ] URL apunta a tu dominio real
- [ ] Webhook Secret actualizado en .env (si cambió)

---

## ✅ Verificar Despliegue

### 14. Probar Backend API

```bash
# Planes (debe retornar JSON)
curl https://api.tudominio.com/api/planes

# Health check
curl https://api.tudominio.com/api/health
```

- [ ] `/api/planes` retorna JSON
- [ ] `/api/health` retorna status OK
- [ ] HTTPS funciona (SSL activo)

### 15. Probar Frontend

1. Abre en navegador: `https://tudominio.com`
2. Verifica:
   - La página carga correctamente
   - Los planes se muestran
   - Puedes crear una sesión
   - Puedes seleccionar cartas
   - La página de lectura carga

- [ ] Homepage carga
- [ ] Planes se muestran
- [ ] Creación de sesión funciona
- [ ] Selección de cartas funciona

### 16. Prueba de Pago Real

⚠️ **ADVERTENCIA**: Esto hará un pago REAL con dinero REAL

1. Selecciona un plan económico (ej. Tres Cartas - $1.000)
2. Crea una sesión
3. Completa el pago con una tarjeta real
4. Verifica:
   - Redirección a Mercado Pago funciona
   - Pago se procesa
   - Webhook se recibe
   - Lectura se genera (OpenAI)
   - Página de resultados muestra la lectura

**Verificar logs del servidor**:
```bash
pm2 logs taroti-backend
```

Deberías ver:
```
✅ Webhook recibido de Mercado Pago
✅ Pago aprobado para sesión: xxx-xxx-xxx
✅ Lectura agregada a la cola
✅ Lectura generada por OpenAI
```

- [ ] Pago procesado exitosamente
- [ ] Webhook recibido
- [ ] Lectura generada
- [ ] Página de resultados muestra interpretación

---

## 📊 Monitoreo Post-Despliegue

### 17. Verificar Logs

**Backend**:
```bash
pm2 logs taroti-backend
```

**Frontend**: Revisa Console en DevTools del navegador

- [ ] No hay errores en logs del backend
- [ ] No hay errores en Console del frontend
- [ ] Webhook recibe notificaciones de MP

### 18. Verificar Base de Datos

```sql
-- Conectar a MySQL en hPanel
USE u123_taroti;

-- Ver planes creados
SELECT * FROM planes;

-- Ver sesiones
SELECT id, plan_id, estado, creado_en
FROM sesiones
ORDER BY creado_en DESC
LIMIT 10;

-- Ver pagos
SELECT id, sesion_id, estado, monto, mp_payment_id
FROM pagos
ORDER BY creado_en DESC
LIMIT 10;

-- Ver lecturas generadas
SELECT id, sesion_id, estado, creado_en
FROM cola_lecturas
WHERE estado = 'completada'
ORDER BY creado_en DESC
LIMIT 5;
```

- [ ] Planes existen en DB
- [ ] Sesiones se crean correctamente
- [ ] Pagos se registran
- [ ] Lecturas se completan

---

## 🔄 Workflow de Updates Futuros

Cuando hagas cambios al código:

### Backend

```bash
# 1. Local: Compilar
cd backend
npm run build

# 2. VS Code: Subir solo /dist
# Click derecho en dist/ → SFTP: Upload Folder

# 3. Hostinger: Reiniciar
# hPanel → Node.js → Restart
# O por SSH: pm2 restart taroti-backend
```

### Frontend

```bash
# 1. Local: Compilar
cd frontend
npm run build

# 2. VS Code: Subir /build
# Click derecho en build/ → SFTP: Upload Folder

# 3. No requiere reinicio (archivos estáticos)
```

---

## 🐛 Troubleshooting

### Backend no responde

1. Verifica que la app Node.js esté corriendo:
   ```bash
   pm2 status
   ```
2. Revisa logs:
   ```bash
   pm2 logs taroti-backend --lines 50
   ```
3. Verifica .env:
   ```bash
   cat .env | grep -v "SECRET\|PASSWORD"
   ```

### Frontend muestra página en blanco

1. Verifica que `index.html` esté en `/public_html/`
2. Verifica permisos:
   ```bash
   chmod 755 /domains/tudominio.com/public_html
   chmod 644 /domains/tudominio.com/public_html/index.html
   ```
3. Verifica `.htaccess`

### Webhook no llega

1. Verifica URL en panel de MP
2. Verifica SSL activo: `curl -I https://api.tudominio.com`
3. Prueba manualmente:
   ```bash
   curl -X POST https://api.tudominio.com/api/pagos/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"payment","data":{"id":"123"}}'
   ```

### Error de base de datos

1. Verifica que la DB esté creada
2. Verifica credenciales en .env
3. Prueba conexión:
   ```bash
   mysql -h localhost -u u123_taroti -p u123_taroti
   ```

---

## 📞 Recursos

- **Documentación detallada**: Ver archivos:
  - `DEPLOY_HOSTINGER.md` - Guía completa de despliegue
  - `DEPLOY_VSCODE_SFTP.md` - Guía de SFTP
  - `CONFIGURAR_WEBHOOK_MP.md` - Configuración de webhook
  - `PRODUCCION.md` - Quick reference

- **Hostinger**:
  - hPanel: https://hpanel.hostinger.com
  - Soporte: Chat 24/7

- **Mercado Pago**:
  - Panel Developers: https://www.mercadopago.cl/developers/
  - Docs Webhooks: https://www.mercadopago.com.ar/developers/es/docs/webhooks

---

## ✅ Checklist Final

Antes de considerar el despliegue completo:

- [ ] Backend compilado y subido
- [ ] Frontend compilado y subido
- [ ] Dependencias instaladas en servidor
- [ ] .env de producción configurado
- [ ] Base de datos creada y migrada
- [ ] Datos iniciales sembrados (planes, tiradas)
- [ ] Aplicación Node.js iniciada
- [ ] Webhook configurado en Mercado Pago
- [ ] Backend API responde correctamente
- [ ] Frontend carga sin errores
- [ ] Pago de prueba exitoso
- [ ] Lectura generada por OpenAI
- [ ] Página de resultados muestra interpretación
- [ ] UTF-8 funcionando (acentos correctos)
- [ ] Logs monitoreados sin errores

---

**Última actualización**: 2026-05-18
**Estado**: ✅ Listo para despliegue a producción en Hostinger
**Versión**: 1.0.0
