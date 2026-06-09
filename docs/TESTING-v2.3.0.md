# GUÍA DE TESTING - TAROTI LATAM v2.3.0

**Versión:** 2.3.0
**Objetivo:** Verificar que el refactor MariaDB resuelve el bug del botón gris

---

## 📋 PRE-REQUISITOS

```bash
# 1. MariaDB instalado y corriendo
mysql --version
# Debe mostrar: mysql Ver 15.1 o superior

# 2. Node.js y npm
node --version  # v18+
npm --version   # v9+

# 3. Variables de entorno configuradas
cat .env | grep DB_
# Debe mostrar: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
```

---

## 🚀 SETUP RÁPIDO

### Opción A: Script Automático (Recomendado)

```bash
cd "/Users/dr.herrera/Figotilabs/taroti LATAM"
bash db/setup-local.sh
```

**Qué hace el script:**
- ✅ Crea BD `taroti_latam`
- ✅ Crea usuario `taroti_user`
- ✅ Importa schema (4 tablas)
- ✅ Crea `.env` con configuración local
- ✅ Verifica instalación

### Opción B: Setup Manual

```bash
# 1. Crear BD
mysql -u root -p

CREATE DATABASE taroti_latam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'taroti_user'@'localhost' IDENTIFIED BY 'taroti_dev_2024';
GRANT ALL PRIVILEGES ON taroti_latam.* TO 'taroti_user'@'localhost';
FLUSH PRIVILEGES;
exit;

# 2. Importar schema
mysql -u taroti_user -ptaroti_dev_2024 taroti_latam < db/schema-latam.sql

# 3. Verificar
mysql -u taroti_user -ptaroti_dev_2024 taroti_latam -e "SHOW TABLES;"
```

---

## 🧪 TESTS UNITARIOS

### Test 1: Conexión a Base de Datos

```bash
# Iniciar servidor dev
npm run dev
```

En otra terminal:

```bash
# Test básico de verificación (debe retornar pagado: false)
curl -s http://localhost:5173/api/pagos/verificar/test-sesion-no-existe | jq .
```

**Output esperado:**
```json
{
  "pagado": false
}
```

✅ **PASS** si retorna JSON con `pagado: false`
❌ **FAIL** si retorna error 500 o timeout

### Test 2: Insertar Pago en BD (Manual)

```bash
mysql -u taroti_user -ptaroti_dev_2024 taroti_latam
```

```sql
-- Insertar pago aprobado
INSERT INTO pagos (sesion_id, payment_id_mp, estado_mp, estado_detalle_mp, plan_nombre, monto_clp, fecha_pago)
VALUES ('test-sesion-123', 'MP-123456789', 'approved', 'accredited', 'Lectura 3 Cartas', 1000.00, NOW());

-- Verificar
SELECT * FROM pagos WHERE sesion_id = 'test-sesion-123';
```

### Test 3: Verificar Pago Insertado

```bash
curl -s http://localhost:5173/api/pagos/verificar/test-sesion-123 | jq .
```

**Output esperado:**
```json
{
  "pagado": true,
  "payment_id": "MP-123456789",
  "fecha_pago": "2026-05-25T..."
}
```

✅ **PASS** si retorna `pagado: true` con payment_id
❌ **FAIL** si retorna `pagado: false`

### Test 4: Webhook Simulation (Avanzado)

```bash
# Crear payload de webhook simulado
cat > /tmp/webhook-test.json << 'EOF'
{
  "type": "payment",
  "action": "payment.updated",
  "data": {
    "id": "987654321"
  }
}
EOF

# Simular webhook (requiere signature válido - skip en local)
# En producción, usar herramienta de testing de Mercado Pago
```

---

## 🔬 TESTS DE INTEGRACIÓN

### Escenario 1: Flujo Completo de Pago

**Preparación:**
```bash
# Limpiar BD
mysql -u taroti_user -ptaroti_dev_2024 taroti_latam -e "TRUNCATE TABLE pagos;"
mysql -u taroti_user -ptaroti_dev_2024 taroti_latam -e "TRUNCATE TABLE webhook_events_mp;"
```

**Pasos:**

1. **Frontend: Iniciar compra**
   - Abrir: http://localhost:5173
   - Elegir plan: "Lectura 3 Cartas"
   - Ingresar pregunta y seleccionar cartas
   - Click en "Pagar con Mercado Pago"

2. **Backend: Crear preferencia**
   - API: POST /api/pagos/preference
   - Body: `{ sesion_id: "test-UUID", plan_nombre: "3 Cartas", precio: 1000 }`
   - Verificar: Retorna `preference_id` e `init_point`

3. **Mercado Pago: Simular pago**
   - Usar sandbox: https://www.mercadopago.cl/developers/panel/testing
   - Tarjeta test: VISA 4509 9535 6623 3704
   - CVV: 123, Vencimiento: 11/25

4. **Webhook: Recibir notificación**
   - MP envía POST a /api/pagos/webhook
   - Verificar log del servidor:
     ```
     [WEBHOOK] Recibido: { signature: 'presente', requestId: 'xxx' }
     [WEBHOOK] Firma verificada correctamente
     [WEBHOOK] Pago recibido: 987654321
     [WEBHOOK] Estado del pago: { status: 'approved', status_detail: 'accredited' }
     [WEBHOOK] Pago confirmado y guardado en BD para sesión: test-UUID
     ```

