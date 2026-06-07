-- ============================================================================
-- TAROTI LATAM - PRODUCTION DATABASE SCHEMA v2.3.10
-- ============================================================================
-- Database: taroti_latam (Production)
-- Charset: UTF8MB4 (full Unicode support including emojis)
-- Engine: InnoDB (ACID compliance, foreign keys)
-- ============================================================================

-- Set UTF-8 encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================================
-- TABLA 1: pagos
-- ============================================================================
-- Almacena toda la información de transacciones de Mercado Pago
-- Incluye todas las columnas necesarias después de migraciones v2.3.4-v2.3.6
-- ============================================================================

CREATE TABLE IF NOT EXISTS pagos (
    -- Primary Key
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Identificadores únicos
    sesion_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'ID único de sesión generado por frontend',
    payment_id_mp VARCHAR(100) DEFAULT NULL COMMENT 'Payment ID de Mercado Pago',
    preference_id VARCHAR(100) DEFAULT NULL COMMENT 'Preference ID de Mercado Pago',
    external_reference VARCHAR(100) DEFAULT NULL COMMENT 'Referencia externa (mismo que sesion_id)',
    merchant_order_id VARCHAR(100) DEFAULT NULL COMMENT 'Merchant Order ID de MP',

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
    ) DEFAULT 'pending' COMMENT 'Estado del pago en MP',

    estado_detalle_mp VARCHAR(100) DEFAULT NULL COMMENT 'Detalle del estado (accredited, etc.)',

    -- Información del plan
    plan_nombre VARCHAR(100) DEFAULT NULL COMMENT 'Nombre del plan (Tres Cartas, Cruz Celta, etc.)',
    monto_clp DECIMAL(10, 2) DEFAULT NULL COMMENT 'Monto total en pesos chilenos',

    -- Información del usuario
    email_usuario VARCHAR(255) DEFAULT NULL COMMENT 'Email del usuario',
    nombre_usuario VARCHAR(255) DEFAULT NULL COMMENT 'Nombre completo del usuario',
    telefono_usuario VARCHAR(50) DEFAULT NULL COMMENT 'Teléfono del usuario',

    -- Metadata del pago
    tipo_pago VARCHAR(50) DEFAULT NULL COMMENT 'Tipo de pago (credit_card, debit_card, etc.)',
    metodo_pago VARCHAR(50) DEFAULT NULL COMMENT 'Método de pago (visa, mastercard, etc.)',
    cuotas INT DEFAULT 1 COMMENT 'Número de cuotas',
    monto_neto DECIMAL(10, 2) DEFAULT NULL COMMENT 'Monto neto recibido (después de fees)',
    fee_mp DECIMAL(10, 2) DEFAULT NULL COMMENT 'Fee cobrado por Mercado Pago',

    -- Seguimiento y auditoría
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP del cliente (IPv4 o IPv6)',
    user_agent TEXT DEFAULT NULL COMMENT 'User Agent del navegador',
    metadata_extra JSON DEFAULT NULL COMMENT 'Metadata adicional flexible',

    -- Timestamps
    fecha_pago DATETIME DEFAULT NULL COMMENT 'Fecha de pago confirmado',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',

    -- Índices para optimizar consultas
    INDEX idx_sesion_id (sesion_id),
    INDEX idx_payment_id_mp (payment_id_mp),
    INDEX idx_preference_id (preference_id),
    INDEX idx_external_reference (external_reference),
    INDEX idx_estado_mp (estado_mp),
    INDEX idx_email_usuario (email_usuario),
    INDEX idx_tipo_pago (tipo_pago),
    INDEX idx_fecha_pago (fecha_pago),
    INDEX idx_fecha_creacion (fecha_creacion)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla principal de pagos con integración Mercado Pago';

-- ============================================================================
-- TABLA 2: lecturas
-- ============================================================================
-- Almacena lecturas de tarot generadas por IA (OpenAI GPT-4)
-- Relación 1:1 con tabla pagos via sesion_id
-- ============================================================================

