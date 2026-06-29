-- Migration 004: Inquiries & events
USE justtap;

CREATE TABLE IF NOT EXISTS inquiries (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid               CHAR(36)        NOT NULL DEFAULT (UUID()),
  ref_number         VARCHAR(50)     NOT NULL,
  client_name        VARCHAR(150)    NOT NULL,
  client_phone       VARCHAR(20)     NULL,
  event_date         DATE            NOT NULL,
  time_slot          VARCHAR(50)     NOT NULL,
  venue              VARCHAR(255)    NOT NULL,
  function_name      VARCHAR(150)    NOT NULL,
  package_name       VARCHAR(100)    NOT NULL,
  package_id         BIGINT UNSIGNED NULL,
  capacity           VARCHAR(50)     NOT NULL,
  status             ENUM('pending', 'converted') NOT NULL DEFAULT 'pending',
  converted_event_id BIGINT UNSIGNED NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at         DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_inquiries_uuid (uuid),
  UNIQUE KEY uk_inquiries_ref (ref_number),
  KEY idx_inquiries_status_date (status, event_date),
  KEY idx_inquiries_package (package_id),
  KEY idx_inquiries_deleted_at (deleted_at),
  CONSTRAINT fk_inquiries_package
    FOREIGN KEY (package_id) REFERENCES menu_packages (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid                 CHAR(36)        NOT NULL DEFAULT (UUID()),
  inquiry_id           BIGINT UNSIGNED NULL,
  client_name          VARCHAR(150)    NOT NULL,
  client_mobile        VARCHAR(20)     NULL,
  venue_name           VARCHAR(255)    NOT NULL,
  city_name            VARCHAR(100)    NOT NULL,
  inquiry_date         DATE            NULL,
  start_date           DATE            NOT NULL,
  end_date             DATE            NOT NULL,
  event_function_name  VARCHAR(150)    NULL,
  status               ENUM('inquiry', 'confirmed', 'cancelled', 'r_menu', 'live') NOT NULL DEFAULT 'inquiry',
  package_id           BIGINT UNSIGNED NULL,
  assigned_manager_id  BIGINT UNSIGNED NULL,
  is_live              TINYINT(1)      NOT NULL DEFAULT 0,
  created_by           BIGINT UNSIGNED NULL,
  created_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at           DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_events_uuid (uuid),
  KEY idx_events_status_start (status, start_date),
  KEY idx_events_date_range (start_date, end_date),
  KEY idx_events_manager (assigned_manager_id),
  KEY idx_events_inquiry (inquiry_id),
  KEY idx_events_package (package_id),
  KEY idx_events_live (is_live),
  KEY idx_events_deleted_at (deleted_at),
  CONSTRAINT fk_events_inquiry
    FOREIGN KEY (inquiry_id) REFERENCES inquiries (id) ON DELETE SET NULL,
  CONSTRAINT fk_events_package
    FOREIGN KEY (package_id) REFERENCES menu_packages (id) ON DELETE SET NULL,
  CONSTRAINT fk_events_manager
    FOREIGN KEY (assigned_manager_id) REFERENCES staff (id) ON DELETE SET NULL,
  CONSTRAINT fk_events_created_by
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_events_date_range CHECK (end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Circular FK: inquiries.converted_event_id -> events (idempotent for re-runs)
SET @fk_inquiries_event_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'inquiries'
    AND CONSTRAINT_NAME = 'fk_inquiries_event'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @add_fk_inquiries_event = IF(
  @fk_inquiries_event_exists = 0,
  'ALTER TABLE inquiries ADD CONSTRAINT fk_inquiries_event FOREIGN KEY (converted_event_id) REFERENCES events (id) ON DELETE SET NULL',
  'SELECT 1'
);

PREPARE stmt_fk_inquiries_event FROM @add_fk_inquiries_event;
EXECUTE stmt_fk_inquiries_event;
DEALLOCATE PREPARE stmt_fk_inquiries_event;

CREATE TABLE IF NOT EXISTS event_functions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)        NOT NULL DEFAULT (UUID()),
  event_id      BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(150)    NOT NULL,
  venue         VARCHAR(255)    NULL,
  function_date DATE            NULL,
  start_time    TIME            NULL,
  end_time      TIME            NULL,
  pax           INT UNSIGNED    NULL,
  rate          DECIMAL(12, 2)  NULL,
  sort_order    INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_functions_uuid (uuid),
  KEY idx_event_functions_event (event_id),
  KEY idx_event_functions_date (function_date),
  KEY idx_event_functions_deleted_at (deleted_at),
  CONSTRAINT fk_event_functions_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT chk_event_functions_pax CHECK (pax IS NULL OR pax > 0),
  CONSTRAINT chk_event_functions_rate CHECK (rate IS NULL OR rate >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_menu_selections (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id     BIGINT UNSIGNED NOT NULL,
  menu_item_id BIGINT UNSIGNED NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_menu (event_id, menu_item_id),
  KEY idx_ems_menu_item (menu_item_id),
  CONSTRAINT fk_ems_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_ems_item
    FOREIGN KEY (menu_item_id) REFERENCES menu_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
