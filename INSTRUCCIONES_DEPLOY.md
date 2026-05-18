# 🚀 Instrucciones de Deploy a Hostinger

## ✅ Estado Actual

- ✓ Backend compilado en `backend/dist/`
- ✓ Frontend compilado en `frontend/build/`
- ✓ Archivos listos para deploy

## 📤 Método 1: Subir con VS Code SFTP Extension (RECOMENDADO)

### 1. Instalar Extensión

En VS Code:
- Presiona `Cmd+Shift+X`
- Busca "SFTP" de Natizyskunk
- Instalar

### 2. Configurar Credenciales

Ya existe el archivo `.vscode/sftp.json` pero necesitas agregar la contraseña.

**Opción A: Usar password directamente (no recomendado para git)**

```json
{
  "name": "Hostinger",
  "host": "46.202.145.196",
  "protocol": "ftp",
  "port": 21,
  "username": "u616221621",
  "password": "TU_PASSWORD_AQUI",
  "remotePath": "/public_html",
  "uploadOnSave": false,
  "useTempFile": false,
  "openSsh": false
}
```

**Opción B: Usar privateKeyPath (más seguro)**

Contacta a Hostinger para configurar SSH keys.

### 3. Subir Backend

1. En VS Code, presiona `Cmd+Shift+P`
2. Escribe "SFTP: Upload Folder"
3. Selecciona la carpeta `backend/dist` y súbela a `/public_html/api/dist`
4. Repite con `backend/prisma` → `/public_html/api/prisma`
5. Sube `backend/package.json` → `/public_html/api/package.json`
6. Sube `backend/.htaccess` → `/public_html/api/.htaccess`

### 4. Subir Frontend

1. Presiona `Cmd+Shift+P`
2. "SFTP: Upload Folder"
3. Selecciona `frontend/build` y sube TODO su contenido a `/public_html/`

---

## 📤 Método 2: Usar FileZilla (Manual pero visual)

### 1. Descargar FileZilla

https://filezilla-project.org/

### 2. Conectar

```
Host: ftp://46.202.145.196
Usuario: u616221621
Contraseña: [Tu contraseña]
Puerto: 21
```

### 3. Estructura de Archivos en Hostinger

```
/public_html/                          ← Frontend aquí
  ├── index.html
  ├── _app/
  ├── arcan_mayor/
  ├── .htaccess
  └── api/                             ← Backend aquí
      ├── dist/
      ├── prisma/
      ├── package.json
      └── .htaccess
```

### 4. Arrastrar y Soltar

- **Local: `frontend/build/*`** → **Remoto: `/public_html/`**
- **Local: `backend/dist/`** → **Remoto: `/public_html/api/dist/`**
- **Local: `backend/prisma/`** → **Remoto: `/public_html/api/prisma/`**
- **Local: `backend/package.json`** → **Remoto: `/public_html/api/package.json`**

---

## 📤 Método 3: Script Automatizado (Requiere lftp)

### 1. Instalar LFTP (si no lo tienes)

```bash
brew install lftp
```

### 2. Ejecutar Script

```bash
chmod +x deploy-to-hostinger.sh
./deploy-to-hostinger.sh
```

Te pedirá la contraseña de SFTP.

---

## ⚙️ Después de Subir Archivos

### 1. Conectarse por SSH a Hostinger

En hPanel → Avanzado → Terminal SSH

O desde tu terminal:

```bash
ssh u616221621@46.202.145.196
```

### 2. Instalar Dependencias del Backend

```bash
cd /home/u616221621/public_html/api
npm install --production
npx prisma generate
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` en `/public_html/api/.env`:

```bash
nano .env
```

Pegar:

```env
NODE_ENV=production
PORT=4000

# MySQL de Hostinger (reemplaza con tus credenciales reales)
DATABASE_URL="mysql://u616221621_taroti:PASSWORD@localhost:3306/u616221621_taroti?charset=utf8mb4"

# Generar con: openssl rand -base64 32
JWT_SECRET="tu-secret-aqui"
REFRESH_TOKEN_EXPIRES_IN="30d"
JWT_EXPIRES_IN="7d"

ADMIN_JWT_SECRET="otro-secret-aqui"
ADMIN_JWT_EXPIRES_IN="4h"

ADMIN_USER="admin"
ADMIN_PASSWORD_HASH="$2b$10$..."

# Mercado Pago PRODUCCIÓN
MERCADOPAGO_ACCESS_TOKEN="APP_USR-production-token"
MERCADOPAGO_PUBLIC_KEY="APP_USR-production-public-key"
MERCADOPAGO_WEBHOOK_SECRET="webhook-secret"

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# URLs
FRONTEND_URL="https://tudominio.com"
BACKEND_URL="https://api.tudominio.com/api"
```

Guardar: `Ctrl+X`, luego `Y`, luego `Enter`

### 4. Migrar Base de Datos

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 5. Iniciar Aplicación Node.js

Ve a **hPanel → Avanzado → Node.js**

- Click en "Crear aplicación"
- Versión: Node 20.x
- Carpeta: `/public_html/api`
- Archivo de inicio: `dist/index.js`
- Puerto: 4000
- Dominio: `api.tudominio.com`

Click en **Iniciar**

---

## ✅ Verificar que Funciona

### Backend

Abre en el navegador:

```
https://api.tudominio.com/api/planes
```

Deberías ver un JSON con los planes.

### Frontend

Abre:

```
https://tudominio.com
```

Deberías ver la página de inicio de Taroti.

---

## 🐛 Troubleshooting

### Error: "Cannot find module"

```bash
cd /home/u616221621/public_html/api
rm -rf node_modules
npm install --production
npx prisma generate
```

Reinicia la app desde el panel de Node.js.

### Error: "Database connection failed"

Verifica que el `DATABASE_URL` en `.env` tenga las credenciales correctas de MySQL desde hPanel.

### Frontend muestra página en blanco

1. Verifica que el archivo `.htaccess` esté en `/public_html/`
2. Abre DevTools (F12) → Console para ver errores
3. Verifica que `PUBLIC_API_URL` en el build apunte a la URL correcta

---

## 📋 Checklist Final

- [ ] Archivos del backend subidos a `/public_html/api/`
- [ ] Archivos del frontend subidos a `/public_html/`
- [ ] Dependencias instaladas en el servidor
- [ ] Archivo `.env` configurado con credenciales de producción
- [ ] Migraciones de base de datos aplicadas
- [ ] Datos iniciales sembrados
- [ ] Aplicación Node.js iniciada desde hPanel
- [ ] SSL activado para ambos dominios
- [ ] Backend responde en `https://api.tudominio.com/api/planes`
- [ ] Frontend se ve en `https://tudominio.com`

---

🔮 **¡Listo! Tu aplicación Taroti está en producción!**
