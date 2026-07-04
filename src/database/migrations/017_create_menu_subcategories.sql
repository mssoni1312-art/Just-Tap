-- Migration 017: Menu subcategories and planning flow fields
USE justtap;

ALTER TABLE menu_categories
  ADD COLUMN image_url VARCHAR(500) NULL AFTER description,
  ADD COLUMN slogan     VARCHAR(255) NULL AFTER image_url;

CREATE TABLE IF NOT EXISTS menu_subcategories (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid         CHAR(36)        NOT NULL DEFAULT (UUID()),
  category_id  BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(100)    NOT NULL,
  sort_order   INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_menu_subcategories_uuid (uuid),
  UNIQUE KEY uk_menu_subcategories_category_name (category_id, name),
  KEY idx_menu_subcategories_category (category_id),
  KEY idx_menu_subcategories_deleted_at (deleted_at),
  CONSTRAINT fk_menu_subcategories_category
    FOREIGN KEY (category_id) REFERENCES menu_categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE menu_items
  ADD COLUMN subcategory_id BIGINT UNSIGNED NULL AFTER category_id,
  ADD COLUMN slogan          VARCHAR(255)    NULL AFTER description,
  ADD KEY idx_menu_items_subcategory (subcategory_id),
  ADD CONSTRAINT fk_menu_items_subcategory
    FOREIGN KEY (subcategory_id) REFERENCES menu_subcategories (id);
