# Changelog v2.3.11 - Fixes Deploy Hostinger

**Fecha:** 2026-06-09
**Tipo:** Hotfix - Correcciones críticas para producción
**Estado:** ✅ Deployed en Hostinger

---

## 🎯 Resumen

Correcciones críticas para deployment en Hostinger con Passenger, incluyendo compatibilidad ESM/CommonJS, configuración de base de datos con Unix socket, y migración de tabla `lecturas`.

---

## 🐛 Problemas Resueltos

### 1. Error 503 - Service Unavailable

**Problema:** Passenger no podía cargar archivos ESM (módulos ES6) porque requiere CommonJS.

**Error:**
```
Error [ERR_REQUIRE_ASYNC_MODULE]: require() cannot be used on an ESM graph with top-level await
```

**Solución:**
- Creado `start-wrapper.cjs` que actúa como puente entre CommonJS (Passenger) y ESM (SvelteKit)
- Usa imports dinámicos `await import()` para cargar módulos ESM
- Actualizado `.htaccess` para usar `PassengerStartupFile start-wrapper.cjs`

**Archivos:**
- ✅ Nuevo: `start-wrapper.cjs`
- ✅ Actualizado: `.htaccess.hostinger`

---

### 2. Conexión de Base de Datos - Unix Socket

**Problema:** Hostinger MySQL solo acepta conexiones por Unix socket (`/var/lib/mysql/mysql.sock`), NO por TCP/IP (`localhost:3306`).

**Error:**
```
SqlError: pool failed to retrieve a connection from pool
```

**Solución:**
- Configurada variable de entorno `DB_SOCKET=/var/lib/mysql/mysql.sock`
- El código en `src/lib/db.js` ya tenía soporte para socket, solo faltaba la variable

**Configuración:**
```env
DB_SOCKET=/var/lib/mysql/mysql.sock
```

**Verificación:**
```
[DB] Pool MariaDB creado: {
  socketPath: '/var/lib/mysql/mysql.sock',
  database: 'u616221621_taroti',
  connectionLimit: 10
}
```

---

### 3. Tabla `lecturas` - Columnas Faltantes

**Problema:** La tabla `lecturas` en producción tenía una estructura antigua sin las columnas requeridas por el código actual.

**Error:**
```
SqlError: Unknown column 'plan_id' in 'INSERT INTO'
```

**Solución:**
- Creada migración `db/migrations/v2.3.11_fix_lecturas_table.sql`
- Agregadas columnas:
  - `plan_id` VARCHAR(100)
  - `plan_nombre` VARCHAR(100)
  - `precio` INT
  - `estado` ENUM('pendiente', 'pagada', 'completada', 'expirada')
  - `tipo_usuario` ENUM('registrado', 'anonimo')
  - `expira_en` DATETIME
  - `fecha_actualizacion` DATETIME
- Agregados índices para optimización:
  - `idx_plan_id`
  - `idx_estado`
  - `idx_expira_en`

**Archivos:**
- ✅ Nuevo: `db/migrations/v2.3.11_fix_lecturas_table.sql`

---

### 4. Foreign Key Incorrecta

**Problema:** La tabla `lecturas` tenía una foreign key que requería que el registro existiera primero en `pagos`, pero el flujo correcto es al revés.

**Error:**
```
SqlError: Cannot add or update a child row: a foreign key constraint fails
CONSTRAINT `lecturas_ibfk_1` FOREIGN KEY (`sesion_id`) REFERENCES `pagos` (`sesion_id`)
```

**Solución:**
- Eliminada foreign key `lecturas_ibfk_1`
- El flujo correcto es: `lecturas` → `pagos` (no al revés)

**SQL:**
```sql
ALTER TABLE lecturas DROP FOREIGN KEY lecturas_ibfk_1;
```

---

### 5. Configuración `.htaccess` - NODE_OPTIONS

**Problema:** La línea `SetEnv NODE_OPTIONS` tenía un salto de línea que causaba el error "--require requires an argument".

**Error:**
```
/opt/alt/alt-nodejs22/root/bin/node: --require requires an argument
```

**Solución:**
- Removida línea `SetEnv NODE_OPTIONS` problemática del `.htaccess`
- Simplificada configuración a lo esencial

---

## ✨ Archivos Nuevos

### `start-wrapper.cjs`

Wrapper CommonJS que permite a Passenger cargar la aplicación ESM de SvelteKit.

