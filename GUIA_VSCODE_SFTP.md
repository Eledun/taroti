# 📤 Guía: Subir a Hostinger con VS Code SFTP Extension

## ✅ Todo está compilado y listo

- ✓ Backend compilado en `backend/dist/`
- ✓ Frontend compilado en `frontend/build/`

---

## 📝 Paso 1: Instalar la Extensión SFTP

1. Abre VS Code
2. Presiona `Cmd+Shift+X` (o `Ctrl+Shift+X` en Windows)
3. Busca: **"SFTP"**
4. Instala: **"SFTP" de Natizyskunk** (la extensión con más descargas)

![SFTP Extension](https://github.com/Natizyskunk/vscode-sftp/raw/master/assets/vscode-sftp-logo.png)

---

## 🔐 Paso 2: Configurar Credenciales

1. Copia el archivo de ejemplo:
   ```bash
   cp .vscode/sftp.json.example .vscode/sftp.json
   ```

2. Edita `.vscode/sftp.json` y **reemplaza** `TU_PASSWORD_AQUI` con tu contraseña real de FTP:

   ```json
   {
     "name": "Hostinger",
     "host": "46.202.145.196",
     "protocol": "ftp",
     "port": 21,
     "username": "u616221621",
     "password": "aqui_tu_password_real",
     "remotePath": "/public_html"
   }
   ```

3. Guarda el archivo (`Cmd+S`)

**⚠️ IMPORTANTE**: NO hagas commit de este archivo con la contraseña. Ya está en `.gitignore`.

---

## 📤 Paso 3: Subir Backend

### 3.1 Crear estructura de carpetas en el servidor

1. Presiona `Cmd+Shift+P` (Command Palette)
2. Escribe: `SFTP: List`
3. Selecciona "Hostinger"
4. Navega a `/public_html`
5. Click derecho → "Create Folder" → Nombra: `api`

### 3.2 Subir archivos del backend

Para cada archivo/carpeta, haz:
- Click derecho en el archivo/carpeta → **"Upload"**

Sube en este orden:

1. **`backend/package.json`**
   - Click derecho → Upload
   - Destino: `/public_html/api/package.json`

2. **`backend/package-lock.json`**
   - Click derecho → Upload
   - Destino: `/public_html/api/package-lock.json`

3. **`backend/dist/`** (carpeta completa)
   - Click derecho en la carpeta `backend/dist` → Upload Folder
   - Destino: `/public_html/api/dist/`

4. **`backend/prisma/`** (carpeta completa)
   - Click derecho en la carpeta `backend/prisma` → Upload Folder
   - Destino: `/public_html/api/prisma/`

5. **`backend/.htaccess`**
   - Click derecho → Upload
   - Destino: `/public_html/api/.htaccess`

---

## 📤 Paso 4: Subir Frontend

Sube TODO el contenido de `frontend/build/` a `/public_html/`:

1. Abre la carpeta `frontend/build/`
2. Selecciona TODO (`Cmd+A`)
3. Click derecho → **"Upload"**
4. Confirma que se subirá a `/public_html/`

Deberías ver subiendo:
- `index.html`
- `_app/` (carpeta)
- `arcan_mayor/` (carpeta)
- `backsong.mp3`
- `consultasong.mp3`
- `robots.txt`

---

## ✅ Paso 5: Verificar Estructura en Hostinger

Presiona `Cmd+Shift+P` → "SFTP: List" → Navega por el servidor.

Deberías ver esta estructura:

```
/public_html/
  ├── index.html           ← Frontend
  ├── _app/
  ├── arcan_mayor/
  ├── backsong.mp3
  ├── consultasong.mp3
  ├── robots.txt
  └── api/                 ← Backend
      ├── dist/
      │   ├── index.js
      │   ├── config/
      │   ├── plugins/
      │   ├── routes/
      │   └── services/
      ├── prisma/
      │   ├── schema.prisma
      │   ├── migrations/
      │   └── seed.ts
      ├── package.json
      ├── package-lock.json
      └── .htaccess
```

---

## ⚙️ Paso 6: Configurar Backend en Hostinger

### 6.1 Conectar por SSH

Opción A - Desde hPanel:
1. Ve a **hPanel** → **Avanzado** → **Terminal SSH**

Opción B - Desde tu terminal:
```bash
ssh u616221621@46.202.145.196
```

### 6.2 Instalar dependencias

```bash
cd /home/u616221621/public_html/api
npm install --production
npx prisma generate
```

### 6.3 Crear archivo `.env`

```bash
nano .env
```

Pega este contenido (reemplaza con tus credenciales reales):

```env
NODE_ENV=production
PORT=4000

# MySQL de Hostinger
DATABASE_URL="mysql://u616221621_taroti:TU_PASSWORD@localhost:3306/u616221621_taroti?charset=utf8mb4"

# Generar con: openssl rand -base64 32
JWT_SECRET="genera-un-secret-seguro-aqui"
REFRESH_TOKEN_EXPIRES_IN="30d"
JWT_EXPIRES_IN="7d"

ADMIN_JWT_SECRET="otro-secret-diferente"
ADMIN_JWT_EXPIRES_IN="4h"

ADMIN_USER="admin"
ADMIN_PASSWORD_HASH="$2b$10$..."

# Mercado Pago PRODUCCIÓN (NO test)
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

### 6.4 Migrar base de datos

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 6.5 Iniciar aplicación Node.js

1. Ve a **hPanel** → **Avanzado** → **Node.js**
2. Click en **"Crear aplicación"**
3. Configura:
   - **Versión**: Node 20.x (LTS)
   - **Modo**: Production
   - **Carpeta de aplicación**: `/public_html/api`
   - **Archivo de inicio**: `dist/index.js`
   - **Puerto**: `4000`
   - **Dominio**: `api.tudominio.com`
4. Click en **"Crear"**
5. Click en **"Iniciar"**

---

## 🧪 Paso 7: Verificar que Funciona

### Backend
Abre en el navegador:
```
https://api.tudominio.com/api/planes
```

Deberías ver un JSON con los planes disponibles.

### Frontend
Abre:
```
https://tudominio.com
```

Deberías ver la página de inicio de Taroti.

---

## 🐛 Troubleshooting

### Error: "Cannot connect to FTP"

Verifica:
- La contraseña en `.vscode/sftp.json` sea correcta
- El puerto sea `21` (no 22)
- El protocolo sea `"ftp"` (no `"sftp"`)

### Error: "Permission denied"

El usuario `u616221621` debe tener permisos de escritura en `/public_html`. Contacta a Hostinger si no puedes subir archivos.

### La extensión no aparece en el menú

Reinicia VS Code después de instalar la extensión.

---

## 📋 Checklist Final

- [ ] Extensión SFTP instalada en VS Code
- [ ] Archivo `.vscode/sftp.json` configurado con contraseña
- [ ] Backend subido a `/public_html/api/`
- [ ] Frontend subido a `/public_html/`
- [ ] Dependencias instaladas en el servidor
- [ ] Archivo `.env` creado con credenciales de producción
- [ ] Migraciones aplicadas
- [ ] Datos sembrados
- [ ] Aplicación Node.js iniciada desde hPanel
- [ ] Backend responde en `https://api.tudominio.com/api/planes`
- [ ] Frontend funciona en `https://tudominio.com`

---

🔮 **¡Listo! Tu aplicación Taroti está en producción!**
