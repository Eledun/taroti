-- ============================================================================
-- TAROTI LATAM - HOSTINGER DATABASE SETUP
-- ============================================================================
-- Usuario: u616221621
-- Base de datos: u616221621_taroti
-- ============================================================================

-- Crear base de datos (ejecutar primero si no existe)
CREATE DATABASE IF NOT EXISTS u616221621_taroti CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE u616221621_taroti;

-- Set UTF-8 encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================================
-- TABLA 1: pagos
-- ============================================================================

CREATE TABLE IF NOT EXISTS pagos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sesion_id VARCHAR(100) NOT NULL UNIQUE,
    payment_id_mp VARCHAR(100) DEFAULT NULL,
    preference_id VARCHAR(100) DEFAULT NULL,
    external_reference VARCHAR(100) DEFAULT NULL,
    merchant_order_id VARCHAR(100) DEFAULT NULL,
    estado_mp ENUM('pending','approved','authorized','in_process','in_mediation','rejected','cancelled','refunded','charged_back') DEFAULT 'pending',
    estado_detalle_mp VARCHAR(100) DEFAULT NULL,
    plan_nombre VARCHAR(100) DEFAULT NULL,
    monto_clp DECIMAL(10, 2) DEFAULT NULL,
    email_usuario VARCHAR(255) DEFAULT NULL,
    nombre_usuario VARCHAR(255) DEFAULT NULL,
    telefono_usuario VARCHAR(50) DEFAULT NULL,
    tipo_pago VARCHAR(50) DEFAULT NULL,
    metodo_pago VARCHAR(50) DEFAULT NULL,
    cuotas INT DEFAULT 1,
    monto_neto DECIMAL(10, 2) DEFAULT NULL,
    fee_mp DECIMAL(10, 2) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    metadata_extra JSON DEFAULT NULL,
    fecha_pago DATETIME DEFAULT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sesion_id (sesion_id),
    INDEX idx_payment_id_mp (payment_id_mp),
    INDEX idx_preference_id (preference_id),
    INDEX idx_external_reference (external_reference),
    INDEX idx_estado_mp (estado_mp),
    INDEX idx_email_usuario (email_usuario),
    INDEX idx_tipo_pago (tipo_pago),
    INDEX idx_fecha_pago (fecha_pago),
    INDEX idx_fecha_creacion (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 2: lecturas
-- ============================================================================

CREATE TABLE IF NOT EXISTS lecturas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sesion_id VARCHAR(100) NOT NULL,
    pregunta TEXT NOT NULL,
    cartas_seleccionadas JSON NOT NULL,
    tipo_tirada VARCHAR(50) DEFAULT NULL,
    lectura_ia TEXT NOT NULL,
    modelo_ia VARCHAR(50) DEFAULT 'gpt-4o-mini',
    tokens_usados INT DEFAULT NULL,
    temperatura DECIMAL(3, 2) DEFAULT 0.7,
    token_acceso VARCHAR(100) DEFAULT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sesion_id (sesion_id),
    INDEX idx_tipo_tirada (tipo_tirada),
    INDEX idx_modelo_ia (modelo_ia),
    INDEX idx_token_acceso (token_acceso),
    INDEX idx_fecha_creacion (fecha_creacion),
    FOREIGN KEY (sesion_id) REFERENCES pagos(sesion_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 3: sesiones
-- ============================================================================

CREATE TABLE IF NOT EXISTS sesiones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sesion_id VARCHAR(100) NOT NULL UNIQUE,
    plan_id VARCHAR(50) NOT NULL,
    plan_nombre VARCHAR(100) NOT NULL,
    tipo_tirada VARCHAR(50) NOT NULL,
    num_cartas INT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    pregunta TEXT NOT NULL,
    cartas JSON NOT NULL,
    estado_pago ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    fecha_pago DATETIME DEFAULT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sesion_id (sesion_id),
    INDEX idx_plan_id (plan_id),
    INDEX idx_estado_pago (estado_pago),
    INDEX idx_fecha_creacion (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 4: webhook_events_mp
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_events_mp (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(100) NOT NULL,
    sesion_id VARCHAR(100) DEFAULT NULL,
    tipo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) DEFAULT NULL,
    payload JSON NOT NULL,
    signature VARCHAR(500) DEFAULT NULL,
    request_id VARCHAR(100) DEFAULT NULL,
    fecha_recepcion DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payment_id (payment_id),
    INDEX idx_sesion_id (sesion_id),
    INDEX idx_tipo (tipo),
    INDEX idx_accion (accion),
    INDEX idx_fecha_recepcion (fecha_recepcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 5: audit_log
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    evento VARCHAR(100) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id VARCHAR(100) DEFAULT NULL,
    detalles JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    fecha_evento DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_evento (evento),
    INDEX idx_entidad (entidad, entidad_id),
    INDEX idx_fecha_evento (fecha_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 'Schema Hostinger instalado exitosamente ✅' AS resultado;

SELECT 'Tablas creadas:' AS info, COUNT(*) AS total
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'u616221621_taroti';

SELECT TABLE_NAME AS tabla, COUNT(*) AS columnas
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'u616221621_taroti'
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;