```javascript
// Wrapper CommonJS para cargar el servidor ESM en Hostinger Passenger
require('dotenv').config();

(async () => {
  const { handler } = await import('./build/handler.js');
  const express = (await import('express')).default;

  const app = express();
  app.use(handler);

  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  app.listen(PORT, HOST, () => {
    console.log(`✓ Taroti Server running on http://${HOST}:${PORT}`);
  });

  module.exports = app;
})();
```

### `db/migrations/v2.3.11_fix_lecturas_table.sql`

Migración idempotente para actualizar la tabla `lecturas` con todas las columnas necesarias.

- Verifica si cada columna/índice existe antes de crearla
- Elimina foreign key incorrecta si existe
- Muestra estructura final para verificación

---

## 🔧 Archivos Actualizados

### `.htaccess.hostinger`

```apache
PassengerAppRoot /home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs
PassengerAppType node
PassengerNodejs /opt/alt/alt-nodejs22/root/bin/node
PassengerStartupFile start-wrapper.cjs  # ← Cambiado de build/index.cjs
PassengerBaseURI /
PassengerRestartDir /home/u616221621/domains/dimgrey-louse-600796.hostingersite.com/nodejs/tmp
SetEnv LSNODE_CONSOLE_LOG console.log
RewriteRule ^\.builds - [F,L]
```

### `.env.production.example`

```env
# Base de Datos MySQL (Hostinger)
# IMPORTANTE: Hostinger requiere conexión por Unix socket, NO por TCP/IP
DB_HOST=localhost
DB_USER=u616221621_figo
DB_PASSWORD=TU_PASSWORD_MYSQL_AQUI
DB_NAME=u616221621_taroti
DB_PORT=3306
DB_SOCKET=/var/lib/mysql/mysql.sock  # ← Nueva variable
```

---

## ✅ Verificación del Deploy

### Sitio Web

```bash
curl -I https://dimgrey-louse-600796.hostingersite.com
# HTTP/2 200 ✅
```

### API - Planes

```bash
curl "https://dimgrey-louse-600796.hostingersite.com/api/planes"
# [{"id":"tres-cartas","precio_final":1000},...]  ✅
```

### API - Crear Sesión

```bash
curl -X POST "https://dimgrey-louse-600796.hostingersite.com/api/sesiones" \
  -H "Content-Type: application/json" \
  -d '{"plan_id":"tres-cartas","pregunta":"Test","cartas":[0,1,2]}'
# {"id":"...", "estado":"pendiente", ...} ✅
```

### API - Mercado Pago

```bash
curl -X POST "https://dimgrey-louse-600796.hostingersite.com/api/pagos/preference" \
  -H "Content-Type: application/json" \
  -d '{"sesion_id":"SESION_ID"}'
# {"preference_id":"...","init_point":"https://www.mercadopago.cl/..."} ✅
```

### Base de Datos - Conexión

```bash
# En logs de servidor
[DB] Pool MariaDB creado: {
  socketPath: '/var/lib/mysql/mysql.sock',  # ✅ Usando socket Unix
  database: 'u616221621_taroti',
  connectionLimit: 10
}
```

---

## 📋 Checklist de Deploy

Cuando hagas deploy a Hostinger, sigue estos pasos:

### 1. Build Local

```bash
npm run build
```

### 2. Subir Archivos

```bash
# Build
scp -P 65002 -r ./build u616221621@185.173.111.183:~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/

# Configuración
scp -P 65002 ./package.json u616221621@185.173.111.183:~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/
scp -P 65002 ./start-wrapper.cjs u616221621@185.173.111.183:~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/

# .htaccess
scp -P 65002 ./.htaccess.hostinger u616221621@185.173.111.183:~/domains/dimgrey-louse-600796.hostingersite.com/public_html/.htaccess
```

### 3. Ejecutar Migración (Solo Primera Vez)

```bash
ssh -p 65002 u616221621@185.173.111.183

mysql -u u616221621_figo -p u616221621_taroti < ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/db/migrations/v2.3.11_fix_lecturas_table.sql
```

### 4. Configurar .env

Asegúrate que `~/domains/dimgrey-louse-600796.hostingersite.com/nodejs/.env` tenga:

```env
DB_SOCKET=/var/lib/mysql/mysql.sock
```

### 5. Instalar Dependencias y Reiniciar

```bash
cd ~/domains/dimgrey-louse-600796.hostingersite.com/nodejs
export PATH=/opt/alt/alt-nodejs22/root/bin:$PATH
npm install --production
mkdir -p tmp
touch tmp/restart.txt
```

### 6. Verificar

```bash
# Ver logs
tail -50 console.log

# Debería ver:
# ✓ Taroti Server running on http://0.0.0.0:3000
# [DB] Pool MariaDB creado: { socketPath: '/var/lib/mysql/mysql.sock', ... }
```

---

## 🚀 Estado del Deployment

| Componente | Estado | Notas |
|------------|--------|-------|
| **Sitio Web** | ✅ HTTP 200 | https://dimgrey-louse-600796.hostingersite.com |
| **Base de Datos** | ✅ Conectada | Unix socket `/var/lib/mysql/mysql.sock` |
| **API Planes** | ✅ Funcionando | Precios: 1000, 2000, 3000 CLP |
| **API Sesiones** | ✅ Funcionando | Crea sesión correctamente |
| **Mercado Pago** | ✅ Funcionando | Genera `init_point` correctamente |
| **OpenAI** | ✅ Configurado | API key válida |
| **Passenger** | ✅ Corriendo | Node.js v22.18.0 |

---

## 📚 Documentación Relacionada

- **Deploy Completo:** `docs/DEPLOY-HOSTINGER.md`
- **Quick Start:** `DEPLOY-QUICK-START.md`
- **Migración Anterior:** `CHANGELOG-v2.3.9-hostinger.md`

---

## 🔜 Próximos Pasos

- [ ] Configurar dominio personalizado `taroti.fun`
- [ ] Configurar SSL/HTTPS para dominio personalizado
- [ ] Probar flujo completo end-to-end con pago real
- [ ] Configurar monitoreo de uptime
- [ ] Implementar logging estructurado

---

**Versión:** 2.3.11
**Deploy Status:** ✅ Production Ready
**URL:** https://dimgrey-louse-600796.hostingersite.com
