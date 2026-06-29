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
