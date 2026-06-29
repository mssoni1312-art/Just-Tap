-- Migration 002: Staff (event managers, waiters)
USE justtap;

CREATE TABLE IF NOT EXISTS staff (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid       CHAR(36)        NOT NULL DEFAULT (UUID()),
  name       VARCHAR(150)    NOT NULL,
  role       ENUM('event_manager', 'waiter', 'captain', 'other') NOT NULL DEFAULT 'event_manager',
  is_active  TINYINT(1)      NOT NULL DEFAULT 1,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_staff_uuid (uuid),
  KEY idx_staff_role_active (role, is_active),
  KEY idx_staff_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
