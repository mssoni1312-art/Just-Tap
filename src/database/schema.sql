-- Migration 000: Create database
CREATE DATABASE IF NOT EXISTS justtap
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE justtap;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Migration 001: Authentication & user preferences
USE justtap;

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)        NOT NULL DEFAULT (UUID()),
  email         VARCHAR(255)    NOT NULL,
  phone         VARCHAR(20)     NULL,
  password_hash VARCHAR(255)    NOT NULL,
  first_name    VARCHAR(100)    NOT NULL,
  last_name     VARCHAR(100)    NOT NULL,
  handle        VARCHAR(100)    NULL,
  avatar_url    VARCHAR(500)    NULL,
  role          ENUM('super_admin') NOT NULL DEFAULT 'super_admin',
  status        ENUM('active', 'inactive', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  last_login_at DATETIME        NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_uuid (uuid),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_phone (phone),
  KEY idx_users_role_status (role, status),
  KEY idx_users_deleted_at (deleted_at),
  CONSTRAINT chk_users_role CHECK (role = 'super_admin')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255)    NOT NULL,
  expires_at DATETIME        NOT NULL,
  revoked_at DATETIME        NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_refresh_token_hash (token_hash),
  KEY idx_refresh_user_revoked (user_id, revoked_at),
  KEY idx_refresh_expires (expires_at),
  CONSTRAINT fk_refresh_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255)    NOT NULL,
  expires_at DATETIME        NOT NULL,
  used_at    DATETIME        NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_password_reset_hash (token_hash),
  KEY idx_password_reset_user (user_id),
  KEY idx_password_reset_expires (expires_at),
  CONSTRAINT fk_password_reset_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS otp_verifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identifier VARCHAR(255)    NOT NULL,
  code_hash  VARCHAR(255)    NOT NULL,
  expires_at DATETIME        NOT NULL,
  verified_at DATETIME       NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_otp_identifier_expires (identifier, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id                BIGINT UNSIGNED NOT NULL,
  push_enabled           TINYINT(1)      NOT NULL DEFAULT 1,
  email_alerts_enabled   TINYINT(1)      NOT NULL DEFAULT 1,
  dark_mode_enabled      TINYINT(1)      NOT NULL DEFAULT 1,
  onboarding_completed   TINYINT(1)      NOT NULL DEFAULT 0,
  created_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_preferences_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Migration 005: Table assignments & tasks
USE justtap;

CREATE TABLE IF NOT EXISTS event_table_assignments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL DEFAULT (UUID()),
  event_id        BIGINT UNSIGNED NOT NULL,
  table_number    INT UNSIGNED    NOT NULL,
  allocation_type ENUM('dining', 'captain') NOT NULL DEFAULT 'dining',
  user_code       VARCHAR(50)     NULL,
  description     TEXT            NULL,
  event_label     VARCHAR(255)    NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_table_alloc (event_id, table_number, allocation_type),
  KEY idx_eta_event (event_id),
  KEY idx_eta_deleted_at (deleted_at),
  CONSTRAINT fk_eta_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT chk_eta_table_number CHECK (table_number > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task_templates (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid        CHAR(36)        NOT NULL DEFAULT (UUID()),
  name        VARCHAR(150)    NOT NULL,
  description TEXT            NULL,
  category    VARCHAR(100)    NULL,
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_task_templates_uuid (uuid),
  KEY idx_task_templates_category (category),
  KEY idx_task_templates_active (is_active),
  KEY idx_task_templates_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_tasks (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid             CHAR(36)        NOT NULL DEFAULT (UUID()),
  event_id         BIGINT UNSIGNED NOT NULL,
  task_template_id BIGINT UNSIGNED NULL,
  title            VARCHAR(150)    NOT NULL,
  description      TEXT            NULL,
  status           ENUM('pending', 'assigned', 'in_progress', 'completed', 'overdue') NOT NULL DEFAULT 'pending',
  assigned_to      BIGINT UNSIGNED NULL,
  due_date         DATE            NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_tasks_uuid (uuid),
  KEY idx_event_tasks_event (event_id),
  KEY idx_event_tasks_status (status),
  KEY idx_event_tasks_due (due_date),
  KEY idx_event_tasks_assigned (assigned_to),
  KEY idx_event_tasks_deleted_at (deleted_at),
  CONSTRAINT fk_event_tasks_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_event_tasks_template
    FOREIGN KEY (task_template_id) REFERENCES task_templates (id) ON DELETE SET NULL,
  CONSTRAINT fk_event_tasks_staff
    FOREIGN KEY (assigned_to) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Migration 007: Feedback, content pages, uploads, activity logs
USE justtap;

CREATE TABLE IF NOT EXISTS feedback_reviews (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid        CHAR(36)        NOT NULL DEFAULT (UUID()),
  event_id    BIGINT UNSIGNED NOT NULL,
  client_name VARCHAR(150)    NOT NULL,
  rating      DECIMAL(2, 1)   NOT NULL,
  comment     TEXT            NULL,
  table_no    VARCHAR(20)     NULL,
  sentiment   ENUM('HAPPY', 'NEUTRAL', 'UNHAPPY') NOT NULL DEFAULT 'HAPPY',
  reply_text  TEXT            NULL,
  replied_at  DATETIME        NULL,
  is_flagged  TINYINT(1)      NOT NULL DEFAULT 0,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_feedback_uuid (uuid),
  KEY idx_feedback_event (event_id),
  KEY idx_feedback_rating (rating),
  KEY idx_feedback_flagged (is_flagged),
  KEY idx_feedback_deleted_at (deleted_at),
  CONSTRAINT fk_feedback_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT chk_feedback_rating CHECK (rating >= 1.0 AND rating <= 5.0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_pages (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_key   VARCHAR(50)     NOT NULL,
  content    JSON            NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_content_page_key (page_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS uploads (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)        NOT NULL DEFAULT (UUID()),
  user_id       BIGINT UNSIGNED NULL,
  original_name VARCHAR(255)    NOT NULL,
  stored_name   VARCHAR(255)    NOT NULL,
  mime_type     VARCHAR(100)    NOT NULL,
  size_bytes    INT UNSIGNED    NOT NULL,
  upload_type   ENUM('avatar', 'image', 'document') NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_uploads_uuid (uuid),
  KEY idx_uploads_user (user_id),
  KEY idx_uploads_type (upload_type),
  KEY idx_uploads_deleted_at (deleted_at),
  CONSTRAINT fk_uploads_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_uploads_size CHECK (size_bytes > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id    BIGINT UNSIGNED NULL,
  user_id     BIGINT UNSIGNED NULL,
  action      VARCHAR(100)    NOT NULL,
  description TEXT            NULL,
  metadata    JSON            NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_event (event_id),
  KEY idx_activity_user (user_id),
  KEY idx_activity_action (action),
  KEY idx_activity_created (created_at),
  CONSTRAINT fk_activity_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE SET NULL,
  CONSTRAINT fk_activity_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration 008: Read-optimized views for Super Admin mobile screens
USE justtap;

-- Home / Events tab: event list with relations
CREATE OR REPLACE VIEW v_events_list AS
SELECT
  e.id,
  e.uuid,
  e.client_name,
  e.client_mobile,
  e.venue_name,
  e.city_name,
  e.inquiry_date,
  e.start_date,
  e.end_date,
  e.event_function_name,
  e.status,
  e.is_live,
  e.package_id,
  mp.name   AS package_name,
  mp.type   AS package_type,
  e.assigned_manager_id,
  s.name    AS manager_name,
  e.inquiry_id,
  e.created_by,
  e.created_at,
  e.updated_at
FROM events e
LEFT JOIN menu_packages mp ON mp.id = e.package_id AND mp.deleted_at IS NULL
LEFT JOIN staff s ON s.id = e.assigned_manager_id AND s.deleted_at IS NULL
WHERE e.deleted_at IS NULL;

-- Calendar markers: one row per event date + status
CREATE OR REPLACE VIEW v_events_calendar AS
SELECT
  e.id          AS event_id,
  e.uuid        AS event_uuid,
  e.start_date  AS event_date,
  e.status,
  e.is_live,
  e.client_name,
  e.venue_name
FROM events e
WHERE e.deleted_at IS NULL;

-- Inquiry tab: pending inquiries with optional package link
CREATE OR REPLACE VIEW v_inquiries_pending AS
SELECT
  i.id,
  i.uuid,
  i.ref_number,
  i.client_name,
  i.client_phone,
  i.event_date,
  i.time_slot,
  i.venue,
  i.function_name,
  i.package_name,
  i.package_id,
  mp.slug AS package_slug,
  i.capacity,
  i.status,
  i.converted_event_id,
  e.uuid  AS converted_event_uuid,
  i.created_at
FROM inquiries i
LEFT JOIN menu_packages mp ON mp.id = i.package_id AND mp.deleted_at IS NULL
LEFT JOIN events e ON e.id = i.converted_event_id AND e.deleted_at IS NULL
WHERE i.deleted_at IS NULL AND i.status = 'pending';

-- Tasks screen: KPI summary
CREATE OR REPLACE VIEW v_task_summary AS
SELECT
  COUNT(*) AS total_tasks,
  SUM(CASE WHEN due_date = CURDATE() AND status NOT IN ('completed') THEN 1 ELSE 0 END) AS today_tasks,
  SUM(CASE WHEN status = 'overdue' OR (due_date < CURDATE() AND status NOT IN ('completed')) THEN 1 ELSE 0 END) AS overdue_tasks,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
FROM event_tasks
WHERE deleted_at IS NULL;

-- Feedback screen: per-event rating summary
CREATE OR REPLACE VIEW v_feedback_summary AS
SELECT
  event_id,
  ROUND(AVG(rating), 1) AS avg_rating,
  COUNT(*)              AS review_count,
  SUM(CASE WHEN is_flagged = 1 THEN 1 ELSE 0 END) AS flagged_count
FROM feedback_reviews
WHERE deleted_at IS NULL
GROUP BY event_id;

-- Menu Category screen: categories with live item counts
CREATE OR REPLACE VIEW v_menu_categories_with_counts AS
SELECT
  mc.id,
  mc.uuid,
  mc.name,
  mc.description,
  mc.sort_order,
  COUNT(mi.id) AS item_count
FROM menu_categories mc
LEFT JOIN menu_items mi ON mi.category_id = mc.id AND mi.deleted_at IS NULL AND mi.is_active = 1
WHERE mc.deleted_at IS NULL
GROUP BY mc.id, mc.uuid, mc.name, mc.description, mc.sort_order;

-- Order overview: event order with manager
CREATE OR REPLACE VIEW v_event_orders_overview AS
SELECT
  eo.id,
  eo.uuid,
  eo.event_id,
  ev.uuid AS event_uuid,
  eo.function_name,
  eo.manager_id,
  s.name  AS manager_name,
  eo.total_items,
  eo.delivered_count,
  eo.created_at,
  eo.updated_at
FROM event_orders eo
JOIN events ev ON ev.id = eo.event_id AND ev.deleted_at IS NULL
LEFT JOIN staff s ON s.id = eo.manager_id AND s.deleted_at IS NULL
WHERE eo.deleted_at IS NULL;

-- Migration 009: Triggers for data integrity
USE justtap;

DELIMITER $$

-- Anonymize email on user soft-delete to allow re-registration
DROP TRIGGER IF EXISTS trg_users_before_soft_delete$$
CREATE TRIGGER trg_users_before_soft_delete
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    SET NEW.email = CONCAT(OLD.email, '.deleted.', OLD.id);
    IF OLD.phone IS NOT NULL THEN
      SET NEW.phone = CONCAT(OLD.phone, '.d', OLD.id);
    END IF;
    SET NEW.status = 'inactive';
  END IF;
END$$

-- Keep event_orders totals in sync with line items
DROP TRIGGER IF EXISTS trg_order_line_items_after_insert$$
CREATE TRIGGER trg_order_line_items_after_insert
AFTER INSERT ON order_line_items
FOR EACH ROW
BEGIN
  DECLARE v_order_id BIGINT UNSIGNED;
  DECLARE v_event_order_id BIGINT UNSIGNED;

  SELECT ot.event_order_id INTO v_event_order_id
  FROM order_tables ot
  WHERE ot.id = NEW.order_table_id;

  UPDATE event_orders eo
  SET
    total_items = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id AND oli.deleted_at IS NULL
    ),
    delivered_count = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id
        AND oli.deleted_at IS NULL
        AND oli.status = 'delivered'
    ),
    updated_at = NOW()
  WHERE eo.id = v_event_order_id;
END$$

DROP TRIGGER IF EXISTS trg_order_line_items_after_update$$
CREATE TRIGGER trg_order_line_items_after_update
AFTER UPDATE ON order_line_items
FOR EACH ROW
BEGIN
  DECLARE v_event_order_id BIGINT UNSIGNED;

  SELECT ot.event_order_id INTO v_event_order_id
  FROM order_tables ot
  WHERE ot.id = NEW.order_table_id;

  UPDATE event_orders eo
  SET
    total_items = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id AND oli.deleted_at IS NULL
    ),
    delivered_count = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id
        AND oli.deleted_at IS NULL
        AND oli.status = 'delivered'
    ),
    updated_at = NOW()
  WHERE eo.id = v_event_order_id;
END$$

DROP TRIGGER IF EXISTS trg_order_line_items_after_delete$$
CREATE TRIGGER trg_order_line_items_after_delete
AFTER DELETE ON order_line_items
FOR EACH ROW
BEGIN
  DECLARE v_event_order_id BIGINT UNSIGNED;

  SELECT ot.event_order_id INTO v_event_order_id
  FROM order_tables ot
  WHERE ot.id = OLD.order_table_id;

  UPDATE event_orders eo
  SET
    total_items = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id AND oli.deleted_at IS NULL
    ),
    delivered_count = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id
        AND oli.deleted_at IS NULL
        AND oli.status = 'delivered'
    ),
    updated_at = NOW()
  WHERE eo.id = v_event_order_id;
END$$

-- Auto-mark overdue tasks when due_date passes
DROP TRIGGER IF EXISTS trg_event_tasks_before_update$$
CREATE TRIGGER trg_event_tasks_before_update
BEFORE UPDATE ON event_tasks
FOR EACH ROW
BEGIN
  IF NEW.due_date < CURDATE()
     AND NEW.status NOT IN ('completed', 'overdue')
     AND NEW.deleted_at IS NULL THEN
    SET NEW.status = 'overdue';
  END IF;
END$$

DELIMITER ;

-- Migration 010: Re-enable foreign key checks
USE justtap;

SET FOREIGN_KEY_CHECKS = 1;

