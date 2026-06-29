-- Migration 006: Live orders (event orders, tables, line items, batches)
USE justtap;

CREATE TABLE IF NOT EXISTS event_orders (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL DEFAULT (UUID()),
  event_id        BIGINT UNSIGNED NOT NULL,
  function_name   VARCHAR(100)    NULL,
  manager_id      BIGINT UNSIGNED NULL,
  total_items     INT UNSIGNED    NOT NULL DEFAULT 0,
  delivered_count INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_orders_uuid (uuid),
  KEY idx_event_orders_event (event_id),
  KEY idx_event_orders_deleted_at (deleted_at),
  CONSTRAINT fk_event_orders_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_event_orders_manager
    FOREIGN KEY (manager_id) REFERENCES staff (id) ON DELETE SET NULL,
  CONSTRAINT chk_event_orders_counts CHECK (delivered_count <= total_items)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_tables (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL DEFAULT (UUID()),
  event_order_id  BIGINT UNSIGNED NOT NULL,
  table_number    INT UNSIGNED    NOT NULL,
  waiter_name     VARCHAR(150)    NULL,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_tables_uuid (uuid),
  UNIQUE KEY uk_order_tables_number (event_order_id, table_number),
  KEY idx_order_tables_order (event_order_id),
  KEY idx_order_tables_deleted_at (deleted_at),
  CONSTRAINT fk_order_tables_order
    FOREIGN KEY (event_order_id) REFERENCES event_orders (id) ON DELETE CASCADE,
  CONSTRAINT chk_order_tables_number CHECK (table_number > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_line_items (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid           CHAR(36)        NOT NULL DEFAULT (UUID()),
  order_table_id BIGINT UNSIGNED NOT NULL,
  menu_item_id   BIGINT UNSIGNED NULL,
  order_ref      VARCHAR(50)     NULL,
  quantity       INT UNSIGNED    NOT NULL DEFAULT 1,
  status         ENUM('pending', 'in_process', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  category       VARCHAR(100)    NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_line_items_uuid (uuid),
  KEY idx_order_line_table (order_table_id),
  KEY idx_order_line_menu_item (menu_item_id),
  KEY idx_order_line_status (status),
  KEY idx_order_line_deleted_at (deleted_at),
  CONSTRAINT fk_order_line_table
    FOREIGN KEY (order_table_id) REFERENCES order_tables (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_line_item
    FOREIGN KEY (menu_item_id) REFERENCES menu_items (id) ON DELETE SET NULL,
  CONSTRAINT chk_order_line_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_item_batches (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid               CHAR(36)        NOT NULL DEFAULT (UUID()),
  order_line_item_id BIGINT UNSIGNED NOT NULL,
  batch_number       INT UNSIGNED    NOT NULL,
  item_count         INT UNSIGNED    NOT NULL DEFAULT 1,
  status             ENUM('pending', 'in_process', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  is_active          TINYINT(1)      NOT NULL DEFAULT 0,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at         DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_batches_uuid (uuid),
  UNIQUE KEY uk_order_batches_line (order_line_item_id, batch_number),
  KEY idx_batches_line_item (order_line_item_id),
  KEY idx_batches_deleted_at (deleted_at),
  CONSTRAINT fk_batches_line_item
    FOREIGN KEY (order_line_item_id) REFERENCES order_line_items (id) ON DELETE CASCADE,
  CONSTRAINT chk_batches_count CHECK (item_count > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
