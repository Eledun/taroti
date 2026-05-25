-- ============================================================================
-- SCHEMA TAROTI LATAM v2.3.0
-- Base de datos MariaDB para gestión de pagos Mercado Pago
-- ============================================================================

-- Usar charset UTF-8 para compatibilidad con español
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================================
-- TABLA: pagos
-- Almacena información de transacciones Mercado Pago
-- ============================================================================

CREATE TABLE IF NOT EXISTS pagos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Identificadores únicos
    sesion_id VARCHAR(100) NOT NULL UNIQUE,
    payment_id_mp VARCHAR(100) DEFAULT NULL,

    -- Estado del pago (según Mercado Pago)
    estado_mp ENUM(
        'pending',      -- Pendiente de pago
        'approved',     -- Aprobado
        'authorized',   -- Autorizado (requiere captura)
        'in_process',   -- En proceso
        'in_mediation', -- En mediación
        'rejected',     -- Rechazado
        'cancelled',    -- Cancelado
        'refunded',     -- Reembolsado
        'charged_back'  -- Contracargo
    ) DEFAULT 'pending',

    estado_detalle_mp VARCHAR(100) DEFAULT NULL,

    -- Información del plan
    plan_nombre VARCHAR(100) DEFAULT NULL,
    monto_clp DECIMAL(10, 2) DEFAULT NULL,

    -- Timestamps
    fecha_pago DATETIME DEFAULT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_sesion_id (sesion_id),
    INDEX idx_payment_id_mp (payment_id_mp),
    INDEX idx_estado_mp (estado_mp),
    INDEX idx_fecha_pago (fecha_pago)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: lecturas
-- Almacena lecturas de tarot generadas por IA
-- ============================================================================

CREATE TABLE IF NOT EXISTS lecturas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Relación con pago
    sesion_id VARCHAR(100) NOT NULL,

    -- Datos de la lectura
    pregunta TEXT NOT NULL,
    cartas_seleccionadas JSON NOT NULL,
    lectura_ia TEXT NOT NULL,

    -- Metadata
    modelo_ia VARCHAR(50) DEFAULT 'gpt-4o-mini',
    tokens_usados INT DEFAULT NULL,

    -- Timestamps
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_sesion_id (sesion_id),
    INDEX idx_fecha_creacion (fecha_creacion),

    -- Foreign key
    FOREIGN KEY (sesion_id) REFERENCES pagos(sesion_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: webhook_events_mp
-- Registro de todos los eventos webhook recibidos de Mercado Pago
-- Para auditoría y debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_events_mp (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Identificadores
    payment_id VARCHAR(100) NOT NULL,

    -- Tipo de evento
    tipo VARCHAR(50) NOT NULL,        -- 'payment', 'merchant_order', etc.
    accion VARCHAR(50) DEFAULT NULL,  -- 'payment.created', 'payment.updated', etc.

    -- Payload completo (para debugging)
    payload JSON NOT NULL,

    -- Timestamp
    fecha_recepcion DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_payment_id (payment_id),
    INDEX idx_tipo (tipo),
    INDEX idx_fecha_recepcion (fecha_recepcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: audit_log
-- Log de auditoría general del sistema
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Evento
    evento VARCHAR(100) NOT NULL,     -- 'pago_creado', 'lectura_generada', etc.
    entidad VARCHAR(50) NOT NULL,     -- 'pago', 'lectura', 'webhook', etc.
    entidad_id VARCHAR(100) DEFAULT NULL,

    -- Detalles
    detalles JSON DEFAULT NULL,

    -- Usuario/IP (opcional)
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,

    -- Timestamp
    fecha_evento DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_evento (evento),
    INDEX idx_entidad (entidad, entidad_id),
    INDEX idx_fecha_evento (fecha_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATOS DE PRUEBA (OPCIONAL - Comentar en producción)
-- ============================================================================

-- Ejemplo de pago aprobado
-- INSERT INTO pagos (sesion_id, payment_id_mp, estado_mp, estado_detalle_mp, plan_nombre, monto_clp, fecha_pago)
-- VALUES ('test-sesion-123', 'MP-123456789', 'approved', 'accredited', 'Lectura 3 Cartas', 1000.00, NOW());

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================

-- 1. Crear base de datos antes de ejecutar este script:
--    CREATE DATABASE taroti_latam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--
-- 2. Crear usuario y otorgar permisos:
--    CREATE USER 'taroti_user'@'localhost' IDENTIFIED BY 'password_seguro';
--    GRANT ALL PRIVILEGES ON taroti_latam.* TO 'taroti_user'@'localhost';
--    FLUSH PRIVILEGES;
--
-- 3. Ejecutar este schema:
--    mysql -u taroti_user -p taroti_latam < db/schema-latam.sql
--
-- 4. Verificar tablas creadas:
--    SHOW TABLES;
--    DESCRIBE pagos;
--
-- 5. Para Hostinger:
--    - Usar phpMyAdmin o CLI de Hostinger
--    - Crear BD desde panel de control
--    - Copiar/pegar este SQL en phpMyAdmin > SQL tab