5. **Frontend: Verificar pago**
   - API: GET /api/pagos/verificar/test-UUID
   - Verificar retorna: `{ pagado: true, payment_id: "..." }`

6. **Verificar en BD:**
   ```bash
   mysql -u taroti_user -ptaroti_dev_2024 taroti_latam -e "SELECT * FROM pagos WHERE sesion_id = 'test-UUID';"
   mysql -u taroti_user -ptaroti_dev_2024 taroti_latam -e "SELECT * FROM webhook_events_mp WHERE payment_id LIKE '%987654321%';"
   ```

✅ **PASS** si:
- Pago aparece en tabla `pagos` con estado `approved`
- Webhook aparece en tabla `webhook_events_mp`
- Verificar retorna `pagado: true`

❌ **FAIL** si:
- Botón de pago queda gris
- verificar retorna `pagado: false` después del webhook
- No hay registro en BD

---

## 📊 TESTS DE PERFORMANCE

### Benchmark: Consultas de Verificación

```bash
# Instalar apache bench si no está disponible
# macOS: viene con sistema
# Ubuntu: sudo apt-get install apache2-utils

# Test: 100 requests, 10 concurrentes
ab -n 100 -c 10 http://localhost:5173/api/pagos/verificar/test-sesion-123

# Buscar en output:
# Requests per second: XXX [#/sec] (mean)
# Time per request: XXX [ms] (mean, across all concurrent requests)
```

**Esperado:**
- Requests per second: > 100 req/sec
- Time per request: < 10 ms

**Driver MariaDB benchmark (según docs):**
- 5,650 ops/seg

### Benchmark: Pool de Conexiones

```bash
# Verificar pool configurado
grep -A 5 "createPool" src/lib/db.js

# Debe mostrar:
# connectionLimit: 10
# connectTimeout: 5000
```

---

## 🐛 DEBUGGING COMÚN

### Error: "Faltan variables de entorno: DB_USER, DB_PASSWORD, DB_NAME"

**Causa:** `.env` no está cargado

**Solución:**
```bash
# Verificar que .env existe
cat .env | grep DB_

# Si no existe, crear:
cp .env.example .env
nano .env
```

### Error: "Access denied for user 'taroti_user'@'localhost'"

**Causa:** Credenciales incorrectas o usuario no existe

**Solución:**
```bash
mysql -u root -p

GRANT ALL PRIVILEGES ON taroti_latam.* TO 'taroti_user'@'localhost';
FLUSH PRIVILEGES;

# O cambiar password
ALTER USER 'taroti_user'@'localhost' IDENTIFIED BY 'nueva_password';
FLUSH PRIVILEGES;
```

### Error: "Cannot find module '$lib/db.js'"

**Causa:** Path alias no resuelto o archivo no existe

**Solución:**
```bash
# Verificar archivo existe
ls -la src/lib/db.js

# Verificar svelte.config.js tiene alias correcto
grep -A 3 "alias" svelte.config.js

# Limpiar .svelte-kit
rm -rf .svelte-kit
npm run dev
```

### Error: "Table 'taroti_latam.pagos' doesn't exist"

**Causa:** Schema no importado

**Solución:**
```bash
mysql -u taroti_user -ptaroti_dev_2024 taroti_latam < db/schema-latam.sql

# Verificar tablas
mysql -u taroti_user -ptaroti_dev_2024 taroti_latam -e "SHOW TABLES;"
```

---

## ✅ CHECKLIST DE VALIDACIÓN

Antes de hacer deploy a producción, verificar:

- [ ] MariaDB corriendo en servidor
- [ ] BD `taroti_latam` creada con charset utf8mb4
- [ ] 4 tablas creadas: pagos, lecturas, webhook_events_mp, audit_log
- [ ] Usuario con permisos correctos
- [ ] `.env` con credenciales de producción (NO de desarrollo)
- [ ] `npm install` ejecutado (mariadb@3.5.2 instalado)
- [ ] `npm run build` exitoso (sin errores TypeScript)
- [ ] Test local de verificación pasa
- [ ] Test de inserción manual en BD pasa
- [ ] Webhook URL configurado en dashboard Mercado Pago
- [ ] MERCADOPAGO_WEBHOOK_SECRET en .env es el correcto
- [ ] Logs del servidor muestran "[DB] Pool MariaDB creado"
- [ ] No hay errores en build/logs de producción

---

## 📝 REPORTAR BUGS

Si encuentras un bug durante testing:

```bash
# 1. Capturar logs del servidor
npm run dev 2>&1 | tee server.log

# 2. Capturar estado de BD
mysql -u taroti_user -ptaroti_dev_2024 taroti_latam -e "
  SELECT * FROM pagos ORDER BY fecha_creacion DESC LIMIT 5;
  SELECT * FROM webhook_events_mp ORDER BY fecha_recepcion DESC LIMIT 5;
" > db-state.txt

# 3. Capturar request/response
curl -v http://localhost:5173/api/pagos/verificar/test-123 > curl-output.txt 2>&1

# 4. Incluir en reporte:
# - server.log
# - db-state.txt
# - curl-output.txt
# - Descripción del problema
# - Pasos para reproducir
```

---

**Última actualización:** 2026-05-25
**Versión documento:** 1.0
