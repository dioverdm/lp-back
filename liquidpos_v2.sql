-- ============================================================
-- LiquidPOS v2.0 - Schema Completo
-- Multi-empresa, Roles, Facturación, Catálogo Público, Premium
-- Ejecutar en phpMyAdmin → pestaña SQL
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ────────────────────────────────────────────────────────────
-- 1. USUARIOS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `name`          VARCHAR(100) NOT NULL,
  `email`         VARCHAR(255) UNIQUE NOT NULL,
  `password`      VARCHAR(255) NOT NULL,
  `avatar`        VARCHAR(500) DEFAULT NULL,
  `plan`          ENUM('free','starter','pro','enterprise') DEFAULT 'free',
  `active`        TINYINT(1) DEFAULT 1,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 2. EMPRESAS (Perfiles de Empresa)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `businesses` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `owner_id`      INT NOT NULL,
  `name`          VARCHAR(150) NOT NULL,
  `slug`          VARCHAR(100) UNIQUE NOT NULL,   -- Ruta pública /@slug
  `logo`          VARCHAR(500) DEFAULT NULL,
  `description`   TEXT DEFAULT NULL,
  `address`       VARCHAR(300) DEFAULT NULL,
  `phone`         VARCHAR(30) DEFAULT NULL,
  `email`         VARCHAR(255) DEFAULT NULL,
  `website`       VARCHAR(300) DEFAULT NULL,
  `tax_id`        VARCHAR(50) DEFAULT NULL,        -- NIT / RUT / RFC / RIF
  `currency`      VARCHAR(10) DEFAULT 'USD',
  `tax_rate`      DECIMAL(5,2) DEFAULT 0.00,       -- % IVA/impuesto
  `tax_label`     VARCHAR(30) DEFAULT 'IVA',
  `active`        TINYINT(1) DEFAULT 1,
  `catalog_public` TINYINT(1) DEFAULT 0,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_slug`  (`slug`),
  INDEX `idx_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 3. MIEMBROS DE EMPRESA (Roles y Permisos)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `business_members` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `business_id`   INT NOT NULL,
  `user_id`       INT NOT NULL,
  `role`          ENUM('owner','admin','moderator','atc','viewer') DEFAULT 'viewer',
  `permissions`   JSON DEFAULT NULL,   -- overrides granulares
  `invited_by`    INT DEFAULT NULL,
  `status`        ENUM('pending','active','suspended') DEFAULT 'active',
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_member` (`business_id`, `user_id`),
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`)     REFERENCES `users`(`id`)      ON DELETE CASCADE,
  INDEX `idx_business` (`business_id`),
  INDEX `idx_user`     (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 4. CATEGORÍAS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `categories` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `business_id`   INT NOT NULL,
  `name`          VARCHAR(100) NOT NULL,
  `color`         VARCHAR(20) DEFAULT '#6B00FF',
  `icon`          VARCHAR(50) DEFAULT NULL,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_business` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 5. BODEGAS / UBICACIONES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `warehouses` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `business_id`   INT NOT NULL,
  `name`          VARCHAR(150) NOT NULL,
  `description`   TEXT DEFAULT NULL,
  `address`       VARCHAR(300) DEFAULT NULL,
  `active`        TINYINT(1) DEFAULT 1,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_business` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 6. DESCUENTOS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `discounts` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `business_id`   INT NOT NULL,
  `name`          VARCHAR(100) NOT NULL,
  `code`          VARCHAR(50) DEFAULT NULL,        -- Código promocional
  `type`          ENUM('percentage','fixed') DEFAULT 'percentage',
  `value`         DECIMAL(10,2) NOT NULL,
  `min_purchase`  DECIMAL(10,2) DEFAULT 0.00,
  `active`        TINYINT(1) DEFAULT 1,
  `starts_at`     TIMESTAMP DEFAULT NULL,
  `ends_at`       TIMESTAMP DEFAULT NULL,
  `usage_limit`   INT DEFAULT NULL,                -- NULL = ilimitado
  `used_count`    INT DEFAULT 0,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_business` (`business_id`),
  INDEX `idx_code`     (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 7. PRODUCTOS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `products` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `business_id`     INT NOT NULL,
  `name`            VARCHAR(255) NOT NULL,
  `barcode`         VARCHAR(150) DEFAULT NULL,     -- EAN / UPC / QR
  `sku`             VARCHAR(100) DEFAULT NULL,
  `category_id`     INT DEFAULT NULL,
  `warehouse_id`    INT DEFAULT NULL,
  `description`     TEXT DEFAULT NULL,
  `image_url`       VARCHAR(500) DEFAULT NULL,
  `price`           DECIMAL(12,2) DEFAULT 0.00,   -- Precio de venta
  `cost`            DECIMAL(12,2) DEFAULT 0.00,   -- Costo / Precio de compra
  `unit`            VARCHAR(30) DEFAULT 'unidad',  -- unidad, kg, litro, caja…
  `stock`           INT DEFAULT 0,
  `min_stock`       INT DEFAULT 5,
  `discount_id`     INT DEFAULT NULL,
  `featured`        TINYINT(1) DEFAULT 0,          -- Destacado en catálogo
  `catalog_visible` TINYINT(1) DEFAULT 1,          -- Visible en catálogo público
  `active`          TINYINT(1) DEFAULT 1,
  `created_by`      INT DEFAULT NULL,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`)  REFERENCES `businesses`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`category_id`)  REFERENCES `categories`(`id`)  ON DELETE SET NULL,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`)  ON DELETE SET NULL,
  FOREIGN KEY (`discount_id`)  REFERENCES `discounts`(`id`)   ON DELETE SET NULL,
  INDEX `idx_business` (`business_id`),
  INDEX `idx_barcode`  (`barcode`),
  INDEX `idx_sku`      (`sku`),
  INDEX `idx_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 8. CLIENTES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `customers` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `business_id`   INT NOT NULL,
  `name`          VARCHAR(150) NOT NULL,
  `email`         VARCHAR(255) DEFAULT NULL,
  `phone`         VARCHAR(30) DEFAULT NULL,
  `address`       TEXT DEFAULT NULL,
  `tax_id`        VARCHAR(50) DEFAULT NULL,        -- Doc. fiscal del cliente
  `notes`         TEXT DEFAULT NULL,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_business` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 9. FACTURAS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `invoices` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `business_id`      INT NOT NULL,
  `invoice_number`   VARCHAR(50) NOT NULL,
  `customer_id`      INT DEFAULT NULL,
  `customer_name`    VARCHAR(150) DEFAULT 'Consumidor Final',
  `customer_email`   VARCHAR(255) DEFAULT NULL,
  `customer_phone`   VARCHAR(30) DEFAULT NULL,
  `customer_address` TEXT DEFAULT NULL,
  `customer_tax_id`  VARCHAR(50) DEFAULT NULL,
  `subtotal`         DECIMAL(12,2) DEFAULT 0.00,
  `discount_amount`  DECIMAL(12,2) DEFAULT 0.00,
  `tax_amount`       DECIMAL(12,2) DEFAULT 0.00,
  `total`            DECIMAL(12,2) DEFAULT 0.00,
  `payment_method`   ENUM('cash','card','transfer','other') DEFAULT 'cash',
  `status`           ENUM('draft','pending','paid','cancelled','refunded') DEFAULT 'draft',
  `notes`            TEXT DEFAULT NULL,
  `created_by`       INT DEFAULT NULL,
  `paid_at`          TIMESTAMP DEFAULT NULL,
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_invoice_num` (`business_id`, `invoice_number`),
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)  ON DELETE SET NULL,
  INDEX `idx_business` (`business_id`),
  INDEX `idx_status`   (`status`),
  INDEX `idx_created`  (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 10. ÍTEMS DE FACTURA
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id`    INT NOT NULL,
  `product_id`    INT DEFAULT NULL,
  `name`          VARCHAR(255) NOT NULL,
  `quantity`      INT NOT NULL DEFAULT 1,
  `unit_price`    DECIMAL(12,2) NOT NULL,
  `discount_pct`  DECIMAL(5,2) DEFAULT 0.00,
  `subtotal`      DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)  ON DELETE SET NULL,
  INDEX `idx_invoice` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 11. TRANSACCIONES DE INVENTARIO
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `transactions` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `business_id`   INT NOT NULL,
  `product_id`    INT NOT NULL,
  `warehouse_id`  INT DEFAULT NULL,
  `type`          ENUM('INBOUND','OUTBOUND','ADJUSTMENT','SALE','RETURN') NOT NULL,
  `quantity`      INT NOT NULL,
  `unit_price`    DECIMAL(12,2) DEFAULT 0.00,
  `total`         DECIMAL(12,2) DEFAULT 0.00,
  `invoice_id`    INT DEFAULT NULL,
  `notes`         TEXT DEFAULT NULL,
  `created_by`    INT DEFAULT NULL,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`)  REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`)   REFERENCES `products`(`id`)   ON DELETE CASCADE,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`invoice_id`)   REFERENCES `invoices`(`id`)   ON DELETE SET NULL,
  INDEX `idx_business` (`business_id`),
  INDEX `idx_product`  (`product_id`),
  INDEX `idx_type`     (`type`),
  INDEX `idx_created`  (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 12. LÍMITES POR PLAN
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `plan_limits` (
  `plan`                  ENUM('free','starter','pro','enterprise') PRIMARY KEY,
  `max_businesses`        INT DEFAULT 1,
  `max_products`          INT DEFAULT 50,
  `max_members`           INT DEFAULT 1,
  `max_invoices_month`    INT DEFAULT 30,
  `catalog_enabled`       TINYINT(1) DEFAULT 0,
  `analytics_enabled`     TINYINT(1) DEFAULT 0,
  `discounts_enabled`     TINYINT(1) DEFAULT 0,
  `api_access`            TINYINT(1) DEFAULT 0,
  `price_monthly`         DECIMAL(8,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `plan_limits` VALUES
('free',       1,   50,   1,    30,  0, 0, 0, 0,   0.00),
('starter',    2,  200,   3,   150,  1, 0, 1, 0,   9.99),
('pro',        5, 2000,  10,  1000,  1, 1, 1, 1,  29.99),
('enterprise', 999, 999999, 999, 999999, 1, 1, 1, 1, 99.99)
ON DUPLICATE KEY UPDATE `max_businesses` = VALUES(`max_businesses`);

-- ────────────────────────────────────────────────────────────
-- 13. CONTADOR DE FACTURAS POR EMPRESA
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `invoice_sequences` (
  `business_id`   INT PRIMARY KEY,
  `last_number`   INT DEFAULT 0,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DATOS DE EJEMPLO (opcional, comenta si no los necesitas)
-- ============================================================

-- Usuario demo
INSERT IGNORE INTO `users` (`name`, `email`, `password`, `plan`) VALUES
('Admin Demo', 'demo@liquidpos.app', '$2b$10$KIK9M1Cg1hb7N6sMv/7lhOqHJoJ7Rj0LGn5Y/k2Qz.nOE1Vwx.Oy', 'pro');
-- Contraseña: demo123

-- Empresa demo
INSERT IGNORE INTO `businesses` (`owner_id`, `name`, `slug`, `description`, `currency`, `tax_rate`, `catalog_public`)
SELECT id, 'Mi Tienda Demo', 'mi-tienda', 'Tienda de demostración', 'USD', 16.00, 1
FROM `users` WHERE `email` = 'demo@liquidpos.app' LIMIT 1;

-- Miembro owner
INSERT IGNORE INTO `business_members` (`business_id`, `user_id`, `role`, `status`)
SELECT b.id, u.id, 'owner', 'active'
FROM `businesses` b
JOIN `users` u ON u.email = 'demo@liquidpos.app'
WHERE b.slug = 'mi-tienda'
LIMIT 1;

-- Bodega por defecto
INSERT IGNORE INTO `warehouses` (`business_id`, `name`, `description`)
SELECT id, 'Bodega Principal', 'Ubicación principal de productos'
FROM `businesses` WHERE `slug` = 'mi-tienda' LIMIT 1;

-- Categorías de ejemplo
INSERT IGNORE INTO `categories` (`business_id`, `name`, `color`) 
SELECT b.id, cat.name, cat.color FROM `businesses` b
JOIN (SELECT 'Electrónica' as name, '#6B00FF' as color UNION ALL
      SELECT 'Ropa', '#FF66B2' UNION ALL
      SELECT 'Alimentos', '#00C853' UNION ALL
      SELECT 'Hogar', '#FF9800') cat
WHERE b.slug = 'mi-tienda';

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
