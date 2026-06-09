# 🔮 Taroti LATAM

Plataforma de lecturas de tarot personalizadas con IA para mercado LATAM.

**Versión:** 2.3.12
**Stack:** SvelteKit + MariaDB + Mercado Pago + OpenAI
**Deploy:** Hostinger (SSH con expect)

---

## 🎯 Características

- **3 tipos de tirada:** Tres Cartas (1000 CLP), Cruz Celta (3000 CLP), Año (5000 CLP)
- **IA personalizada:** Interpretaciones con OpenAI GPT-4o-mini
- **Pagos seguros:** Mercado Pago Checkout Pro
- **Persistencia:** MariaDB (v2.3.0+)
- **Auditoría completa:** Webhooks + logs de pagos

---

## 🔧 Stack Técnico

```
SvelteKit 2.50.2 (SSR + Node.js)
├── Database: MariaDB (driver oficial v3.5.2)
│   ├── Performance: 5,650 ops/seg
│   └── Pool: 10 conexiones
├── Pagos: Mercado Pago API REST
│   ├── Checkout Pro (iframe)
│   └── Webhook HMAC-SHA256
├── IA: OpenAI GPT-4o-mini
└── Deploy: Hostinger Business (Node.js)
```

---

## 🚀 Setup Rápido

### Requisitos

- Node.js 18+
- MariaDB 10.5+
- npm 9+

### Instalación

```bash
# 1. Setup base de datos
bash db/setup-local.sh

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # Completar credenciales

# 3. Instalar dependencias
npm install

# 4. Ejecutar desarrollo
npm run dev

# 5. Verificar
curl http://localhost:5173/api/pagos/verificar/test-123
```

### Deploy a Producción (Hostinger)

```bash
# 1. Build local
npm run build

# 2. Deploy automático (método default)
./deploy-with-password.sh
```

**📖 Documentación completa:** [docs/SSH-DEPLOY-METHOD.md](./docs/SSH-DEPLOY-METHOD.md)

---

## 📁 Estructura

```
taroti-latam/
├── src/
│   ├── lib/
│   │   ├── db.js                    # Pool MariaDB
│   │   ├── components/              # UI Svelte
│   │   └── data/
│   │       ├── arcanos-mayores.ts
│   │       └── planes.ts
│   └── routes/
│       ├── api/
│       │   └── pagos/
│       │       ├── preference/+server.ts    # Crear pago MP
│       │       ├── webhook/+server.ts       # Notificaciones MP
│       │       └── verificar/[id]/+server.ts # Verificar pago
│       ├── lectura/[sesion_id]/+page.svelte
│       └── +page.svelte
├── db/
│   ├── schema-latam.sql             # 4 tablas
│   └── setup-local.sh               # Setup automático
├── CHANGELOG.md                     # Historial cambios
├── TESTING-v2.3.0.md               # Guía testing
└── README.md                        # Este archivo
```

---

## 💾 Base de Datos

### Schema

**4 tablas principales:**
1. `pagos` - Transacciones Mercado Pago
2. `lecturas` - Lecturas generadas (IA)
3. `webhook_events_mp` - Auditoría webhooks
4. `audit_log` - Log general del sistema

### Queries Útiles

```bash
# Ver últimos pagos
mysql -u taroti_user -p taroti_latam -e "
  SELECT sesion_id, estado_mp, fecha_pago
  FROM pagos ORDER BY fecha_creacion DESC LIMIT 10;"

# Pagos aprobados hoy
mysql -u taroti_user -p taroti_latam -e "
  SELECT COUNT(*) as total FROM pagos
  WHERE estado_mp='approved' AND DATE(fecha_pago)=CURDATE();"
```

---

## 🔐 Variables de Entorno

```bash
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx
MERCADOPAGO_WEBHOOK_SECRET=xxx

# OpenAI
OPENAI_API_KEY=sk-proj-xxx

# MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_USER=taroti_user
DB_PASSWORD=xxx
DB_NAME=taroti_latam

# URLs
FRONTEND_URL=http://taroti.fun
PORT=3000
HOST=0.0.0.0
```

---

## 🧪 Testing

Ver guía completa: [TESTING-v2.3.0.md](TESTING-v2.3.0.md)

**Test básico:**
```bash
npm run dev
curl http://localhost:5173/api/pagos/verificar/test-123 | jq .
# Debe retornar: {"pagado":false}
```

---

## 📦 Deploy

```bash
# Build
npm run build

# Crear ZIP
cd build && zip -r ../taroti-v2.3.0-LATAM.zip .

# Deploy Hostinger:
# 1. Crear BD en phpMyAdmin (utf8mb4)
# 2. Importar: db/schema-latam.sql
# 3. Upload ZIP → Entry point: start-server.js
# 4. Configurar variables entorno
# 5. Configurar webhook MP: https://taroti.fun/api/pagos/webhook
# 6. Restart app
```

---

## 📖 Documentación

- **[CHANGELOG.md](CHANGELOG.md)** - Historial de cambios y comandos CLI
- **[TESTING-v2.3.0.md](TESTING-v2.3.0.md)** - Guía completa de testing
- **db/schema-latam.sql** - Schema de base de datos
- **db/setup-local.sh** - Script de setup automático

---

## 🔄 Flujo de Pago

```
1. Usuario elige plan → Selecciona cartas → Ingresa pregunta
2. Frontend crea sesión → POST /api/pagos/preference
3. Backend crea preferencia MP → Retorna preference_id
4. Usuario completa pago en MP
5. MP envía webhook → POST /api/pagos/webhook
6. Backend guarda en MariaDB → Tabla: pagos
7. Frontend verifica pago → GET /api/pagos/verificar/[sesion_id]
8. Backend consulta BD → Retorna {pagado: true}
9. Frontend genera lectura → OpenAI GPT-4o-mini
10. Usuario ve lectura personalizada
```

---

## 🐛 Troubleshooting

### Error: "Faltan variables de entorno: DB_USER"
```bash
# Verificar .env
cat .env | grep DB_

# Si no existe, copiar ejemplo
cp .env.example .env
nano .env
```

### Error: "Access denied for user 'taroti_user'"
```bash
mysql -u root -p
GRANT ALL PRIVILEGES ON taroti_latam.* TO 'taroti_user'@'localhost';
FLUSH PRIVILEGES;
```

### Error: "Table 'pagos' doesn't exist"
```bash
mysql -u taroti_user -p taroti_latam < db/schema-latam.sql
```

---

## 📝 Historial Versiones

- **v2.3.0** (2026-05-25): Refactor MariaDB - Persistencia permanente
- **v2.2.9** (2026-05-24): Removido auto_return (página en blanco)
- **v2.2.8** (2026-05-24): .htaccess + proxy Node.js (404 fix)
- **v2.2.7** (2026-05-24): CSP configurado para MP
- **v2.2.5** (2026-05-24): MVP base para fork LATAM

Ver detalles: [CHANGELOG.md](CHANGELOG.md)

---

## 🎯 Roadmap

- [ ] Testing local completo
- [ ] Testing sandbox Mercado Pago
- [ ] Deploy producción Hostinger
- [ ] Monitoreo 24h
- [ ] Backup automático BD

---

**Proyecto:** Taroti LATAM v2.3.0
**Responsable:** Dr. Eduardo Herrera
**Ubicación:** La Ligua, Valparaíso, Chile
**Mercados:** Chile, Argentina, Colombia, Perú, México
