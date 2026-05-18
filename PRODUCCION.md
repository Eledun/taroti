# 🚀 Deploy a Producción - Resumen Rápido

## 📦 Archivos Creados para Producción

```
taroti/
├── DEPLOY_HOSTINGER.md          # Guía completa paso a paso
├── backend/
│   ├── .env.example              # Variables de entorno (actualizado)
│   ├── .htaccess                 # Config Apache para Node.js
│   ├── deploy-production.sh     # Script de build backend
│   └── package.json              # Scripts de producción añadidos
└── frontend/
    ├── .env.example              # Variables de entorno frontend
    ├── .htaccess                 # Config Apache para SPA
    └── deploy-production.sh     # Script de build frontend
```

---

## ⚡ Quick Start - Hostinger Deploy

### 1. Preparación Local (5 min)

```bash
# Backend
cd backend
cp .env.example .env
# Edita .env con credenciales de producción
./deploy-production.sh

# Frontend
cd ../frontend
cp .env.example .env
# Edita .env con URL de API de producción
./deploy-production.sh
```

### 2. Hostinger Setup (10 min)

1. **MySQL**: Crear BD en hPanel
2. **Subdominios**: Crear `api.tudominio.com`
3. **Node.js**: Configurar app en hPanel
4. **FTP**: Subir archivos según estructura

### 3. Configuración Final (5 min)

```bash
# SSH en Hostinger
cd /home/u123456789/domains/api.tudominio.com/nodejs/taroti-backend

# Migrar BD
npx prisma migrate deploy
npx prisma db seed

# Iniciar app
pm2 restart all
```

### 4. Mercado Pago (3 min)

1. Cambiar a credenciales de PRODUCCIÓN
2. Configurar webhook: `https://api.tudominio.com/api/pagos/webhook`
3. Actualizar `.env` con nuevas credenciales

---

## 📝 Variables de Entorno Críticas

### Backend (.env)

```env
NODE_ENV=production
DATABASE_URL="mysql://u123_taroti:pass@localhost:3306/u123_taroti?charset=utf8mb4"
JWT_SECRET="<generar con: openssl rand -base64 32>"
ADMIN_JWT_SECRET="<otro secret diferente>"
ADMIN_PASSWORD_HASH="<generar con bcrypt>"
MERCADOPAGO_ACCESS_TOKEN="APP_USR-<producción>"
MERCADOPAGO_PUBLIC_KEY="APP_USR-<producción>"
MERCADOPAGO_WEBHOOK_SECRET="<secret>"
OPENAI_API_KEY="sk-proj-<tu-key>"
FRONTEND_URL="https://tudominio.com"
BACKEND_URL="https://api.tudominio.com/api"
```

### Frontend (.env)

```env
PUBLIC_API_URL=https://api.tudominio.com/api
PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-<producción>
```

---

## 🏗️ Estructura en Hostinger

```
/home/u123456789/
├── domains/
│   ├── tudominio.com/
│   │   └── public_html/              # Frontend build/
│   │       ├── index.html
│   │       ├── _app/
│   │       └── .htaccess
│   └── api.tudominio.com/
│       ├── public_html/
│       │   └── .htaccess             # Proxy a Node.js
│       └── nodejs/
│           └── taroti-backend/        # Backend
│               ├── dist/              # Compilado
│               ├── node_modules/
│               ├── prisma/
│               └── .env
```

---

## ✅ Checklist Pre-Deploy

- [ ] Credenciales de Mercado Pago en **PRODUCCIÓN**
- [ ] API Key de OpenAI activa
- [ ] `JWT_SECRET` y `ADMIN_JWT_SECRET` únicos y seguros
- [ ] `ADMIN_PASSWORD_HASH` generado con bcrypt
- [ ] `DATABASE_URL` con credenciales reales de Hostinger
- [ ] `FRONTEND_URL` y `BACKEND_URL` apuntan a dominio real
- [ ] `.env` NO incluido en repositorio git
- [ ] SSL activado en ambos dominios
- [ ] Webhook de MP configurado correctamente

---

## 🔧 Comandos Útiles en Producción

```bash
# Ver logs de Node.js
pm2 logs taroti-backend --lines 50

# Reiniciar aplicación
pm2 restart taroti-backend

# Ver estado
pm2 status

# Aplicar nueva migración
npx prisma migrate deploy

# Ver Prisma Studio (dev)
npx prisma studio
```

---

## 📊 Costos Estimados

| Servicio | Costo Mensual | Notas |
|----------|---------------|-------|
| **Hostinger Business** | ~$4-8 USD | Incluye MySQL, Node.js, SSL |
| **Dominio** | ~$1 USD | Primer año gratis con Hostinger |
| **OpenAI** | ~$5-20 USD | Depende del uso (gpt-4o-mini) |
| **Mercado Pago** | 0% + comisión MP | Sin costo fijo, solo % por transacción |
| **TOTAL** | **~$10-30 USD/mes** | Escalable según uso |

---

## 🆘 Troubleshooting Rápido

### Backend no inicia

```bash
# Verificar logs
pm2 logs

# Verificar puerto
lsof -i :4000

# Reiniciar
pm2 delete all
pm2 start dist/index.js --name taroti-backend
```

### Frontend en blanco

1. Verifica `.htaccess` en `public_html/`
2. Verifica `PUBLIC_API_URL` en `.env`
3. Abre DevTools → Console para ver errores

### Base de datos no conecta

```bash
# Probar conexión
mysql -u u123_taroti -p -h localhost u123_taroti

# Verificar DATABASE_URL
cat .env | grep DATABASE_URL
```

---

## 📖 Documentación Completa

Para la guía paso a paso completa, ver: **[DEPLOY_HOSTINGER.md](./DEPLOY_HOSTINGER.md)**

---

## 🎯 Próximos Pasos Post-Deploy

1. **Configurar monitoreo** (Sentry, LogRocket)
2. **Configurar analytics** (Google Analytics, Plausible)
3. **Configurar emails** (SendGrid, Resend)
4. **Backups automáticos** (hPanel → Backups)
5. **CDN** (Cloudflare activado por defecto)
6. **Optimización SEO** (meta tags, sitemap)

---

🔮 **¡Tu aplicación Taroti está lista para producción!**
