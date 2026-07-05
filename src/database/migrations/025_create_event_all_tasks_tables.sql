-- Migration 025: Manager "All Tasks" screen progress per event

CREATE TABLE IF NOT EXISTS event_all_tasks (
  id                              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id                        BIGINT UNSIGNED NOT NULL,
  status                          ENUM('in_progress', 'completed', 'abandoned') NOT NULL DEFAULT 'in_progress',
  actual_arrival_time             TIME            NULL,
  followers_achieved_count        INT UNSIGNED    NOT NULL DEFAULT 0,
  testimonial_reels_achieved_count INT UNSIGNED   NOT NULL DEFAULT 0,
  active_session_recording        TINYINT(1)      NOT NULL DEFAULT 0,
  number_of_video_shoots          INT UNSIGNED    NOT NULL DEFAULT 0,
  main_event_highlights           TINYINT(1)      NOT NULL DEFAULT 0,
  photos_captured                 INT UNSIGNED    NOT NULL DEFAULT 0,
  amount_collected                DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  completed_at                    DATETIME        NULL,
  abandoned_at                    DATETIME        NULL,
  created_at                      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at                      DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_all_tasks_event (event_id),
  KEY idx_event_all_tasks_status (status),
  KEY idx_event_all_tasks_deleted_at (deleted_at),
  CONSTRAINT fk_event_all_tasks_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_all_task_attachments (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)        NOT NULL DEFAULT (UUID()),
  event_id      BIGINT UNSIGNED NOT NULL,
  upload_id     BIGINT UNSIGNED NULL,
  file_url      VARCHAR(500)    NOT NULL,
  original_name VARCHAR(255)    NOT NULL,
  mime_type     VARCHAR(100)    NULL,
  size_bytes    INT UNSIGNED    NULL,
  uploaded_by   BIGINT UNSIGNED NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at    DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_all_task_attachments_uuid (uuid),
  KEY idx_event_all_task_attachments_event (event_id),
  KEY idx_event_all_task_attachments_deleted_at (deleted_at),
  CONSTRAINT fk_eata_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_eata_upload
    FOREIGN KEY (upload_id) REFERENCES uploads (id) ON DELETE SET NULL,
  CONSTRAINT fk_eata_user
    FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
