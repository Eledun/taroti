# 📤 Deploy a Hostinger con VS Code y SFTP

Esta guía te muestra cómo subir los archivos de Taroti a Hostinger usando VS Code y la extensión SFTP.

---

## 📦 1. Instalar Extensión SFTP en VS Code

### Opción A: Desde VS Code

1. Abre VS Code
2. Ve a Extensions (⌘+Shift+X en Mac, Ctrl+Shift+X en Windows)
3. Busca: **"SFTP"** por Natizyskunk
4. Click en **Install**

### Opción B: Link Directo

https://marketplace.visualstudio.com/items?itemName=Natizyskunk.sftp

---

## 🔧 2. Configurar SFTP

### 2.1 Obtener Credenciales de Hostinger

1. Inicia sesión en **hPanel** de Hostinger
2. Ve a **Archivos** → **Administrador de archivos FTP**
3. Anota las credenciales:

```
Host: ftp.tudominio.com (o tu IP del servidor)
Puerto: 22 (SFTP)
Usuario: u123456789 (tu usuario de hPanel)
Contraseña: (tu contraseña de hPanel)
```

### 2.2 Crear Archivo de Configuración

1. En VS Code, abre la carpeta del proyecto Taroti
2. Crea el archivo: `.vscode/sftp.json`
3. Copia el contenido de `.vscode/sftp.json.example`
4. Actualiza con tus credenciales reales:

```json
{
    "name": "Hostinger Producción",
    "host": "ftp.tudominio.com",
    "protocol": "sftp",
    "port": 22,
    "username": "u123456789",
    "password": "TuPasswordDeHostinger",
    "remotePath": "/home/u123456789/domains",
    "uploadOnSave": false,
    "useTempFile": false,
    "openSsh": false,
    "ignore": [
        ".vscode",
        ".git",
        ".DS_Store",
        "node_modules",
        ".env",
        ".env.local",
        "*.log",
        "logs/",
        "dist/",
        "build/",
        ".svelte-kit/",
        "CREDENCIALES_PRODUCCION.md"
    ]
}
```

### 2.3 Seguridad del Archivo

⚠️ **IMPORTANTE**: El archivo `sftp.json` contiene tu contraseña

```bash
# Asegúrate de que esté en .gitignore
echo ".vscode/sftp.json" >> .gitignore
```

**Alternativa Segura**: Usa SSH Key en lugar de contraseña

```json
{
    "username": "u123456789",
    "privateKeyPath": "/Users/tu-usuario/.ssh/id_rsa",
    "passphrase": ""
}
```

---

## 📁 3. Estructura de Carpetas en Hostinger

Antes de subir archivos, verifica la estructura:

```
/home/u123456789/
├── domains/
│   ├── tudominio.com/
│   │   └── public_html/           ← FRONTEND aquí
│   │       ├── index.html
│   │       ├── _app/
│   │       ├── assets/
│   │       └── .htaccess
│   └── api.tudominio.com/
│       ├── public_html/
│       │   └── .htaccess           ← Solo el .htaccess
│       └── nodejs/
│           └── taroti-backend/     ← BACKEND aquí
│               ├── dist/
│               ├── node_modules/
│               ├── prisma/
│               ├── package.json
│               └── .env
```

---

## 🚀 4. Compilar Aplicaciones Localmente

### 4.1 Backend

```bash
cd backend
./deploy-production.sh
```

Esto genera:
- `/dist` - Código compilado
- `/node_modules` - Dependencias
- Prisma Client generado

### 4.2 Frontend

```bash
cd frontend
./deploy-production.sh
```

Esto genera:
- `/build` - Aplicación compilada

---

## 📤 5. Subir Archivos con SFTP

### Método 1: Subir Todo el Proyecto

1. En VS Code, abre la paleta de comandos (⌘+Shift+P o Ctrl+Shift+P)
2. Escribe: `SFTP: Upload Project`
3. Selecciona los archivos a subir
4. Confirma

⚠️ **CUIDADO**: Esto subirá todo, incluyendo archivos grandes como `node_modules`

### Método 2: Subir Carpetas Específicas (Recomendado)

#### Backend

1. Click derecho en la carpeta `backend/dist/`
2. Selecciona: **SFTP: Upload Folder**
3. Confirma la ruta remota: `/home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend/dist/`

Repite para:
- `backend/prisma/` → `/nodejs/taroti-backend/prisma/`
- `backend/package.json` → `/nodejs/taroti-backend/package.json`
- `backend/.htaccess` → `/public_html/.htaccess`

#### Frontend

1. Click derecho en `frontend/build/`
2. SFTP: Upload Folder
3. Ruta remota: `/home/u123456789/domains/tudominio.com/public_html/`

**IMPORTANTE**: Sube el CONTENIDO de `build/`, no la carpeta `build/` en sí.

### Método 3: Sincronizar (Más Rápido)

```
1. ⌘+Shift+P (Ctrl+Shift+P)
2. SFTP: Sync Local -> Remote
3. Selecciona carpeta
```

Esto solo sube archivos modificados.

---

## ⚙️ 6. Instalar Dependencias en el Servidor

Después de subir el backend:

### Via SSH en hPanel

1. Ve a hPanel → **Avanzado** → **Terminal SSH**
2. Ejecuta:

```bash
cd /home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend

# Instalar dependencias
npm install --production

# Generar Prisma Client
npx prisma generate
```

### Via SFTP (no recomendado)

Subir `node_modules` vía SFTP es LENTO (miles de archivos).

**Mejor**: Instalar directamente en el servidor con `npm install`.

---

## 🗄️ 7. Crear .env en Producción

**NO subas el .env local** (tiene credenciales de desarrollo).

