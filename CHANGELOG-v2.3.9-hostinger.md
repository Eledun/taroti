# Changelog v2.3.9 - Deploy Hostinger

**Fecha:** 2026-06-08
**Tipo:** Infraestructura y Deploy

---

## 🎯 Resumen

Configuración completa para deploy en Hostinger con Passenger, incluyendo scripts automatizados y documentación.

---

## ✨ Nuevo

### Scripts de Deploy

- ✅ **deploy-hostinger.sh** - Script automatizado de deploy completo
  - Verifica archivos locales antes de subir
  - Crea backup automático del build anterior
  - Sube archivos por SCP
  - Instala dependencias en servidor
  - Reinicia Passenger automáticamente
  - Verifica que el sitio responda con HTTP 200

### Comandos NPM

- ✅ `npm run deploy:hostinger` - Deploy sin rebuild
- ✅ `npm run deploy:build` - Build + Deploy automático

### Documentación

- ✅ **docs/DEPLOY-HOSTINGER.md** - Guía completa de deploy (8.8KB)
  - Configuración inicial
  - Deploy automático y manual
  - Estructura de archivos
  - Troubleshooting detallado
  - Variables de entorno
  
- ✅ **DEPLOY-QUICK-START.md** - Guía rápida de deploy (2.7KB)
  - Comandos esenciales
  - Verificación rápida
  - Troubleshooting común

### Archivos de Configuración

- ✅ **.env.production.example** - Template de variables de entorno
- ✅ **.htaccess.hostinger** - Configuración de Passenger
- ✅ **start-server.js** - Corregida ruta a `./build/handler.js`

---

## 🔧 Cambios

### start-server.js

```diff
- import { handler } from './handler.js';
+ import { handler } from './build/handler.js';
```

**Razón:** En Hostinger, el archivo handler.js está en `build/`, no en la raíz.

### package.json

```diff
- "build": "vite build && npm run postbuild",
- "postbuild": "cp start-server.js build/ && cp .env build/ 2>/dev/null || echo 'No .env to copy'",
+ "build": "vite build",
+ "deploy:hostinger": "./deploy-hostinger.sh",
+ "deploy:build": "npm run build && ./deploy-hostinger.sh"
```

**Razón:** El postbuild no es necesario porque los archivos se despliegan directamente al servidor.

---

## 📁 Estructura de Deploy en Hostinger

```
/home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/
├── public_html/           # Solo contiene .htaccess
│   └── .htaccess
└── nodejs/                # ✅ Directorio activo (Passenger ejecuta desde aquí)
    ├── build/             # Build de SvelteKit
    ├── node_modules/      # Dependencias
    ├── tmp/
    │   └── restart.txt    # Touch para reiniciar
    ├── package.json
    ├── start-server.js
    ├── .env
    ├── console.log
    └── stderr.log
```

---

## 🐛 Problemas Resueltos

### Error 503 Service Unavailable

**Problema:** Passenger ejecutaba desde `public_html/` pero los archivos estaban mal ubicados.

**Solución:** 
1. Archivos deployados a `nodejs/` en lugar de `public_html/`
2. Corregida ruta en `start-server.js` a `./build/handler.js`
3. Script de deploy automatizado para evitar errores

### Module Not Found

**Problema:** `start-server.js` buscaba `./handler.js` que no existía.

**Solución:** Actualizada ruta a `./build/handler.js`

---

## 📊 Verificación del Deploy

✅ **URL:** https://dimgrey-louse-600796.hostingersite.com
✅ **Status:** HTTP/2 200
✅ **Passenger:** Configurado y funcionando
✅ **Variables de Entorno:** Todas configuradas
✅ **Base de Datos:** MySQL conectada (localhost)
✅ **Mercado Pago:** Configurado
✅ **OpenAI:** Configurado

---

## 🚀 Cómo Usar

### Deploy Rápido

```bash
npm run deploy:build
```

### Deploy Manual

```bash
npm run build
./deploy-hostinger.sh
```

### Ver Logs

```bash
ssh -p 65002 u616221621@185.173.111.183 \
  'cat ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/console.log'
```

---

## 📝 Notas

- **Servidor SSH:** 185.173.111.183:65002
- **Usuario:** u616221621
- **Node.js:** v22.18.0 (alt-nodejs22)
- **Servidor de Apps:** Phusion Passenger
- **Base de Datos:** MySQL 8.0

---

## 🔜 Próximos Pasos

- [ ] Configurar dominio personalizado (taroti.fun)
- [ ] Configurar SSL/HTTPS para dominio personalizado
- [ ] Automatizar deploy con GitHub Actions (opcional)
- [ ] Configurar monitoreo de uptime

---

**Documentación Completa:** Ver `docs/DEPLOY-HOSTINGER.md`
