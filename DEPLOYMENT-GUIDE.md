# 🚀 Guía Completa de Deployment - Taroti LATAM v2.3.10

Guía paso a paso para deployar Taroti LATAM a producción (Hostinger/cPanel o cualquier servidor Node.js).

---

## 📋 Pre-requisitos

### Servicios Externos Necesarios

- ✅ Cuenta Mercado Pago (credenciales de PRODUCCIÓN)
- ✅ API Key de OpenAI (con créditos disponibles)
- ✅ Servidor con Node.js 18+ y MySQL/MariaDB 10.5+
- ✅ Dominio apuntando al servidor (ej: taroti.mx)

### Credenciales a Preparar

Antes de comenzar, ten estas credenciales listas:

1. **Mercado Pago (PRODUCCIÓN)**
   - Access Token: `APP-XXXXXXXXXXXXXXX`
   - Public Key: `APP-XXXXXXXXXXXXXXX`
   - Obtener en: https://www.mercadopago.com.mx/developers/panel/app

2. **OpenAI**
   - API Key: `sk-proj-XXXXXXXXXXXXXXX`
   - Obtener en: https://platform.openai.com/api-keys
   - **IMPORTANTE**: Rotar el API key viejo si fue expuesto

3. **MySQL**
   - Usuario: `taroti_prod` (a crear)
   - Password: `TU_PASSWORD_SEGURO_AQUI` (16+ caracteres)
   - Database: `taroti_latam`

---

## 🗄️ PASO 1: Configurar Base de Datos

### Opción A: Via phpMyAdmin (Hostinger/cPanel)

1. **Acceder a phpMyAdmin**
   - Panel de Hostinger → Bases de datos → phpMyAdmin
   - Login con credenciales de MySQL

2. **Crear Base de Datos**
   ```sql
   CREATE DATABASE taroti_latam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Crear Usuario con Permisos Limitados**
   ```sql
   CREATE USER 'taroti_prod'@'localhost' IDENTIFIED BY 'TU_PASSWORD_SEGURO';
   GRANT SELECT, INSERT, UPDATE ON taroti_latam.* TO 'taroti_prod'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Ejecutar Schema**
   - Ir a phpMyAdmin → Base de datos `taroti_latam`
   - Click en pestaña "SQL"
   - Copiar COMPLETO el archivo `db/schema-production-v2.3.10.sql`
   - Pegar y ejecutar

5. **Verificar Instalación**
   ```sql
   SHOW TABLES;
   -- Debe mostrar: pagos, lecturas, sesiones, webhook_events_mp, audit_log

   DESCRIBE pagos;
   -- Debe mostrar todas las columnas incluyendo preference_id, email_usuario, etc.
   ```

### Opción B: Via Terminal/SSH

```bash
# 1. Conectarse al servidor
ssh usuario@tu-servidor.com

# 2. Conectarse a MySQL
mysql -u root -p

# 3. Ejecutar comandos SQL
CREATE DATABASE taroti_latam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'taroti_prod'@'localhost' IDENTIFIED BY 'TU_PASSWORD_SEGURO';
GRANT SELECT, INSERT, UPDATE ON taroti_latam.* TO 'taroti_prod'@'localhost';
FLUSH PRIVILEGES;
exit;

# 4. Ejecutar schema
mysql -u taroti_prod -p taroti_latam < db/schema-production-v2.3.10.sql

# 5. Verificar
mysql -u taroti_prod -p taroti_latam -e "SHOW TABLES;"
```

---

## ⚙️ PASO 2: Configurar Variables de Entorno

### 1. Crear archivo `.env` en el servidor

**IMPORTANTE**: NUNCA commitear este archivo a git

```bash
# En el servidor, en la raíz del proyecto:
nano .env
```

### 2. Contenido del `.env` (Producción)

```env
# ============================================================================
# TAROTI LATAM - PRODUCTION ENVIRONMENT
# ============================================================================

# --- Node.js ---
NODE_ENV=production
PORT=3000

# --- Frontend URL ---
ORIGIN=https://taroti.mx
FRONTEND_URL=https://taroti.mx

# --- MySQL Database ---
MYSQL_HOST=localhost
MYSQL_USER=taroti_prod
MYSQL_PASSWORD=TU_PASSWORD_SEGURO_AQUI
MYSQL_DATABASE=taroti_latam
MYSQL_PORT=3306

# --- Mercado Pago PRODUCCIÓN ---
MP_ACCESS_TOKEN=APP-XXXXXXXXXXXXXXX
MP_PUBLIC_KEY=APP-XXXXXXXXXXXXXXX

# --- OpenAI ---
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXX

# --- Seguridad ---
# Generar con: openssl rand -base64 32
SESSION_SECRET=tu_session_secret_aqui_32_caracteres_minimo

# --- Logging ---
LOG_LEVEL=info
```

