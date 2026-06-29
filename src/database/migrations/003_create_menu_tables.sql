-- Migration 003: Menu catalog (categories, items, packages)
USE justtap;

CREATE TABLE IF NOT EXISTS menu_categories (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid        CHAR(36)        NOT NULL DEFAULT (UUID()),
  name        VARCHAR(100)    NOT NULL,
  description TEXT            NULL,
  sort_order  INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_menu_categories_uuid (uuid),
  UNIQUE KEY uk_menu_categories_name (name),
  KEY idx_menu_categories_sort (sort_order),
  KEY idx_menu_categories_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_packages (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid       CHAR(36)        NOT NULL DEFAULT (UUID()),
  name       VARCHAR(100)    NOT NULL,
  slug       VARCHAR(100)    NOT NULL,
  type       ENUM('premium', 'silver', 'gold', 'custom') NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_menu_packages_uuid (uuid),
  UNIQUE KEY uk_menu_packages_slug (slug),
  KEY idx_menu_packages_type (type),
  KEY idx_menu_packages_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid           CHAR(36)        NOT NULL DEFAULT (UUID()),
  category_id    BIGINT UNSIGNED NOT NULL,
  name           VARCHAR(150)    NOT NULL,
  description    TEXT            NULL,
  price          DECIMAL(10, 2)  NOT NULL DEFAULT 0.00,
  is_veg         TINYINT(1)      NOT NULL DEFAULT 1,
  image_url      VARCHAR(500)    NULL,
  is_best_seller TINYINT(1)      NOT NULL DEFAULT 0,
  is_active      TINYINT(1)      NOT NULL DEFAULT 1,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_menu_items_uuid (uuid),
  KEY idx_menu_items_category (category_id),
  KEY idx_menu_items_active (is_active),
  KEY idx_menu_items_name (name),
  KEY idx_menu_items_deleted_at (deleted_at),
  CONSTRAINT fk_menu_items_category
    FOREIGN KEY (category_id) REFERENCES menu_categories (id),
  CONSTRAINT chk_menu_items_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_package_items (
  package_id   BIGINT UNSIGNED NOT NULL,
  menu_item_id BIGINT UNSIGNED NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (package_id, menu_item_id),
  KEY idx_mpi_item (menu_item_id),
  CONSTRAINT fk_mpi_package
    FOREIGN KEY (package_id) REFERENCES menu_packages (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpi_item
    FOREIGN KEY (menu_item_id) REFERENCES menu_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
