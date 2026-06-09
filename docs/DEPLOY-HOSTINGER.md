# Guía de Deploy a Hostinger

**Versión:** 2.3.9
**Fecha:** 2026-06-08
**Servidor:** Hostinger Premium

---

## 📋 Tabla de Contenidos

1. [Resumen del Deploy](#resumen-del-deploy)
2. [Configuración Inicial](#configuración-inicial)
3. [Deploy Automático](#deploy-automático)
4. [Deploy Manual](#deploy-manual)
5. [Estructura de Archivos en Hostinger](#estructura-de-archivos-en-hostinger)
6. [Troubleshooting](#troubleshooting)
7. [Variables de Entorno](#variables-de-entorno)

---

## 🎯 Resumen del Deploy

Taroti se despliega en Hostinger utilizando **Passenger** (Phusion Passenger) como servidor de aplicaciones Node.js.

**Datos del Servidor:**
- **Host:** 185.173.111.183
- **Puerto SSH:** 65002
- **Usuario:** u616221621
- **Dominio temporal:** dimgrey-louse-600796.hostingersite.com
- **Directorio activo:** `/home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs/`

⚠️ **IMPORTANTE:** Aunque existe el directorio `public_html/`, **Passenger ejecuta desde `nodejs/`**

---

## ⚙️ Configuración Inicial

### 1. Configurar SSH en tu máquina local

Agrega esto a tu `~/.ssh/config`:

```ssh
Host hostinger-taroti
    HostName 185.173.111.183
    Port 65002
    User u616221621
    IdentityFile ~/.ssh/id_rsa
```

### 2. Variables de Entorno en el Servidor

Crear archivo `.env` en `/home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs/.env`:

```env
NODE_ENV=production
PORT=3000
ORIGIN=https://dimgrey-louse-600796.hostingersite.com
FRONTEND_URL=https://dimgrey-louse-600796.hostingersite.com

DB_HOST=localhost
DB_USER=u616221621_figo
DB_PASSWORD=TarotiDB2026!
DB_NAME=u616221621_taroti
DB_PORT=3306

MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXX
PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-XXXXXXX
MERCADOPAGO_WEBHOOK_SECRET=XXXXXXX

OPENAI_API_KEY=sk-proj-XXXXXXX
```

### 3. Configuración de Passenger (.htaccess)

El archivo `.htaccess` en `public_html/` debe contener:

```apache
PassengerEnabled on
PassengerAppRoot /home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/public_html
PassengerAppType node
PassengerStartupFile start-server.js
PassengerNodejs /opt/alt/alt-nodejs22/root/bin/node
PassengerBaseURI /
```

---

## 🚀 Deploy Automático

### Opción 1: Script de Deploy Completo

```bash
# 1. Construir la aplicación localmente
npm run build

# 2. Ejecutar el script de deploy
./deploy-hostinger.sh
```

El script automáticamente:
1. ✅ Verifica que existan todos los archivos necesarios
2. ✅ Crea backup del build anterior
3. ✅ Sube `build/`, `package.json`, `start-server.js` y `.env`
4. ✅ Instala dependencias en el servidor
5. ✅ Reinicia Passenger
6. ✅ Verifica que el sitio responda con HTTP 200

### Requisitos para el Script

- `sshpass` instalado (opcional, o usa claves SSH)
- Conexión SSH configurada
- Contraseña SSH de Hostinger

---

## 🔧 Deploy Manual

### Paso 1: Construir Localmente

```bash
npm run build
```

### Paso 2: Conectar por SSH

```bash
ssh -p 65002 u616221621@185.173.111.183
```

### Paso 3: Preparar el Directorio

```bash
cd ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs

# Backup del build anterior
mv build build.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No hay build previo"
```

### Paso 4: Subir Archivos (desde tu máquina local)

```bash
# Subir build
scp -P 65002 -r ./build u616221621@185.173.111.183:/home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs/

# Subir package.json
scp -P 65002 ./package.json u616221621@185.173.111.183:/home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs/

# Subir start-server.js
scp -P 65002 ./start-server.js u616221621@185.173.111.183:/home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs/

# Subir .env (si cambió)
scp -P 65002 ./.env.production u616221621@185.173.111.183:/home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs/.env
```

### Paso 5: Instalar Dependencias en el Servidor

```bash
# Conectar por SSH
ssh -p 65002 u616221621@185.173.111.183

# Ir al directorio
cd ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs

# Configurar PATH para Node.js
export PATH=/opt/alt/alt-nodejs22/root/bin:$PATH

# Instalar dependencias
npm install --production
```

### Paso 6: Reiniciar Passenger

```bash
touch ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/tmp/restart.txt
```

### Paso 7: Verificar

```bash
# Ver logs
cat ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/console.log
cat ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/stderr.log

# Probar el sitio
curl -I https://dimgrey-louse-600796.hostingersite.com
```

Deberías ver `HTTP/2 200` si todo está correcto.

---

## 📁 Estructura de Archivos en Hostinger

```
/home/u616221621/
├── domains/
│   └── dimgrey-louse-600796.hostingersite.com/
│       ├── public_html/              # NO se usa (solo .htaccess)
│       │   └── .htaccess
│       └── nodejs/                   # ✅ DIRECTORIO ACTIVO
│           ├── build/                # Build de SvelteKit
│           │   ├── handler.js
│           │   ├── index.js
│           │   └── client/
│           ├── node_modules/         # Dependencias
│           ├── tmp/
│           │   └── restart.txt       # Toca este archivo para reiniciar
│           ├── package.json
│           ├── start-server.js       # Punto de entrada
│           ├── .env                  # Variables de entorno
│           ├── console.log           # Logs stdout
│           └── stderr.log            # Logs stderr
```

---

## 🐛 Troubleshooting

### Error 503 Service Unavailable

**Causas comunes:**
1. ❌ Archivos no están en el directorio `nodejs/`
2. ❌ `start-server.js` tiene la ruta incorrecta a `handler.js`
3. ❌ Falta el archivo `.env`
4. ❌ Dependencias no instaladas (`node_modules/`)

**Solución:**
```bash
# Ver logs de error
ssh -p 65002 u616221621@185.173.111.183 \
  'cat ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/stderr.log'

# Verificar archivos
ssh -p 65002 u616221621@185.173.111.183 \
  'ls -la ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/'

# Reinstalar dependencias
ssh -p 65002 u616221621@185.173.111.183 << 'EOF'
cd ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs
export PATH=/opt/alt/alt-nodejs22/root/bin:$PATH
rm -rf node_modules package-lock.json
npm install --production
touch tmp/restart.txt
EOF
```

### Base de Datos no Conecta

**Verificar:**
```bash
ssh -p 65002 u616221621@185.173.111.183 \
  'mysql -h localhost -u u616221621_figo -pTarotiDB2026! -e "SHOW DATABASES;"'
```

### Passenger no Reinicia

```bash
# Reinicio manual
ssh -p 65002 u616221621@185.173.111.183 << 'EOF'
cd ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs
rm -rf tmp
mkdir -p tmp
touch tmp/restart.txt
EOF
```

### Ver Logs en Tiempo Real

```bash
# Console logs
ssh -p 65002 u616221621@185.173.111.183 \
  'tail -f ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/console.log'

# Error logs
ssh -p 65002 u616221621@185.173.111.183 \
  'tail -f ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/stderr.log'
```

---

## 🔐 Variables de Entorno

### Archivo `.env.production` (Local)

Crea este archivo localmente para el deploy:

```env
NODE_ENV=production
PORT=3000
ORIGIN=https://dimgrey-louse-600796.hostingersite.com
FRONTEND_URL=https://dimgrey-louse-600796.hostingersite.com

DB_HOST=localhost
DB_USER=u616221621_figo
DB_PASSWORD=TarotiDB2026!
DB_NAME=u616221621_taroti
DB_PORT=3306

MERCADOPAGO_ACCESS_TOKEN=APP_USR-8356147486860198-032514-a227c17180bf1f40d43ca9250260cd17-3291172411
PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-f04ae6a6-0e9c-413d-9a86-ce5b0e28c059
MERCADOPAGO_WEBHOOK_SECRET=3a1441020e71ded89ff87c1f2b0ab452d7c63855027458f4df61834237be5c45

OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

⚠️ **No commitear este archivo a Git**

---

## 📝 Checklist de Deploy

- [ ] `npm run build` ejecutado exitosamente
- [ ] `.env.production` actualizado con credenciales correctas
- [ ] `start-server.js` apunta a `./build/handler.js`
- [ ] Backup del build anterior creado
- [ ] Archivos subidos a `nodejs/` (NO `public_html/`)
- [ ] Dependencias instaladas en servidor
- [ ] Passenger reiniciado (`touch tmp/restart.txt`)
- [ ] Sitio responde con HTTP 200
- [ ] Logs verificados sin errores

---

## 🆘 Soporte

**Contactos:**
- Hosting: Hostinger Support
- SSH: puerto 65002
- Panel de Control: https://hpanel.hostinger.com

**Logs Útiles:**
```bash
# Console log (stdout)
~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/console.log

# Error log (stderr)
~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/stderr.log
```

---

**Última actualización:** 2026-06-08
**Versión:** 2.3.9
