-- ============================================================================
-- Migration v2.3.5: HIGH Priority Features
-- Fecha: 2026-05-25
-- Descripción: Agregar audit_log table y optimizaciones para endpoints
-- ============================================================================

-- IMPORTANTE: Esta migración implementa las siguientes mejoras:
-- - Tabla audit_log para trazabilidad completa
-- - Índices adicionales para performance
-- - Preparación para nuevos endpoints de consulta

-- ============================================================================
-- PASO 1: Crear tabla audit_log
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento VARCHAR(100) NOT NULL COMMENT 'Tipo de evento (lectura_generada, pago_aprobado, etc.)',
    sesion_id VARCHAR(50) NOT NULL COMMENT 'ID de sesión relacionado',
    datos JSON DEFAULT NULL COMMENT 'Datos adicionales del evento',
    fecha_evento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_evento (evento),
    INDEX idx_sesion_id (sesion_id),
    INDEX idx_fecha_evento (fecha_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registro de auditoría para trazabilidad de eventos';

-- ============================================================================
-- PASO 2: Índices adicionales para optimizar queries de filtrado
-- ============================================================================

-- Verificar si índices ya existen antes de crearlos
CREATE INDEX IF NOT EXISTS idx_lecturas_fecha_creacion ON lecturas(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago ON pagos(fecha_pago);

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================

-- Verificar tabla audit_log creada
SELECT
  'Verificación audit_log' AS paso,
  COUNT(*) AS total_columnas
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'audit_log';

-- Verificar índices de audit_log
SELECT
  'Índices audit_log' AS paso,
  INDEX_NAME,
  COLUMN_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'audit_log'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. audit_log permite rastrear todos los eventos del sistema
-- 2. Datos JSON permite almacenar información variable según el evento
-- 3. Los índices optimizan búsquedas por evento, sesión y fecha
-- 4. La tabla crece con el tiempo - considerar archivado periódico
-- 5. Útil para debugging, analytics y cumplimiento normativo

-- ============================================================================
-- EJEMPLOS DE USO
-- ============================================================================

-- Registrar lectura generada
-- INSERT INTO audit_log (evento, sesion_id, datos, fecha_evento)
-- VALUES ('lectura_generada', 'sesion123', '{"modelo": "gpt-4o", "tokens": 843}', NOW());

-- Registrar pago aprobado
-- INSERT INTO audit_log (evento, sesion_id, datos, fecha_evento)
-- VALUES ('pago_aprobado', 'sesion123', '{"payment_id": "MP123", "monto": 5000}', NOW());

-- Consultar eventos de una sesión
-- SELECT * FROM audit_log WHERE sesion_id = 'sesion123' ORDER BY fecha_evento DESC;

-- Consultar eventos por tipo en las últimas 24 horas
-- SELECT * FROM audit_log
-- WHERE evento = 'lectura_generada'
--   AND fecha_evento >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
-- ORDER BY fecha_evento DESC;

-- ============================================================================
-- ROLLBACK (si es necesario)
-- ============================================================================

-- PRECAUCIÓN: Solo ejecutar si necesitas revertir la migración
--
-- DROP TABLE IF EXISTS audit_log;
-- DROP INDEX IF EXISTS idx_lecturas_fecha_creacion ON lecturas;
-- DROP INDEX IF EXISTS idx_pagos_fecha_pago ON pagos;

-- ============================================================================
-- FIN DE MIGRACIÓN v2.3.5
-- ============================================================================

SELECT 'Migración v2.3.5 completada exitosamente ✅' AS resultado;
