-- ============================================================
-- LIQUIDPOS — Schema MySQL/MariaDB v1.0
-- Ejecutar: mysql -u root -p < schema.sql
-- ============================================================
CREATE DATABASE IF NOT EXISTS liquidpos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE liquidpos;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  name          VARCHAR(120) NOT NULL,
  avatar_url    VARCHAR(500),
  provider      ENUM('local','google','github') DEFAULT 'local',
  provider_id   VARCHAR(255),
  is_verified   BOOLEAN DEFAULT FALSE,
  verify_token  VARCHAR(100),
  reset_token   VARCHAR(100),
  reset_expires DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS companies (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(80) NOT NULL UNIQUE,
  name            VARCHAR(200) NOT NULL,
  legal_name      VARCHAR(200),
  rif_ruc         VARCHAR(50),
  country         CHAR(2) NOT NULL DEFAULT 'VE',
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  timezone        VARCHAR(60) DEFAULT 'America/Caracas',
  tax_rate        DECIMAL(5,2) DEFAULT 16.00,
  logo_url        VARCHAR(500),
  phone           VARCHAR(30),
  whatsapp        VARCHAR(30),
  address         TEXT,
  plan            ENUM('free','starter','pro','enterprise') DEFAULT 'free',
  plan_expires_at DATETIME,
  is_active       BOOLEAN DEFAULT TRUE,
  settings        JSON,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS company_members (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  role       ENUM('owner','manager','accountant','cashier','waiter','warehouse') NOT NULL,
  rank_label VARCHAR(80),
  is_active  BOOLEAN DEFAULT TRUE,
  joined_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_member (company_id, user_id),
  INDEX idx_company_role (company_id, role),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invitations (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  BIGINT UNSIGNED NOT NULL,
  invited_by  BIGINT UNSIGNED NOT NULL,
  email       VARCHAR(255) NOT NULL,
  role        ENUM('manager','accountant','cashier','waiter','warehouse') NOT NULL,
  rank_label  VARCHAR(80),
  token       VARCHAR(100) NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  accepted_at DATETIME,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS branches (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(120) NOT NULL,
  address    TEXT,
  phone      VARCHAR(30),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_company (company_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  parent_id  BIGINT UNSIGNED,
  name       VARCHAR(120) NOT NULL,
  slug       VARCHAR(120) NOT NULL,
  image_url  VARCHAR(500),
  sort_order SMALLINT DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  INDEX idx_company (company_id),
  UNIQUE KEY uq_cat_slug (company_id, slug),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id)  REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   BIGINT UNSIGNED NOT NULL,
  category_id  BIGINT UNSIGNED,
  sku          VARCHAR(100),
  barcode      VARCHAR(100),
  name         VARCHAR(250) NOT NULL,
  description  TEXT,
  price        DECIMAL(14,4) NOT NULL DEFAULT 0,
  cost         DECIMAL(14,4) DEFAULT 0,
  tax_rate     DECIMAL(5,2),
  unit         VARCHAR(30) DEFAULT 'unit',
  has_variants BOOLEAN DEFAULT FALSE,
  is_combo     BOOLEAN DEFAULT FALSE,
  is_active    BOOLEAN DEFAULT TRUE,
  is_public    BOOLEAN DEFAULT TRUE,
  image_url    VARCHAR(500),
  images       JSON,
  meta         JSON,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company     (company_id),
  INDEX idx_company_sku (company_id, sku),
  INDEX idx_company_bar (company_id, barcode),
  FOREIGN KEY (company_id)  REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_variants (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NOT NULL,
  sku        VARCHAR(100),
  barcode    VARCHAR(100),
  attributes JSON NOT NULL,
  price      DECIMAL(14,4),
  cost       DECIMAL(14,4),
  image_url  VARCHAR(500),
  is_active  BOOLEAN DEFAULT TRUE,
  INDEX idx_product (product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  branch_id  BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED,
  quantity   DECIMAL(14,4) DEFAULT 0,
  min_stock  DECIMAL(14,4) DEFAULT 5,
  max_stock  DECIMAL(14,4),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_stock (company_id, branch_id, product_id, variant_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id)  REFERENCES branches(id)  ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      BIGINT UNSIGNED NOT NULL,
  branch_id       BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NOT NULL,
  variant_id      BIGINT UNSIGNED,
  user_id         BIGINT UNSIGNED NOT NULL,
  type            ENUM('in','out','adjustment','transfer','sale','purchase','return') NOT NULL,
  quantity        DECIMAL(14,4) NOT NULL,
  quantity_before DECIMAL(14,4) NOT NULL,
  quantity_after  DECIMAL(14,4) NOT NULL,
  reason          VARCHAR(250),
  reference_id    BIGINT UNSIGNED,
  reference_type  VARCHAR(50),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_company_product (company_id, product_id),
  INDEX idx_company_date    (company_id, created_at),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (branch_id)  REFERENCES branches(id),
  FOREIGN KEY (user_id)    REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      BIGINT UNSIGNED NOT NULL,
  branch_id       BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  cashier_id      BIGINT UNSIGNED,
  order_number    VARCHAR(30) NOT NULL,
  status          ENUM('draft','pending','paid','cancelled','refunded') DEFAULT 'draft',
  source          ENUM('pos','online','whatsapp','api') DEFAULT 'pos',
  customer_name   VARCHAR(200),
  customer_phone  VARCHAR(30),
  customer_email  VARCHAR(255),
  customer_id_doc VARCHAR(50),
  subtotal        DECIMAL(14,4) NOT NULL DEFAULT 0,
  tax_amount      DECIMAL(14,4) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(14,4) NOT NULL DEFAULT 0,
  total           DECIMAL(14,4) NOT NULL DEFAULT 0,
  notes           TEXT,
  invoice_number  VARCHAR(50),
  invoice_data    JSON,
  paid_at         DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company        (company_id),
  INDEX idx_company_date   (company_id, created_at),
  INDEX idx_company_status (company_id, status),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (branch_id)  REFERENCES branches(id),
  FOREIGN KEY (user_id)    REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id   BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED,
  name       VARCHAR(250) NOT NULL,
  sku        VARCHAR(100),
  quantity   DECIMAL(10,4) NOT NULL,
  unit_price DECIMAL(14,4) NOT NULL,
  cost       DECIMAL(14,4),
  tax_rate   DECIMAL(5,2) DEFAULT 0,
  discount   DECIMAL(14,4) DEFAULT 0,
  subtotal   DECIMAL(14,4) NOT NULL,
  INDEX idx_order   (order_id),
  INDEX idx_product (product_id),
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id   BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NOT NULL,
  method     ENUM('cash','card','transfer','credit','other') NOT NULL,
  amount     DECIMAL(14,4) NOT NULL,
  reference  VARCHAR(200),
  status     ENUM('pending','confirmed','failed') DEFAULT 'confirmed',
  meta       JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order   (order_id),
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suppliers (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(200) NOT NULL,
  rif_ruc    VARCHAR(50),
  phone      VARCHAR(30),
  email      VARCHAR(255),
  address    TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_company (company_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cash_sessions (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   BIGINT UNSIGNED NOT NULL,
  branch_id    BIGINT UNSIGNED NOT NULL,
  cashier_id   BIGINT UNSIGNED NOT NULL,
  opening_cash DECIMAL(14,4) NOT NULL DEFAULT 0,
  closing_cash DECIMAL(14,4),
  status       ENUM('open','closed') DEFAULT 'open',
  opened_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at    DATETIME,
  notes        TEXT,
  INDEX idx_company_branch (company_id, branch_id),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (branch_id)  REFERENCES branches(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS journal_entries (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id     BIGINT UNSIGNED NOT NULL,
  entry_date     DATE NOT NULL,
  description    VARCHAR(500),
  reference_id   BIGINT UNSIGNED,
  reference_type VARCHAR(50),
  debit_account  VARCHAR(20) NOT NULL,
  credit_account VARCHAR(20) NOT NULL,
  amount         DECIMAL(14,4) NOT NULL,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_company_date (company_id, entry_date),
  FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  BIGINT UNSIGNED,
  user_id     BIGINT UNSIGNED,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   BIGINT UNSIGNED,
  old_data    JSON,
  new_data    JSON,
  ip_address  VARCHAR(45),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_company_date (company_id, created_at)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- Demo seed data
INSERT INTO users (name, email, password_hash, is_verified) VALUES
('Admin Demo', 'admin@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6o8JKBeRq.', 1);
-- password: Admin123!

INSERT INTO companies (slug, name, country, currency, tax_rate, whatsapp) VALUES
('demo-store', 'Demo Store', 'VE', 'USD', 16.00, '+584121234567');

INSERT INTO company_members (company_id, user_id, role) VALUES (1, 1, 'owner');
INSERT INTO branches (company_id, name) VALUES (1, 'Principal');

INSERT INTO categories (company_id, name, slug, sort_order) VALUES
(1, 'Bebidas',   'bebidas',   1),
(1, 'Comidas',   'comidas',   2),
(1, 'Postres',   'postres',   3),
(1, 'Snacks',    'snacks',    4);

INSERT INTO products (company_id, category_id, name, sku, price, cost, tax_rate, is_public) VALUES
(1,1,'Café Americano','CAF001',3.50,0.80,16,1),
(1,1,'Cappuccino','CAP001',4.50,1.20,16,1),
(1,1,'Latte','LAT001',4.00,1.00,16,1),
(1,1,'Frappuccino','FRA001',5.50,1.50,16,1),
(1,1,'Agua Mineral','AGU001',1.50,0.30,0,1),
(1,1,'Jugo Natural','JUG001',3.00,0.70,16,1),
(1,2,'Sandwich Club','SAN001',7.00,2.50,16,1),
(1,2,'Wrap Pollo','WRA001',6.50,2.20,16,1),
(1,2,'Ensalada César','ENS001',8.00,3.00,16,1),
(1,3,'Brownie','BRO001',3.50,1.00,16,1),
(1,3,'Cheesecake','CHE001',5.00,1.80,16,1),
(1,4,'Galletas','GAL001',2.00,0.60,16,1),
(1,4,'Chips','CHI001',1.80,0.50,16,1);

INSERT INTO inventory (company_id, branch_id, product_id, quantity, min_stock) VALUES
(1,1,1,50,10),(1,1,2,40,10),(1,1,3,45,10),(1,1,4,30,5),
(1,1,5,100,20),(1,1,6,60,10),(1,1,7,25,5),(1,1,8,20,5),
(1,1,9,15,5),(1,1,10,30,10),(1,1,11,20,5),(1,1,12,50,10),(1,1,13,40,10);
