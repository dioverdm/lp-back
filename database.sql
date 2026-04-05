-- ============================================================================
-- LIQUIDPOS - SISTEMA COMPLETO DE GESTIÓN EMPRESARIAL
-- Version: 2.0 - Arquitectura Multi-Empresa con Facturación
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS `liquidpos` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `liquidpos`;

-- ============================================================================
-- TABLA 1: USUARIOS (Usuarios principales del sistema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `email_verified` BOOLEAN DEFAULT FALSE,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 2: PLANES DE SUSCRIPCIÓN
-- ============================================================================
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(50) UNIQUE NOT NULL,
  `description` TEXT,
  `price_monthly` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `price_yearly` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `max_companies` INT DEFAULT 1,
  `max_products` INT DEFAULT 50,
  `max_users_per_company` INT DEFAULT 1,
  `max_invoices_per_month` INT DEFAULT 20,
  `features` JSON DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar planes por defecto
INSERT INTO `subscription_plans` (`name`, `slug`, `description`, `price_monthly`, `price_yearly`, `max_companies`, `max_products`, `max_users_per_company`, `max_invoices_per_month`, `features`) VALUES
('Gratis', 'free', 'Plan gratuito para comenzar', 0.00, 0.00, 1, 50, 1, 20, '{"catalog": false, "barcode_scanner": true, "reports": "basic", "multi_location": false, "discount_system": false}'),
('Básico', 'basic', 'Para pequeños negocios', 9.99, 99.90, 2, 500, 3, 100, '{"catalog": true, "barcode_scanner": true, "reports": "advanced", "multi_location": true, "discount_system": true}'),
('Pro', 'pro', 'Para negocios en crecimiento', 24.99, 249.90, 5, 5000, 10, 500, '{"catalog": true, "barcode_scanner": true, "reports": "advanced", "multi_location": true, "discount_system": true, "api_access": true}'),
('Enterprise', 'enterprise', 'Para grandes empresas', 99.99, 999.90, 999, 999999, 100, 99999, '{"catalog": true, "barcode_scanner": true, "reports": "advanced", "multi_location": true, "discount_system": true, "api_access": true, "priority_support": true, "custom_branding": true}');

-- ============================================================================
-- TABLA 3: SUSCRIPCIONES DE USUARIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `user_subscriptions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `plan_id` INT UNSIGNED NOT NULL,
  `status` ENUM('active', 'canceled', 'expired', 'trial') DEFAULT 'trial',
  `billing_cycle` ENUM('monthly', 'yearly') DEFAULT 'monthly',
  `current_period_start` TIMESTAMP NULL DEFAULT NULL,
  `current_period_end` TIMESTAMP NULL DEFAULT NULL,
  `trial_ends_at` TIMESTAMP NULL DEFAULT NULL,
  `canceled_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 4: EMPRESAS (Múltiples empresas por usuario)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `companies` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `owner_id` INT UNSIGNED NOT NULL,
  `slug` VARCHAR(100) UNIQUE NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `legal_name` VARCHAR(255) DEFAULT NULL,
  `tax_id` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT 'Colombia',
  `postal_code` VARCHAR(20) DEFAULT NULL,
  `logo_url` VARCHAR(500) DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `currency` VARCHAR(3) DEFAULT 'COP',
  `timezone` VARCHAR(50) DEFAULT 'America/Bogota',
  `is_active` BOOLEAN DEFAULT TRUE,
  `catalog_enabled` BOOLEAN DEFAULT FALSE,
  `catalog_public` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_slug` (`slug`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 5: ROLES (Definición de roles del sistema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) UNIQUE NOT NULL,
  `slug` VARCHAR(50) UNIQUE NOT NULL,
  `description` TEXT DEFAULT NULL,
  `permissions` JSON DEFAULT NULL,
  `is_system` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar roles del sistema
INSERT INTO `roles` (`name`, `slug`, `description`, `permissions`, `is_system`) VALUES
('Propietario', 'owner', 'Control total sobre la empresa', '{"all": true}', TRUE),
('Administrador', 'admin', 'Gestión completa excepto eliminación de empresa', '{"products": ["create", "read", "update", "delete"], "inventory": ["create", "read", "update", "delete"], "billing": ["create", "read", "update", "delete"], "reports": ["read"], "users": ["create", "read", "update", "delete"], "settings": ["read", "update"]}', TRUE),
('Gerente', 'manager', 'Gestión de inventario y reportes', '{"products": ["create", "read", "update"], "inventory": ["create", "read", "update"], "billing": ["read"], "reports": ["read"]}', TRUE),
('Vendedor', 'seller', 'Solo facturación y consulta de inventario', '{"products": ["read"], "inventory": ["read"], "billing": ["create", "read"]}', TRUE),
('Atención al Cliente', 'support', 'Solo facturación', '{"billing": ["create", "read"]}', TRUE),
('Contador', 'accountant', 'Acceso a facturación y reportes', '{"billing": ["read"], "reports": ["read"]}', TRUE),
('Bodeguero', 'warehouse', 'Solo gestión de inventario', '{"products": ["read"], "inventory": ["create", "read", "update"]}', TRUE);

-- ============================================================================
-- TABLA 6: MIEMBROS DE EMPRESA (Usuarios invitados a empresas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `company_members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role_id` INT UNSIGNED NOT NULL,
  `status` ENUM('active', 'invited', 'suspended') DEFAULT 'invited',
  `invited_by` INT UNSIGNED DEFAULT NULL,
  `invited_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `joined_at` TIMESTAMP NULL DEFAULT NULL,
  `last_activity` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_company_user` (`company_id`, `user_id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 7: UBICACIONES/SUCURSALES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `locations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `is_main` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 8: CATEGORÍAS DE PRODUCTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `parent_id` INT UNSIGNED DEFAULT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_slug` (`slug`),
  INDEX `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 9: PRODUCTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT UNSIGNED NOT NULL,
  `category_id` INT UNSIGNED DEFAULT NULL,
  `location_id` INT UNSIGNED DEFAULT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `barcode` VARCHAR(100) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `cost_price` DECIMAL(12,2) DEFAULT 0.00,
  `sale_price` DECIMAL(12,2) NOT NULL,
  `quantity` INT DEFAULT 0,
  `min_stock` INT DEFAULT 10,
  `max_stock` INT DEFAULT NULL,
  `unit` VARCHAR(20) DEFAULT 'unidad',
  `weight` DECIMAL(10,2) DEFAULT NULL,
  `weight_unit` VARCHAR(10) DEFAULT 'kg',
  `tax_rate` DECIMAL(5,2) DEFAULT 0.00,
  `discount_enabled` BOOLEAN DEFAULT FALSE,
  `discount_type` ENUM('percentage', 'fixed') DEFAULT 'percentage',
  `discount_value` DECIMAL(10,2) DEFAULT 0.00,
  `is_active` BOOLEAN DEFAULT TRUE,
  `show_in_catalog` BOOLEAN DEFAULT TRUE,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_company_sku` (`company_id`, `sku`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_category_id` (`category_id`),
  INDEX `idx_sku` (`sku`),
  INDEX `idx_barcode` (`barcode`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_show_in_catalog` (`show_in_catalog`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 10: TRANSACCIONES DE INVENTARIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `type` ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'DAMAGED') NOT NULL,
  `quantity_change` INT NOT NULL,
  `quantity_before` INT NOT NULL,
  `quantity_after` INT NOT NULL,
  `from_location_id` INT UNSIGNED DEFAULT NULL,
  `to_location_id` INT UNSIGNED DEFAULT NULL,
  `reference_type` ENUM('purchase', 'sale', 'adjustment', 'transfer', 'return') DEFAULT NULL,
  `reference_id` INT UNSIGNED DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`from_location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`to_location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL,
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 11: CLIENTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT UNSIGNED NOT NULL,
  `customer_type` ENUM('individual', 'business') DEFAULT 'individual',
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `tax_id` VARCHAR(50) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `postal_code` VARCHAR(20) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `credit_limit` DECIMAL(12,2) DEFAULT 0.00,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 12: FACTURAS/PEDIDOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT UNSIGNED NOT NULL,
  `customer_id` INT UNSIGNED DEFAULT NULL,
  `created_by` INT UNSIGNED NOT NULL,
  `invoice_number` VARCHAR(50) NOT NULL,
  `invoice_type` ENUM('sale', 'quote', 'order') DEFAULT 'sale',
  `status` ENUM('draft', 'pending', 'paid', 'partial', 'canceled', 'refunded') DEFAULT 'draft',
  `payment_method` ENUM('cash', 'card', 'transfer', 'credit', 'other') DEFAULT 'cash',
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `paid_amount` DECIMAL(12,2) DEFAULT 0.00,
  `change_amount` DECIMAL(12,2) DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `customer_name` VARCHAR(255) DEFAULT NULL,
  `customer_tax_id` VARCHAR(50) DEFAULT NULL,
  `customer_email` VARCHAR(255) DEFAULT NULL,
  `customer_phone` VARCHAR(20) DEFAULT NULL,
  `issued_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `due_date` DATE DEFAULT NULL,
  `paid_at` TIMESTAMP NULL DEFAULT NULL,
  `canceled_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  UNIQUE KEY `unique_company_invoice` (`company_id`, `invoice_number`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_issued_at` (`issued_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 13: ITEMS DE FACTURA
-- ============================================================================
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED DEFAULT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `product_sku` VARCHAR(100) DEFAULT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `discount_type` ENUM('percentage', 'fixed') DEFAULT NULL,
  `discount_value` DECIMAL(10,2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) DEFAULT 0.00,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `total` DECIMAL(12,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL,
  INDEX `idx_invoice_id` (`invoice_id`),
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 14: PAGOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT UNSIGNED NOT NULL,
  `invoice_id` INT UNSIGNED NOT NULL,
  `payment_method` ENUM('cash', 'card', 'transfer', 'credit', 'other') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `reference` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `processed_by` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`processed_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_invoice_id` (`invoice_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 15: CONFIGURACIÓN DE IMPRESORAS FISCALES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `printer_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `printer_type` ENUM('thermal', 'fiscal', 'standard') DEFAULT 'thermal',
  `connection_type` ENUM('usb', 'network', 'bluetooth') DEFAULT 'usb',
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `port` INT DEFAULT NULL,
  `paper_width` INT DEFAULT 80,
  `is_default` BOOLEAN DEFAULT FALSE,
  `settings` JSON DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  INDEX `idx_company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 16: ACTIVIDAD/LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT UNSIGNED DEFAULT NULL,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) DEFAULT NULL,
  `entity_id` INT UNSIGNED DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 17: SESIONES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `expires` BIGINT NOT NULL,
  `data` TEXT,
  INDEX `idx_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 18: NOTIFICACIONES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `company_id` INT UNSIGNED DEFAULT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `action_url` VARCHAR(500) DEFAULT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `read_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de inventario con valores
CREATE OR REPLACE VIEW `v_inventory_value` AS
SELECT 
  p.company_id,
  p.id as product_id,
  p.name as product_name,
  p.sku,
  p.quantity,
  p.cost_price,
  p.sale_price,
  (p.quantity * p.cost_price) as inventory_cost_value,
  (p.quantity * p.sale_price) as inventory_sale_value,
  c.name as category_name,
  l.name as location_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN locations l ON p.location_id = l.id
WHERE p.is_active = TRUE;

-- Vista de productos con bajo stock
CREATE OR REPLACE VIEW `v_low_stock_products` AS
SELECT 
  p.company_id,
  p.id,
  p.name,
  p.sku,
  p.quantity,
  p.min_stock,
  c.name as company_name
FROM products p
JOIN companies c ON p.company_id = c.id
WHERE p.quantity <= p.min_stock 
  AND p.quantity > 0 
  AND p.is_active = TRUE;

-- Vista de ventas diarias
CREATE OR REPLACE VIEW `v_daily_sales` AS
SELECT 
  i.company_id,
  DATE(i.issued_at) as sale_date,
  COUNT(*) as total_invoices,
  SUM(i.total_amount) as total_sales,
  SUM(i.tax_amount) as total_tax,
  SUM(i.paid_amount) as total_collected
FROM invoices i
WHERE i.status IN ('paid', 'partial')
GROUP BY i.company_id, DATE(i.issued_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para crear ubicación por defecto al crear empresa
DELIMITER $$
CREATE TRIGGER `after_company_insert` 
AFTER INSERT ON `companies`
FOR EACH ROW
BEGIN
  INSERT INTO locations (company_id, name, description, is_main, is_active)
  VALUES (NEW.id, 'Ubicación Principal', 'Ubicación por defecto', TRUE, TRUE);
END$$

-- Trigger para asignar rol de propietario al crear empresa
CREATE TRIGGER `after_company_insert_owner` 
AFTER INSERT ON `companies`
FOR EACH ROW
BEGIN
  INSERT INTO company_members (company_id, user_id, role_id, status, joined_at)
  VALUES (NEW.id, NEW.owner_id, (SELECT id FROM roles WHERE slug = 'owner'), 'active', CURRENT_TIMESTAMP);
END$$

-- Trigger para actualizar cantidad después de agregar item de factura
CREATE TRIGGER `after_invoice_item_insert` 
AFTER INSERT ON `invoice_items`
FOR EACH ROW
BEGIN
  DECLARE v_invoice_type VARCHAR(20);
  DECLARE v_company_id INT;
  
  SELECT invoice_type, company_id INTO v_invoice_type, v_company_id
  FROM invoices WHERE id = NEW.invoice_id;
  
  IF v_invoice_type = 'sale' AND NEW.product_id IS NOT NULL THEN
    UPDATE products 
    SET quantity = quantity - NEW.quantity 
    WHERE id = NEW.product_id;
    
    INSERT INTO inventory_transactions (
      company_id, product_id, user_id, type, quantity_change, 
      quantity_before, quantity_after, reference_type, reference_id
    )
    SELECT 
      v_company_id, NEW.product_id, 
      (SELECT created_by FROM invoices WHERE id = NEW.invoice_id),
      'OUT', -NEW.quantity,
      quantity + NEW.quantity, quantity,
      'sale', NEW.invoice_id
    FROM products WHERE id = NEW.product_id;
  END IF;
END$$

-- Trigger para registrar actividad al crear factura
CREATE TRIGGER `after_invoice_insert_log` 
AFTER INSERT ON `invoices`
FOR EACH ROW
BEGIN
  INSERT INTO activity_logs (company_id, user_id, action, entity_type, entity_id, description)
  VALUES (NEW.company_id, NEW.created_by, 'invoice_created', 'invoice', NEW.id, 
          CONCAT('Factura ', NEW.invoice_number, ' creada por $', NEW.total_amount));
END$$

DELIMITER ;

-- ============================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================================================

ALTER TABLE `products` ADD FULLTEXT INDEX `ft_product_search` (`name`, `description`);
ALTER TABLE `customers` ADD FULLTEXT INDEX `ft_customer_search` (`name`, `email`, `phone`);
ALTER TABLE `invoices` ADD INDEX `idx_invoice_number` (`invoice_number`);
ALTER TABLE `invoices` ADD INDEX `idx_payment_method` (`payment_method`);

COMMIT;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
