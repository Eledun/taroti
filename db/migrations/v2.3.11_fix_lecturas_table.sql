-- Migración v2.3.11: Corregir estructura de tabla lecturas para Hostinger
-- Fecha: 2026-06-09
-- Descripción: Agregar columnas faltantes y eliminar foreign key incorrecta

-- ============================================================
-- 1. Agregar columnas faltantes a la tabla lecturas
-- ============================================================

-- Verificar si las columnas ya existen antes de agregarlas
-- (para que sea idempotente)

-- Agregar plan_id si no existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = 'lecturas'
    AND column_name = 'plan_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE lecturas ADD COLUMN plan_id VARCHAR(100) NULL AFTER sesion_id',
    'SELECT "Column plan_id already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar plan_nombre si no existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = 'lecturas'
    AND column_name = 'plan_nombre'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE lecturas ADD COLUMN plan_nombre VARCHAR(100) NULL AFTER plan_id',
    'SELECT "Column plan_nombre already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar precio si no existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = 'lecturas'
    AND column_name = 'precio'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE lecturas ADD COLUMN precio INT NULL AFTER tipo_tirada',
    'SELECT "Column precio already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar estado si no existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = 'lecturas'
    AND column_name = 'estado'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE lecturas ADD COLUMN estado ENUM(''pendiente'', ''pagada'', ''completada'', ''expirada'') DEFAULT ''pendiente'' AFTER lectura_ia',
    'SELECT "Column estado already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar tipo_usuario si no existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = 'lecturas'
    AND column_name = 'tipo_usuario'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE lecturas ADD COLUMN tipo_usuario ENUM(''registrado'', ''anonimo'') DEFAULT ''anonimo'' AFTER estado',
    'SELECT "Column tipo_usuario already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar expira_en si no existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = 'lecturas'
    AND column_name = 'expira_en'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE lecturas ADD COLUMN expira_en DATETIME NULL AFTER token_acceso',
    'SELECT "Column expira_en already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar fecha_actualizacion si no existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = 'lecturas'
    AND column_name = 'fecha_actualizacion'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE lecturas ADD COLUMN fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER fecha_creacion',
    'SELECT "Column fecha_actualizacion already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 2. Agregar índices si no existen
-- ============================================================

-- Índice para plan_id
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
    AND table_name = 'lecturas'
    AND index_name = 'idx_plan_id'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE lecturas ADD INDEX idx_plan_id (plan_id)',
    'SELECT "Index idx_plan_id already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para estado
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
    AND table_name = 'lecturas'
    AND index_name = 'idx_estado'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE lecturas ADD INDEX idx_estado (estado)',
    'SELECT "Index idx_estado already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para expira_en
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
    AND table_name = 'lecturas'
    AND index_name = 'idx_expira_en'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE lecturas ADD INDEX idx_expira_en (expira_en)',
    'SELECT "Index idx_expira_en already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 3. Eliminar foreign key incorrecta si existe
-- ============================================================

-- La foreign key lecturas_ibfk_1 está al revés:
-- Requiere que pagos exista antes que lecturas,
-- pero el flujo correcto es crear lecturas primero

SET @fk_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE table_schema = DATABASE()
    AND table_name = 'lecturas'
    AND constraint_name = 'lecturas_ibfk_1'
    AND constraint_type = 'FOREIGN KEY'
);

SET @sql = IF(@fk_exists > 0,
    'ALTER TABLE lecturas DROP FOREIGN KEY lecturas_ibfk_1',
    'SELECT "Foreign key lecturas_ibfk_1 does not exist" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- Verificación final
-- ============================================================

SELECT 'Migración v2.3.11 completada exitosamente' AS status;

DESCRIBE lecturas;
