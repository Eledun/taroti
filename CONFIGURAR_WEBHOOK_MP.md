# 🔔 Configurar Webhook de Mercado Pago - PRODUCCIÓN

## 📝 Información del Webhook

### URL del Webhook (Para Testing Local con ngrok)

```
https://overboastfully-pernicious-nasir.ngrok-free.dev/api/pagos/webhook
```

### URL del Webhook (Para Producción Final)

```
https://api.tudominio.com/api/pagos/webhook
```

---

## 🚀 Paso a Paso: Configurar en Mercado Pago

### 1. Acceder al Panel de Desarrolladores

1. Ve a: https://www.mercadopago.cl/developers/
2. Inicia sesión con tu cuenta de Mercado Pago
3. Selecciona tu aplicación (o crea una nueva)

### 2. Cambiar a Modo PRODUCCIÓN

⚠️ **IMPORTANTE**: Asegúrate de estar en modo **Producción**, no Test

1. En el panel superior, verás un switch "Test / Producción"
2. Cambia a **Producción** ✅
3. Confirma que las credenciales mostradas son las de producción

### 3. Configurar Webhook

1. En el menú lateral, ve a **Webhooks** o **Notificaciones**
2. Click en **Agregar nueva URL de notificación** o **Configure webhooks**

### 4. Completar el Formulario

**URL de notificación**:
```
https://overboastfully-pernicious-nasir.ngrok-free.dev/api/pagos/webhook
```

**Eventos a suscribirse**:
- ✅ `payment` (Pagos)
- ✅ `merchant_order` (Órdenes - opcional)

**Descripción** (opcional):
```
Webhook de producción para Taroti - Notificaciones de pagos
```

### 5. Guardar y Obtener Secret

1. Click en **Guardar** o **Crear**
2. Mercado Pago te mostrará un **Webhook Secret**
3. **COPIA ESTE SECRET** - lo necesitarás para el `.env`

Ejemplo:
```
37c01d6e8b981aacc925d35079eff02ec8d042f5a77af8ac954bbf6827cdb91a
```

### 6. Actualizar .env con el Secret

Si el secret cambió, actualiza tu archivo `.env`:

```bash
MERCADOPAGO_WEBHOOK_SECRET=<el-nuevo-secret-aqui>
```

Luego reinicia el backend:
```bash
npm run dev
```

---

## 🧪 Probar el Webhook

### Opción 1: Desde el Panel de MP

1. En la configuración del webhook, busca **Probar** o **Send test**
2. MP enviará una notificación de prueba
3. Verifica los logs del backend

### Opción 2: Pago de Prueba Real (CUIDADO: Pago Real)

⚠️ **ADVERTENCIA**: Esto hará un pago REAL con dinero REAL

1. Ve a tu aplicación frontend: http://localhost:5173
2. Selecciona un plan y crea una sesión
3. Completa el pago con una tarjeta real
4. El webhook debería activarse automáticamente

**Verifica los logs del backend**:
```bash
# Los logs deberían mostrar:
✅ Webhook recibido de Mercado Pago
✅ Pago aprobado para sesión: xxx-xxx-xxx
✅ Lectura agregada a la cola
```

### Opción 3: Simular Webhook Manualmente (Testing)

Para testing sin pagar:

```bash
curl -X POST "https://overboastfully-pernicious-nasir.ngrok-free.dev/api/pagos/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.updated",
    "data": {
      "id": "123456789"
    },
    "type": "payment"
  }'
```

---

## 🔍 Verificar que el Webhook Funciona

### 1. Revisar Logs del Backend

En la terminal donde corre el backend, deberías ver:

```
[INFO] Webhook recibido de Mercado Pago
[INFO] Tipo: payment
[INFO] Payment ID: 123456789
[INFO] Estado del pago: approved
[INFO] Sesión ID: xxx-xxx-xxx
[INFO] Lectura agregada a la cola
```

### 2. Revisar en el Panel de MP

1. Ve a **Webhooks** en el panel de MP
2. Verás un historial de notificaciones enviadas
3. Estados posibles:
   - ✅ **Delivered** (200 OK) - Webhook funcionó
   - ❌ **Failed** (4xx/5xx) - Hubo un error

### 3. Revisar Base de Datos

