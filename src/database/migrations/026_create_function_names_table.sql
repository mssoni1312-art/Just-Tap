-- Migration 026: Function name master data for Create Event dropdown

CREATE TABLE IF NOT EXISTS function_names (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid        CHAR(36)        NOT NULL DEFAULT (UUID()),
  name        VARCHAR(150)    NOT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_function_names_uuid (uuid),
  KEY idx_function_names_name (name),
  KEY idx_function_names_active_sort (is_active, sort_order, name),
  KEY idx_function_names_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
