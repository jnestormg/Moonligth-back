/*
  Warnings:

  - You are about to alter the column `userId` on the `refresh_tokens` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `refresh_tokens` DROP FOREIGN KEY `refresh_tokens_userId_fkey`;

-- AlterTable
ALTER TABLE `refresh_tokens` MODIFY `userId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `users`;

-- CreateTable
CREATE TABLE `aplicaciones_credito` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `credito_id` BIGINT NOT NULL,
    `reservacion_destino_id` BIGINT NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `aplicado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `reservacion_destino_id`(`reservacion_destino_id`),
    INDEX `fk_aplicaciones_credito`(`credito_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(30) NOT NULL,
    `correo` VARCHAR(255) NULL,
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `clientes_telefono_idx`(`telefono`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `creditos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `reservacion_origen_id` BIGINT NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `saldo` DECIMAL(10, 2) NOT NULL,
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `vence_en` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `reservacion_origen_id`(`reservacion_origen_id`),
    INDEX `fk_creditos_cliente`(`cliente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empleados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `correo` VARCHAR(255) NOT NULL,
    `contrasena_hash` VARCHAR(255) NOT NULL,
    `rol` VARCHAR(30) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_reservaciones` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `reservacion_id` BIGINT NOT NULL,
    `estado_anterior` VARCHAR(30) NULL,
    `estado_nuevo` VARCHAR(30) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `responsable_id` INTEGER NULL,
    `registrado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_historial_responsable`(`responsable_id`),
    INDEX `historial_reservaciones_reservacion_fecha`(`reservacion_id`, `registrado_en`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientos_credito` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `credito_id` BIGINT NOT NULL,
    `reservacion_id` BIGINT NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `registrado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_movimientos_reservacion`(`reservacion_id`),
    INDEX `movimientos_credito_credito_fecha`(`credito_id`, `registrado_en`, `id`),
    UNIQUE INDEX `movimientos_credito_operacion_unica`(`credito_id`, `reservacion_id`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `reservacion_id` BIGINT NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `metodo` VARCHAR(20) NOT NULL,
    `referencia` VARCHAR(100) NULL,
    `registrado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `anticipo_unico` BIGINT NULL,

    UNIQUE INDEX `un_anticipo_por_reservacion`(`anticipo_unico`),
    INDEX `fk_pagos_reservacion`(`reservacion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservaciones` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `sala_id` INTEGER NOT NULL,
    `inicio` TIMESTAMP(0) NOT NULL,
    `fin` TIMESTAMP(0) NOT NULL,
    `fin_bloqueo` TIMESTAMP(0) NOT NULL,
    `asistentes` INTEGER NOT NULL,
    `costo_total` DECIMAL(10, 2) NOT NULL,
    `anticipo_requerido` DECIMAL(10, 2) NOT NULL,
    `estado` VARCHAR(30) NOT NULL,
    `vencimiento_apartado` TIMESTAMP(0) NULL,
    `folio` VARCHAR(24) NULL,
    `cancelada_en` TIMESTAMP(0) NULL,
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `reservaciones_folio_unico`(`folio`),
    INDEX `fk_reservaciones_cliente`(`cliente_id`),
    INDEX `fk_reservaciones_sala`(`sala_id`),
    INDEX `reservaciones_inicio_sala_idx`(`inicio`, `sala_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `reservacion_id` BIGINT NOT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `nota_cocina` VARCHAR(255) NULL,
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` TIMESTAMP(0) NOT NULL,

    INDEX `pedidos_reservacion_id_idx`(`reservacion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedido_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `pedido_id` BIGINT NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `cantidad` INTEGER NOT NULL,
    `precio` DECIMAL(10, 2) NOT NULL,

    INDEX `pedido_items_pedido_id_idx`(`pedido_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `capacidad` INTEGER NOT NULL,
    `tamano` VARCHAR(20) NOT NULL,
    `tematica` VARCHAR(50) NOT NULL,
    `precio_hora` DECIMAL(10, 2) NOT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'habilitada',

    UNIQUE INDEX `codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `empleados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aplicaciones_credito` ADD CONSTRAINT `fk_aplicaciones_credito` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `aplicaciones_credito` ADD CONSTRAINT `fk_aplicaciones_reservacion` FOREIGN KEY (`reservacion_destino_id`) REFERENCES `reservaciones`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `fk_creditos_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `fk_creditos_reservacion` FOREIGN KEY (`reservacion_origen_id`) REFERENCES `reservaciones`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `historial_reservaciones` ADD CONSTRAINT `fk_historial_reservacion` FOREIGN KEY (`reservacion_id`) REFERENCES `reservaciones`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `historial_reservaciones` ADD CONSTRAINT `fk_historial_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `empleados`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `movimientos_credito` ADD CONSTRAINT `fk_movimientos_credito` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `movimientos_credito` ADD CONSTRAINT `fk_movimientos_reservacion` FOREIGN KEY (`reservacion_id`) REFERENCES `reservaciones`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `fk_pagos_reservacion` FOREIGN KEY (`reservacion_id`) REFERENCES `reservaciones`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reservaciones` ADD CONSTRAINT `fk_reservaciones_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reservaciones` ADD CONSTRAINT `fk_reservaciones_sala` FOREIGN KEY (`sala_id`) REFERENCES `salas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_reservacion_id_fkey` FOREIGN KEY (`reservacion_id`) REFERENCES `reservaciones`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pedido_items` ADD CONSTRAINT `pedido_items_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