### 3. Proteger archivo .env

```bash
chmod 600 .env
chown www-data:www-data .env  # o el usuario de tu servidor web
```

---

## 📦 PASO 3: Build de Producción

### 1. Instalar Dependencias

```bash
cd /path/to/taroti-latam
npm ci --production
```

`npm ci` es más rápido y seguro que `npm install` para producción.

### 2. Build del Proyecto SvelteKit

```bash
npm run build
```

Esto genera la carpeta `/build` con la aplicación optimizada.

### 3. Verificar Build

```bash
ls -lah build/
# Debe mostrar: client/, server/, index.js, prerendered/, etc.
```

---

## 🌐 PASO 4: Configurar Servidor Web

### Opción A: Node.js con PM2 (Recomendado)

PM2 mantiene la aplicación corriendo 24/7, con auto-restart en caso de crashes.

#### 1. Instalar PM2

```bash
npm install -g pm2
```

#### 2. Crear archivo `ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'taroti-latam',
    script: 'build/index.js',
    instances: 2,  // 2 instancias para load balancing
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    time: true,
    autorestart: true,
    max_memory_restart: '500M'
  }]
};
```

#### 3. Iniciar con PM2

```bash
# Crear carpeta de logs
mkdir -p logs

# Iniciar aplicación
pm2 start ecosystem.config.js

# Verificar que esté corriendo
pm2 status

# Ver logs en tiempo real
pm2 logs taroti-latam

# Configurar PM2 para auto-start al reiniciar servidor
pm2 startup
pm2 save
```

### Opción B: Nginx como Reverse Proxy (Recomendado para producción)

Si usas Nginx, configura reverse proxy hacia el puerto 3000:

```nginx
# /etc/nginx/sites-available/taroti.mx

server {
    listen 80;
    listen [::]:80;
    server_name taroti.mx www.taroti.mx;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name taroti.mx www.taroti.mx;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/taroti.mx/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/taroti.mx/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|webp)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Activar configuración:**

```bash
sudo ln -s /etc/nginx/sites-available/taroti.mx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 PASO 5: Configurar SSL (HTTPS)

### Usando Certbot (Let's Encrypt - Gratis)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d taroti.mx -d www.taroti.mx

# Auto-renovación (ya configurada por defecto)
sudo certbot renew --dry-run
```

---

## 🎯 PASO 6: Configurar Mercado Pago Webhooks

### 1. Ir al Panel de Mercado Pago

https://www.mercadopago.com.mx/developers/panel/app

### 2. Configurar Notification URL

- Ir a tu aplicación → Webhooks
- Agregar URL: `https://taroti.mx/api/pagos/webhook`
- Eventos: Marcar "Payments"
- Guardar

### 3. Verificar Firma HMAC

El código ya valida la firma automáticamente en `src/routes/api/pagos/webhook/+server.ts`

---

## ✅ PASO 7: Testing Post-Deployment

### 1. Healthcheck Básico

```bash
curl https://taroti.mx/
# Debe retornar HTML de la página principal
```

### 2. Test de Base de Datos

```bash
# En el servidor
mysql -u taroti_prod -p taroti_latam -e "SELECT COUNT(*) FROM pagos;"
# Debe retornar 0 (o el número de pagos existentes)
```

### 3. Test de Pago Completo (END-TO-END)

1. Ir a https://taroti.mx/
2. Seleccionar un plan (ej: "Tres Cartas")
3. Hacer una pregunta
4. Seleccionar cartas
5. Proceder al pago
6. Usar tarjeta de TEST de Mercado Pago:
   - Tarjeta: `5031 7557 3453 0604`
   - Vencimiento: cualquier fecha futura
   - CVV: cualquier 3 dígitos
   - Nombre: TEST USER
7. Completar pago
8. Verificar que redirija a `/lectura/[sesion_id]`
9. Verificar que se genere la lectura con OpenAI

### 4. Verificar Logs

```bash
# PM2 logs
pm2 logs taroti-latam --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log
```

---

## 🔄 PASO 8: Configurar Backups

### Backup Automático de MySQL

Crear script `backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/taroti"
mkdir -p $BACKUP_DIR

mysqldump -u taroti_prod -p'TU_PASSWORD' taroti_latam > $BACKUP_DIR/taroti_$DATE.sql
gzip $BACKUP_DIR/taroti_$DATE.sql

# Mantener solo últimos 30 días
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completado: taroti_$DATE.sql.gz"
```

**Configurar cron job (diario a las 2 AM):**

```bash
crontab -e

# Agregar:
0 2 * * * /path/to/backup-db.sh
```