```sql
-- Ver pagos actualizados
SELECT id, sesion_id, estado, mp_payment_id, actualizado_en
FROM pagos
ORDER BY actualizado_en DESC
LIMIT 10;

-- Ver lecturas en cola
SELECT id, sesion_id, estado, creado_en
FROM cola_lecturas
WHERE estado = 'completada'
ORDER BY creado_en DESC
LIMIT 5;
```

---

## ⚠️ Troubleshooting

### Error: Webhook no llega

**Posibles causas**:

1. **URL incorrecta**
   - Verifica que la URL sea pública y accesible
   - Prueba acceder manualmente: `curl https://tu-url/api/pagos/webhook`

2. **ngrok expiró**
   - ngrok gratis expira cada 2 horas
   - Reinicia ngrok: `ngrok http 4000`
   - Actualiza la URL en MP con la nueva

3. **Firewall bloqueando**
   - Verifica que el puerto 4000 esté abierto
   - Verifica que ngrok esté corriendo

4. **Backend no está corriendo**
   - Verifica: `curl http://localhost:4000/api/planes`
   - Reinicia el backend si es necesario

### Error: Webhook Secret inválido

```bash
# El backend rechaza el webhook con "Firma inválida"
```

**Solución**:
1. Ve al panel de MP y copia el Webhook Secret correcto
2. Actualiza `.env`:
   ```bash
   MERCADOPAGO_WEBHOOK_SECRET=<secret-correcto>
   ```
3. Reinicia el backend

### Error: 404 Not Found

**Verifica la ruta**:
```bash
# Debe ser exactamente:
/api/pagos/webhook

# NO:
/pagos/webhook
/api/webhook
/webhook
```

---

## 🌐 Migrar a Producción Final

Cuando despliegues a Hostinger:

### 1. Obtener URL de Producción

```
https://api.tudominio.com/api/pagos/webhook
```

### 2. Actualizar en Mercado Pago

1. Ve al panel de MP → Webhooks
2. Edita la URL existente
3. Cambia de ngrok a tu dominio real
4. Guarda los cambios

### 3. Verificar SSL

⚠️ **Mercado Pago requiere HTTPS** - no acepta HTTP

Verifica que tu dominio tenga SSL activo:
```bash
curl -I https://api.tudominio.com/api/pagos/webhook
```

Debe retornar `200 OK` o `405 Method Not Allowed` (normal para GET)

---

## 📊 Monitoreo del Webhook

### Ver estadísticas en MP

1. Panel de MP → Webhooks
2. Click en tu webhook
3. Verás:
   - Total de notificaciones enviadas
   - Tasa de éxito/fallo
   - Últimas notificaciones

### Logs del Backend

```bash
# Ver logs en tiempo real
tail -f logs/backend.log

# Filtrar solo webhooks
grep "webhook" logs/backend.log | tail -20
```

---

## 🔐 Seguridad del Webhook

### Verificación de Firma (Ya implementado)

El backend ya verifica automáticamente:

1. **x-signature** header de Mercado Pago
2. **x-request-id** para validar autenticidad
3. Solo acepta notificaciones legítimas de MP

### Protección adicional

En producción, considera:

1. **Rate limiting** (ya implementado en el backend)
2. **IP allowlist** de Mercado Pago (opcional)
3. **Logs de auditoría** de webhooks recibidos

---

## ✅ Checklist Final

Antes de ir a producción:

- [ ] Webhook configurado en modo PRODUCCIÓN de MP
- [ ] URL del webhook apunta al dominio real (no ngrok)
- [ ] Webhook Secret actualizado en `.env`
- [ ] SSL/HTTPS activo en el dominio
- [ ] Backend reiniciado con nuevas configuraciones
- [ ] Prueba de pago real exitosa
- [ ] Webhook recibido y procesado correctamente
- [ ] Lectura generada por OpenAI después del pago
- [ ] Logs monitoreados sin errores

---

## 📞 Soporte

**Mercado Pago Developers**:
- Docs: https://www.mercadopago.com.ar/developers/es/docs/webhooks
- Soporte: developers@mercadopago.com
- FAQ: https://www.mercadopago.com.ar/developers/es/support

**Verificar estado de MP**:
- https://status.mercadopago.com/

---

**Última actualización**: 2026-05-18
**ngrok URL actual**: https://overboastfully-pernicious-nasir.ngrok-free.dev
**Estado**: ✅ Listo para configurar en MP
