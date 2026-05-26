-- ============================================================================
-- Migration v2.3.4: Fixes Críticos de Coherencia
-- Fecha: 2026-05-25
-- Descripción: Agregar campos faltantes para persistencia completa de datos
-- ============================================================================

-- IMPORTANTE: Esta migración resuelve los 6 issues críticos identificados:
-- ISSUE-001: Guardar lectura_ia en BD
-- ISSUE-002: Campos de plan en tabla lecturas
-- ISSUE-003: Persistir token_acceso
-- ISSUE-004: Columna estado
-- ISSUE-005: Foreign Key problemática (ya resuelta)
-- ISSUE-006: Inferencia de plan mejorada

-- ============================================================================
-- PASO 1: Agregar campos de plan a tabla lecturas
-- ============================================================================

ALTER TABLE lecturas
ADD COLUMN plan_id VARCHAR(50) DEFAULT NULL AFTER sesion_id,
ADD COLUMN plan_nombre VARCHAR(100) DEFAULT NULL AFTER plan_id,
ADD COLUMN tipo_tirada VARCHAR(50) DEFAULT NULL AFTER plan_nombre,
ADD COLUMN precio DECIMAL(10, 2) DEFAULT NULL AFTER tipo_tirada;

-- ============================================================================
-- PASO 2: Agregar campos de seguridad y estado
-- ============================================================================

ALTER TABLE lecturas
ADD COLUMN token_acceso VARCHAR(50) DEFAULT NULL AFTER lectura_ia,
ADD COLUMN estado ENUM('pendiente', 'pagada', 'completada', 'cancelada') DEFAULT 'pendiente' AFTER token_acceso,
ADD COLUMN tipo_usuario ENUM('anonimo', 'registrado') DEFAULT 'anonimo' AFTER estado;

-- ============================================================================
-- PASO 3: Agregar campos de expiración y actualización
-- ============================================================================

ALTER TABLE lecturas
ADD COLUMN expira_en DATETIME DEFAULT NULL AFTER fecha_creacion,
ADD COLUMN fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER expira_en;

-- ============================================================================
-- PASO 4: Agregar índices para optimizar queries
-- ============================================================================

CREATE INDEX idx_plan_id ON lecturas(plan_id);
CREATE INDEX idx_token_acceso ON lecturas(token_acceso);
CREATE INDEX idx_estado ON lecturas(estado);
CREATE INDEX idx_expira_en ON lecturas(expira_en);

-- ============================================================================
-- PASO 5: Actualizar lecturas existentes
-- ============================================================================

-- Actualizar estado basado en si tienen lectura_ia
UPDATE lecturas
SET estado = CASE
  WHEN lectura_ia IS NOT NULL AND lectura_ia != '' THEN 'completada'
  ELSE 'pendiente'
END
WHERE estado IS NULL OR estado = 'pendiente';

-- Calcular expiración para lecturas completadas (30 días desde creación)
UPDATE lecturas
SET expira_en = DATE_ADD(fecha_creacion, INTERVAL 30 DAY)
WHERE estado = 'completada' AND expira_en IS NULL;

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================

-- Verificar estructura de tabla
SELECT
  'Verificación de estructura' AS paso,
  COUNT(*) AS total_columnas
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'lecturas';

-- Verificar índices creados
SELECT
  'Verificación de índices' AS paso,
  COUNT(*) AS total_indices
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'lecturas'
  AND INDEX_NAME IN ('idx_plan_id', 'idx_token_acceso', 'idx_estado', 'idx_expira_en');

-- Verificar lecturas actualizadas
SELECT
  'Verificación de datos' AS paso,
  estado,
  COUNT(*) AS total
FROM lecturas
GROUP BY estado;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. Esta migración NO elimina datos existentes
-- 2. Todas las columnas nuevas aceptan NULL para compatibilidad con datos existentes
-- 3. Los índices mejorarán el performance de queries frecuentes
-- 4. Las lecturas futuras se crearán con TODOS los campos poblados
-- 5. El estado 'completada' indica que lectura_ia tiene contenido
-- 6. La expiración se calcula automáticamente (30 días desde creación)

-- ============================================================================
-- ROLLBACK (si es necesario)
-- ============================================================================

-- PRECAUCIÓN: Solo ejecutar si necesitas revertir la migración
--
-- ALTER TABLE lecturas
-- DROP COLUMN plan_id,
-- DROP COLUMN plan_nombre,
-- DROP COLUMN tipo_tirada,
-- DROP COLUMN precio,
-- DROP COLUMN token_acceso,
-- DROP COLUMN estado,
-- DROP COLUMN tipo_usuario,
-- DROP COLUMN expira_en,
-- DROP COLUMN fecha_actualizacion;
--
-- DROP INDEX idx_plan_id ON lecturas;
-- DROP INDEX idx_token_acceso ON lecturas;
-- DROP INDEX idx_estado ON lecturas;
-- DROP INDEX idx_expira_en ON lecturas;

-- ============================================================================
-- FIN DE MIGRACIÓN v2.3.4
-- ============================================================================

SELECT 'Migración v2.3.4 completada exitosamente ✅' AS resultado;