---

## 📊 PASO 9: Monitoreo y Logs

### Configurar PM2 Plus (Opcional - Monitoreo en Tiempo Real)

```bash
pm2 link [secret_key] [public_key]  # Obtener keys en https://app.pm2.io
```

### Logs Centralizados

Revisar logs regularmente:

```bash
# Ver todos los logs de PM2
pm2 logs

# Ver logs con filtro
pm2 logs --err  # Solo errores
pm2 logs --lines 500  # Últimas 500 líneas

# Guardar logs a archivo
pm2 flush  # Limpiar logs anteriores
```

---

## 🚨 Troubleshooting Común

### Error: "Cannot connect to MySQL"

**Solución:**
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en .env
cat .env | grep MYSQL

# Test de conexión directa
mysql -h localhost -u taroti_prod -p
```

### Error: "Port 3000 already in use"

**Solución:**
```bash
# Ver qué proceso usa el puerto
lsof -i :3000

# Matar proceso anterior
pm2 delete taroti-latam
pm2 start ecosystem.config.js
```

### Webhook de Mercado Pago no llega

**Solución:**
```bash
# Verificar en panel de MP: https://www.mercadopago.com.mx/developers/panel/webhooks
# Ver si hay errores registrados

# Test manual:
curl -X POST https://taroti.mx/api/pagos/webhook \
  -H "Content-Type: application/json" \
  -d '{"data":{"id":"TEST123"}}'
```

### Lectura de IA no se genera

**Checklist:**
- ✅ Verificar que OpenAI API Key sea válida
- ✅ Verificar que haya créditos en cuenta de OpenAI
- ✅ Ver logs de PM2: `pm2 logs | grep OpenAI`
- ✅ Verificar que registro exista en tabla `lecturas`

---

## 📝 Checklist Final de Deployment

### Base de Datos
- [ ] Base de datos `taroti_latam` creada
- [ ] Usuario `taroti_prod` creado con permisos correctos
- [ ] Schema v2.3.10 ejecutado exitosamente
- [ ] 5 tablas creadas (pagos, lecturas, sesiones, webhook_events_mp, audit_log)
- [ ] Backups automáticos configurados

### Aplicación
- [ ] `.env` creado con TODAS las variables necesarias
- [ ] Build de producción generado (`npm run build`)
- [ ] PM2 instalado y aplicación corriendo
- [ ] PM2 configurado para auto-start

### Servidor Web
- [ ] Nginx instalado y configurado
- [ ] Reverse proxy configurado hacia puerto 3000
- [ ] SSL/HTTPS configurado con Let's Encrypt
- [ ] Certificado auto-renovable

### Servicios Externos
- [ ] Credenciales de Mercado Pago PRODUCCIÓN configuradas
- [ ] Webhook URL configurada en panel de MP
- [ ] API Key de OpenAI configurada (nueva, no la expuesta)
- [ ] Créditos disponibles en OpenAI

### Seguridad
- [ ] `.env` NO commiteado a git
- [ ] Permisos de archivos correctos (`.env` con 600)
- [ ] Usuario MySQL sin permisos DELETE/DROP
- [ ] Firewall configurado (solo puertos 80, 443, 22)
- [ ] SSH con autenticación por llave (desactivar password login)

### Testing
- [ ] Healthcheck básico funciona
- [ ] Flujo completo end-to-end testeado
- [ ] Pago de prueba completado exitosamente
- [ ] Lectura de IA generada correctamente
- [ ] Webhook de MP recibido y procesado

### Monitoreo
- [ ] Logs de PM2 accesibles
- [ ] Logs de Nginx configurados
- [ ] Monitoreo de uptime configurado (opcional: UptimeRobot)
- [ ] Alertas configuradas en caso de downtime

---

## 🎉 Deployment Completado

Si todos los checkboxes están marcados, tu aplicación está lista para producción!

**URLs importantes:**
- Frontend: https://taroti.mx/
- Webhook: https://taroti.mx/api/pagos/webhook
- Panel MP: https://www.mercadopago.com.mx/developers/panel/app
- PM2 Dashboard: `pm2 monit`

**Próximos pasos:**
1. Cambiar credenciales de TEST a PRODUCCIÓN en Mercado Pago
2. Configurar dominio personalizado
3. Configurar Google Analytics (opcional)
4. Configurar Facebook Pixel (opcional)

---

## 📞 Soporte

Si encuentras problemas durante el deployment:

1. Revisar logs: `pm2 logs taroti-latam --lines 200`
2. Verificar documentación de SvelteKit: https://kit.svelte.dev/docs/adapter-node
3. Verificar documentación de Mercado Pago: https://www.mercadopago.com.mx/developers/es/docs