### Via SSH

```bash
cd /home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend

# Crear archivo .env
nano .env
```

Pega el contenido de producción:

```bash
NODE_ENV=production
PORT=4000
DATABASE_URL="mysql://u123_taroti:pass@localhost:3306/u123_taroti?charset=utf8mb4"
JWT_SECRET="<generar-nuevo>"
ADMIN_JWT_SECRET="<generar-nuevo>"
ADMIN_PASSWORD_HASH="<generar-con-bcrypt>"
MERCADOPAGO_ACCESS_TOKEN="APP_USR-8356147486860198-..."
MERCADOPAGO_PUBLIC_KEY="APP_USR-f04ae6a6-0e9c-413d-9a86-ce5b0e28c059"
MERCADOPAGO_WEBHOOK_SECRET="<tu-secret>"
OPENAI_API_KEY="sk-proj-..."
FRONTEND_URL="https://tudominio.com"
BACKEND_URL="https://api.tudominio.com/api"
```

Guarda: `Ctrl+X` → `Y` → `Enter`

### Via SFTP (cuidado)

1. Crea `backend/.env.production` localmente
2. Renómbralo a `.env`
3. Súbelo vía SFTP

⚠️ **PELIGRO**: Si subes el `.env` equivocado, puede exponer credenciales.

---

## 🎯 8. Aplicar Migraciones de Base de Datos

Via SSH:

```bash
cd /home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend

# Aplicar migraciones
npx prisma migrate deploy

# Sembrar datos iniciales
npx tsx prisma/seed.ts
```

---

## 🚀 9. Iniciar la Aplicación Node.js

### Via hPanel

1. Ve a **Avanzado** → **Node.js**
2. Click en tu aplicación `taroti-backend`
3. Click en **Restart** o **Start**

### Via SSH con PM2

```bash
# Iniciar con PM2
pm2 start dist/index.js --name taroti-backend

# Ver estado
pm2 status

# Ver logs
pm2 logs taroti-backend
```

---

## ✅ 10. Verificar el Deploy

### Backend API

```bash
curl https://api.tudominio.com/api/planes
```

Debe retornar JSON con los planes.

### Frontend

```
https://tudominio.com
```

Debe cargar la página principal.

### Webhook de MP

```bash
curl -X POST https://api.tudominio.com/api/pagos/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"123"}}'
```

---

## 🔄 11. Workflow de Updates

Cuando hagas cambios:

### Backend

```bash
# 1. Compilar localmente
cd backend
npm run build

# 2. Subir solo /dist via SFTP
# Click derecho en dist/ → SFTP: Upload Folder

# 3. Reiniciar en Hostinger
# hPanel → Node.js → Restart
```

### Frontend

```bash
# 1. Compilar localmente
cd frontend
npm run build

# 2. Subir /build via SFTP
# Click derecho en build/ → SFTP: Upload Folder

# 3. No requiere reinicio (archivos estáticos)
```

---

## 🐛 12. Troubleshooting SFTP

### Error: "Connection timeout"

**Solución**:
1. Verifica que el puerto sea `22` (SFTP)
2. Verifica que el host sea correcto
3. Prueba desde terminal:
   ```bash
   sftp u123456789@ftp.tudominio.com
   ```

### Error: "Permission denied"

**Solución**:
1. Verifica usuario y contraseña en `sftp.json`
2. Verifica permisos en Hostinger
3. Intenta cambiar contraseña en hPanel

### Error: "Remote directory does not exist"

**Solución**:
1. Crea las carpetas manualmente via SSH o hPanel
2. Verifica la ruta en `remotePath`

### Archivos no se suben

**Solución**:
1. Verifica que no estén en la lista `ignore` de `sftp.json`
2. Revisa los logs: View → Output → SFTP

---

## 📋 Checklist de Deploy

- [ ] Extensión SFTP instalada en VS Code
- [ ] `.vscode/sftp.json` creado con credenciales
- [ ] `.vscode/sftp.json` agregado a .gitignore
- [ ] Backend compilado (`./deploy-production.sh`)
- [ ] Frontend compilado (`./deploy-production.sh`)
- [ ] Backend subido vía SFTP
- [ ] Frontend subido vía SFTP
- [ ] `npm install` ejecutado en servidor
- [ ] `.env` de producción creado en servidor
- [ ] Migraciones aplicadas (`prisma migrate deploy`)
- [ ] Seed ejecutado (`prisma db seed`)
- [ ] Aplicación Node.js iniciada
- [ ] Backend verificado (curl a /api/planes)
- [ ] Frontend verificado (abrir en navegador)

---

## 💡 Tips

### 1. Usar SSH Key (más seguro)

```bash
# Generar SSH key
ssh-keygen -t rsa -b 4096 -C "tu@email.com"

# Copiar key al servidor
ssh-copy-id u123456789@ftp.tudominio.com

# Actualizar sftp.json
{
    "privateKeyPath": "~/.ssh/id_rsa"
}
```

### 2. Upload on Save (opcional)

Para desarrollo rápido:

```json
{
    "uploadOnSave": true
}
```

⚠️ Cada vez que guardes, subirá el archivo automáticamente.

### 3. Excluir más archivos

```json
{
    "ignore": [
        "*.test.js",
        "*.spec.ts",
        "test/**",
        "*.md"
    ]
}
```

---

## 📞 Ayuda

**SFTP Extension**:
- Docs: https://github.com/Natizyskunk/vscode-sftp

**Hostinger**:
- hPanel: https://hpanel.hostinger.com
- Soporte: Chat 24/7

---

**Última actualización**: 2026-05-18
**Estado**: ✅ Listo para deploy con VS Code + SFTP
