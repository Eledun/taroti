-- ============================================================================
-- Migration v2.3.6: MEDIUM Priority - Payment System Enhancements
-- Fecha: 2026-05-25
-- Descripción: Mejorar tabla pagos con preference_id, email y campos adicionales
-- ============================================================================

-- IMPORTANTE: Esta migración implementa las mejoras de prioridad media:
-- ISSUE-015: Agregar preference_id y email a tabla pagos
-- ISSUE-018: Campos adicionales para webhook mejorado
-- ISSUE-021: Email de usuario para notificaciones

-- ============================================================================
-- PASO 1: Agregar campos de Mercado Pago
-- ============================================================================

ALTER TABLE pagos
ADD COLUMN preference_id VARCHAR(100) DEFAULT NULL AFTER payment_id_mp,
ADD COLUMN external_reference VARCHAR(100) DEFAULT NULL AFTER preference_id,
ADD COLUMN merchant_order_id VARCHAR(100) DEFAULT NULL AFTER external_reference;

-- ============================================================================
-- PASO 2: Agregar campos de usuario y contacto
-- ============================================================================

ALTER TABLE pagos
ADD COLUMN email_usuario VARCHAR(255) DEFAULT NULL AFTER monto_clp,
ADD COLUMN nombre_usuario VARCHAR(255) DEFAULT NULL AFTER email_usuario,
ADD COLUMN telefono_usuario VARCHAR(50) DEFAULT NULL AFTER nombre_usuario;

-- ============================================================================
-- PASO 3: Agregar campos de metadata del pago
-- ============================================================================

ALTER TABLE pagos
ADD COLUMN tipo_pago VARCHAR(50) DEFAULT NULL AFTER telefono_usuario COMMENT 'credit_card, debit_card, etc.',
ADD COLUMN metodo_pago VARCHAR(50) DEFAULT NULL AFTER tipo_pago COMMENT 'visa, mastercard, etc.',
ADD COLUMN cuotas INT DEFAULT 1 AFTER metodo_pago,
ADD COLUMN monto_neto DECIMAL(10, 2) DEFAULT NULL AFTER cuotas COMMENT 'Monto sin fees',
ADD COLUMN fee_mp DECIMAL(10, 2) DEFAULT NULL AFTER monto_neto COMMENT 'Comisión de MP';

-- ============================================================================
-- PASO 4: Agregar campos de seguimiento
-- ============================================================================

ALTER TABLE pagos
ADD COLUMN ip_address VARCHAR(45) DEFAULT NULL AFTER fee_mp,
ADD COLUMN user_agent TEXT DEFAULT NULL AFTER ip_address,
ADD COLUMN metadata_extra JSON DEFAULT NULL AFTER user_agent COMMENT 'Datos adicionales flexibles';

-- ============================================================================
-- PASO 5: Agregar índices para optimizar búsquedas
-- ============================================================================

CREATE INDEX idx_preference_id ON pagos(preference_id);
CREATE INDEX idx_external_reference ON pagos(external_reference);
CREATE INDEX idx_email_usuario ON pagos(email_usuario);
CREATE INDEX idx_tipo_pago ON pagos(tipo_pago);

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================

-- Verificar estructura de tabla pagos
SELECT
  'Verificación de estructura pagos' AS paso,
  COUNT(*) AS total_columnas
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'pagos';

-- Verificar nuevas columnas
SELECT
  'Columnas nuevas' AS paso,
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'pagos'
  AND COLUMN_NAME IN (
    'preference_id', 'external_reference', 'merchant_order_id',
    'email_usuario', 'nombre_usuario', 'telefono_usuario',
    'tipo_pago', 'metodo_pago', 'cuotas', 'monto_neto', 'fee_mp',
    'ip_address', 'user_agent', 'metadata_extra'
  )
ORDER BY ORDINAL_POSITION;

-- Verificar índices creados
SELECT
  'Verificación de índices' AS paso,
  INDEX_NAME,
  COLUMN_NAME,
  INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'pagos'
  AND INDEX_NAME IN ('idx_preference_id', 'idx_external_reference', 'idx_email_usuario', 'idx_tipo_pago')
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. Esta migración NO elimina datos existentes
-- 2. Todas las columnas nuevas aceptan NULL para compatibilidad
-- 3. Los índices mejorarán búsquedas por preference_id y email
-- 4. metadata_extra permite almacenar datos variables sin cambiar schema
-- 5. Los nuevos campos se poblarán en futuros pagos

-- ============================================================================
-- BENEFICIOS DE ESTA MIGRACIÓN
-- ============================================================================

-- ✅ preference_id: Trackear preferencia de MP antes del pago
-- ✅ email_usuario: Enviar notificaciones por email
-- ✅ external_reference: Correlacionar con sistemas externos
-- ✅ merchant_order_id: Orden de compra de MP
-- ✅ tipo_pago/metodo_pago: Analytics de métodos preferidos
-- ✅ cuotas: Saber si usan financiamiento
-- ✅ monto_neto/fee_mp: Contabilidad precisa
-- ✅ ip_address/user_agent: Seguridad y fraud detection
-- ✅ metadata_extra: Flexibilidad para datos futuros

-- ============================================================================
-- EJEMPLO DE USO - Guardar pago completo
-- ============================================================================

-- INSERT INTO pagos (
--   sesion_id, preference_id, payment_id_mp, external_reference,
--   estado_mp, estado_detalle_mp,
--   plan_nombre, monto_clp, monto_neto, fee_mp,
--   email_usuario, nombre_usuario,
--   tipo_pago, metodo_pago, cuotas,
--   ip_address, fecha_pago
-- ) VALUES (
--   'sesion-123',
--   'MP-PREF-123456',
--   'MP-PAY-789012',
--   'ext-ref-123',
--   'approved',
--   'accredited',
--   'Tres Cartas',
--   5000.00,
--   4750.00,
--   250.00,
--   'usuario@example.com',
--   'Juan Pérez',
--   'credit_card',
--   'visa',
--   1,
--   '192.168.1.1',
--   NOW()
-- );

-- ============================================================================
-- EJEMPLO DE USO - Buscar pagos por email
-- ============================================================================

-- SELECT
--   sesion_id,
--   email_usuario,
--   plan_nombre,
--   monto_clp,
--   estado_mp,
--   fecha_pago
-- FROM pagos
-- WHERE email_usuario = 'usuario@example.com'
-- ORDER BY fecha_pago DESC;

-- ============================================================================
-- ROLLBACK (si es necesario)
-- ============================================================================

-- PRECAUCIÓN: Solo ejecutar si necesitas revertir la migración
--
-- ALTER TABLE pagos
-- DROP COLUMN preference_id,
-- DROP COLUMN external_reference,
-- DROP COLUMN merchant_order_id,
-- DROP COLUMN email_usuario,
-- DROP COLUMN nombre_usuario,
-- DROP COLUMN telefono_usuario,
-- DROP COLUMN tipo_pago,
-- DROP COLUMN metodo_pago,
-- DROP COLUMN cuotas,
-- DROP COLUMN monto_neto,
-- DROP COLUMN fee_mp,
-- DROP COLUMN ip_address,
-- DROP COLUMN user_agent,
-- DROP COLUMN metadata_extra;
--
-- DROP INDEX idx_preference_id ON pagos;
-- DROP INDEX idx_external_reference ON pagos;
-- DROP INDEX idx_email_usuario ON pagos;
-- DROP INDEX idx_tipo_pago ON pagos;

-- ============================================================================
-- FIN DE MIGRACIÓN v2.3.6
-- ============================================================================

SELECT 'Migración v2.3.6 completada exitosamente ✅' AS resultado;
