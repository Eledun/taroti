-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `google_id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expira_en` DATETIME(3) NOT NULL,
    `refresh_token` TEXT NULL,
    `refresh_token_expira_en` DATETIME(3) NULL,

    UNIQUE INDEX `usuarios_google_id_key`(`google_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planes` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `tipo_tirada` VARCHAR(191) NOT NULL,
    `num_cartas` INTEGER NOT NULL,
    `precio_base` INTEGER NOT NULL,
    `recargo_anonimo_pct` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `actualizado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sesiones` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `sesion_origen_id` VARCHAR(191) NULL,
    `tipo_usuario` VARCHAR(191) NOT NULL,
    `pregunta` TEXT NOT NULL,
    `cartas_json` TEXT NOT NULL,
    `estado` VARCHAR(191) NOT NULL,
    `token_acceso` VARCHAR(191) NOT NULL,
    `precio_calculado` INTEGER NOT NULL,
    `generando` BOOLEAN NOT NULL DEFAULT false,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sesiones_usuario_id_idx`(`usuario_id`),
    INDEX `sesiones_plan_id_idx`(`plan_id`),
    INDEX `sesiones_sesion_origen_id_idx`(`sesion_origen_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` VARCHAR(191) NOT NULL,
    `sesion_id` VARCHAR(191) NOT NULL,
    `mp_payment_id` VARCHAR(191) NOT NULL,
    `mp_preference_id` VARCHAR(191) NOT NULL,
    `monto` INTEGER NOT NULL,
    `precio_cobrado` INTEGER NOT NULL,
    `recargo_aplicado` INTEGER NOT NULL,
    `estado` VARCHAR(191) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pagos_mp_payment_id_key`(`mp_payment_id`),
    INDEX `pagos_sesion_id_idx`(`sesion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lecturas` (
    `id` VARCHAR(191) NOT NULL,
    `sesion_id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NULL,
    `ambito_detectado` VARCHAR(191) NOT NULL,
    `interpretacion` TEXT NOT NULL,
    `expirada` BOOLEAN NOT NULL DEFAULT false,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expira_en` DATETIME(3) NULL,

    UNIQUE INDEX `lecturas_sesion_id_key`(`sesion_id`),
    INDEX `lecturas_usuario_id_idx`(`usuario_id`),
    INDEX `lecturas_expirada_expira_en_idx`(`expirada`, `expira_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `config_admin` (
    `id` VARCHAR(191) NOT NULL,
    `clave` VARCHAR(191) NOT NULL,
    `valor` TEXT NOT NULL,
    `actualizado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `config_admin_clave_key`(`clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `errores` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `sesion_id` VARCHAR(191) NULL,
    `mensaje` TEXT NOT NULL,
    `contexto_json` TEXT NULL,
    `estado` VARCHAR(191) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resuelto_en` DATETIME(3) NULL,

    INDEX `errores_sesion_id_idx`(`sesion_id`),
    INDEX `errores_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sesiones` ADD CONSTRAINT `sesiones_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sesiones` ADD CONSTRAINT `sesiones_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `planes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sesiones` ADD CONSTRAINT `sesiones_sesion_origen_id_fkey` FOREIGN KEY (`sesion_origen_id`) REFERENCES `sesiones`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_sesion_id_fkey` FOREIGN KEY (`sesion_id`) REFERENCES `sesiones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lecturas` ADD CONSTRAINT `lecturas_sesion_id_fkey` FOREIGN KEY (`sesion_id`) REFERENCES `sesiones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lecturas` ADD CONSTRAINT `lecturas_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `errores` ADD CONSTRAINT `errores_sesion_id_fkey` FOREIGN KEY (`sesion_id`) REFERENCES `sesiones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
