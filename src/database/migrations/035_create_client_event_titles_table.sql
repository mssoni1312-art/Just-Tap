-- Migration 035: Client event titles (Our Events / Curated Experiences)

CREATE TABLE IF NOT EXISTS client_event_titles (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid        CHAR(36)        NOT NULL DEFAULT (UUID()),
  event_id    BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(150)    NOT NULL,
  sort_order  INT UNSIGNED    NOT NULL DEFAULT 0,
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_by  BIGINT UNSIGNED NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_client_event_titles_uuid (uuid),
  KEY idx_client_event_titles_event (event_id),
  KEY idx_client_event_titles_active_sort (event_id, is_active, sort_order, name),
  KEY idx_client_event_titles_deleted_at (deleted_at),
  CONSTRAINT fk_client_event_titles_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_client_event_titles_user
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_client_event_titles_name
    CHECK (CHAR_LENGTH(TRIM(name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