CREATE TABLE IF NOT EXISTS lecturas (
    -- Primary Key
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Foreign Key a pagos
    sesion_id VARCHAR(100) NOT NULL COMMENT 'ID de sesión (referencia a pagos.sesion_id)',

    -- Datos de entrada de la lectura
    pregunta TEXT NOT NULL COMMENT 'Pregunta realizada por el usuario',
    cartas_seleccionadas JSON NOT NULL COMMENT 'Array de cartas [{arcano, invertida, posicion}]',
    tipo_tirada VARCHAR(50) DEFAULT NULL COMMENT 'Tipo de tirada (tres_cartas, cruz_celta, rueda_año)',

    -- Resultado generado por IA
    lectura_ia TEXT NOT NULL COMMENT 'Lectura completa generada por OpenAI',

    -- Metadata de IA
    modelo_ia VARCHAR(50) DEFAULT 'gpt-4o-mini' COMMENT 'Modelo usado (gpt-4o, gpt-4o-mini, etc.)',
    tokens_usados INT DEFAULT NULL COMMENT 'Tokens consumidos en la generación',
    temperatura DECIMAL(3, 2) DEFAULT 0.7 COMMENT 'Temperatura usada (0.0-1.0)',

    -- Control de acceso
    token_acceso VARCHAR(100) DEFAULT NULL COMMENT 'Token para acceso sin pago (opcional)',

    -- Timestamps
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación de la lectura',

    -- Índices
    INDEX idx_sesion_id (sesion_id),
    INDEX idx_tipo_tirada (tipo_tirada),
    INDEX idx_modelo_ia (modelo_ia),
    INDEX idx_token_acceso (token_acceso),
    INDEX idx_fecha_creacion (fecha_creacion),

    -- Foreign Key constraint
    FOREIGN KEY (sesion_id) REFERENCES pagos(sesion_id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Lecturas de tarot generadas por IA';

-- ============================================================================
-- TABLA 3: sesiones
-- ============================================================================
-- Tabla para trackear sesiones de usuario (consulta + pago + lectura)
-- Contiene el estado completo del flujo del usuario
-- ============================================================================

CREATE TABLE IF NOT EXISTS sesiones (
    -- Primary Key
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Identificador único
    sesion_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'ID único de sesión',

    -- Información del plan seleccionado
    plan_id VARCHAR(50) NOT NULL COMMENT 'ID del plan (tres-cartas, cruz-celta, rueda-año)',
    plan_nombre VARCHAR(100) NOT NULL COMMENT 'Nombre del plan',
    tipo_tirada VARCHAR(50) NOT NULL COMMENT 'Tipo de tirada',
    num_cartas INT NOT NULL COMMENT 'Número de cartas del plan',
    monto DECIMAL(10, 2) NOT NULL COMMENT 'Monto del plan en CLP',

    -- Datos de la consulta
    pregunta TEXT NOT NULL COMMENT 'Pregunta del usuario',
    cartas JSON NOT NULL COMMENT 'Cartas seleccionadas',

    -- Estado del pago
    estado_pago ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    fecha_pago DATETIME DEFAULT NULL,

    -- Timestamps
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_sesion_id (sesion_id),
    INDEX idx_plan_id (plan_id),
    INDEX idx_estado_pago (estado_pago),
    INDEX idx_fecha_creacion (fecha_creacion)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sesiones de usuario (flujo completo consulta-pago-lectura)';

-- ============================================================================
-- TABLA 4: webhook_events_mp
-- ============================================================================
-- Registro de todos los webhooks recibidos de Mercado Pago
-- Útil para auditoría, debugging y resolución de problemas
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_events_mp (
    -- Primary Key
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Identificadores
    payment_id VARCHAR(100) NOT NULL COMMENT 'Payment ID de Mercado Pago',
    sesion_id VARCHAR(100) DEFAULT NULL COMMENT 'Sesión ID asociada',

    -- Tipo de evento
    tipo VARCHAR(50) NOT NULL COMMENT 'Tipo de evento (payment, merchant_order, etc.)',
    accion VARCHAR(50) DEFAULT NULL COMMENT 'Acción (payment.created, payment.updated, etc.)',

    -- Payload completo (para debugging)
    payload JSON NOT NULL COMMENT 'Payload completo del webhook',

    -- Headers importantes
    signature VARCHAR(500) DEFAULT NULL COMMENT 'Firma HMAC del webhook',
    request_id VARCHAR(100) DEFAULT NULL COMMENT 'X-Request-Id de MP',

    -- Timestamp
    fecha_recepcion DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de recepción del webhook',

    -- Índices
    INDEX idx_payment_id (payment_id),
    INDEX idx_sesion_id (sesion_id),
    INDEX idx_tipo (tipo),
    INDEX idx_accion (accion),
    INDEX idx_fecha_recepcion (fecha_recepcion)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registro de webhooks de Mercado Pago para auditoría';

-- ============================================================================
-- TABLA 5: audit_log
-- ============================================================================
-- Log de auditoría general del sistema
-- Trackea todas las operaciones importantes
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    -- Primary Key
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Evento
    evento VARCHAR(100) NOT NULL COMMENT 'Tipo de evento (pago_creado, lectura_generada, etc.)',
    entidad VARCHAR(50) NOT NULL COMMENT 'Entidad afectada (pago, lectura, webhook, etc.)',
    entidad_id VARCHAR(100) DEFAULT NULL COMMENT 'ID de la entidad afectada',

    -- Detalles
    detalles JSON DEFAULT NULL COMMENT 'Detalles adicionales del evento',

    -- Usuario/IP (opcional)
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP del cliente',
    user_agent TEXT DEFAULT NULL COMMENT 'User Agent del navegador',

    -- Timestamp
    fecha_evento DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha del evento',

    -- Índices
    INDEX idx_evento (evento),
    INDEX idx_entidad (entidad, entidad_id),
    INDEX idx_fecha_evento (fecha_evento)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log de auditoría general del sistema';

-- ============================================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- ============================================================================

SELECT 'Schema v2.3.10 creado exitosamente ✅' AS resultado;

SELECT
    'Tablas creadas' AS info,
    COUNT(*) AS total
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('pagos', 'lecturas', 'sesiones', 'webhook_events_mp', 'audit_log');

-- ============================================================================
-- INFORMACIÓN DE COLUMNAS
-- ============================================================================

SELECT
    TABLE_NAME,
    COUNT(*) AS total_columnas
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('pagos', 'lecturas', 'sesiones', 'webhook_events_mp', 'audit_log')
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;

-- ============================================================================
-- NOTAS DE DEPLOYMENT
-- ============================================================================

-- 1. Crear database ANTES de ejecutar este script:
--    CREATE DATABASE taroti_latam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--
-- 2. Crear usuario con permisos limitados (PRODUCCIÓN):
--    CREATE USER 'taroti_prod'@'localhost' IDENTIFIED BY 'PASSWORD_SEGURO_AQUI';
--    GRANT SELECT, INSERT, UPDATE ON taroti_latam.* TO 'taroti_prod'@'localhost';
--    FLUSH PRIVILEGES;
--
--    IMPORTANTE: NO dar DELETE ni DROP en producción
--
-- 3. Ejecutar este schema:
--    mysql -u taroti_prod -p taroti_latam < db/schema-production-v2.3.10.sql
--
-- 4. Verificar tablas creadas:
--    SHOW TABLES;
--    DESCRIBE pagos;
--    DESCRIBE lecturas;
--
-- 5. Para Hostinger/cPanel:
--    - Ir a phpMyAdmin
--    - Crear database desde panel
--    - Copiar/pegar este SQL completo en la pestaña SQL
--    - Ejecutar
--
-- 6. Configurar .env en servidor:
--    MYSQL_HOST=localhost (o IP del servidor MySQL)
--    MYSQL_USER=taroti_prod
--    MYSQL_PASSWORD=tu_password_seguro
--    MYSQL_DATABASE=taroti_latam
--    MYSQL_PORT=3306
--
-- 7. Credenciales Mercado Pago PRODUCCIÓN:
--    MP_ACCESS_TOKEN=APP-XXXXXXXXXXXXXXX (PRODUCCIÓN)
--    MP_PUBLIC_KEY=APP-XXXXXXXXXXXXXXX (PRODUCCIÓN)
--    FRONTEND_URL=https://taroti.mx (tu dominio real)
--
-- 8. Credenciales OpenAI:
--    OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXX
--
-- ============================================================================
-- SEGURIDAD - CHECKLIST PRODUCCIÓN
-- ============================================================================

-- ✅ Usuario MySQL con permisos mínimos (NO DELETE, NO DROP)
-- ✅ Password fuerte para usuario MySQL (16+ caracteres)
-- ✅ .env NUNCA commiteado a git
-- ✅ Backups automáticos configurados (diarios)
-- ✅ SSL/TLS habilitado para conexiones MySQL remotas
-- ✅ Firewall: Solo permitir conexiones desde app server
-- ✅ Rotar API keys cada 90 días
-- ✅ Monitoreo de logs de auditoría
-- ✅ Rate limiting en endpoints de API

-- ============================================================================
-- FIN DEL SCHEMA v2.3.10
-- ============================================================================
