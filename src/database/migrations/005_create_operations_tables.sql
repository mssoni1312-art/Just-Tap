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
