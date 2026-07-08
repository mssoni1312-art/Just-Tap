-- Migration 033: Event reels/videos for manager upload and client display

ALTER TABLE uploads
  MODIFY upload_type ENUM('avatar', 'image', 'document', 'video') NOT NULL;

CREATE TABLE IF NOT EXISTS event_reels (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)        NOT NULL DEFAULT (UUID()),
  event_id      BIGINT UNSIGNED NOT NULL,
  upload_id     BIGINT UNSIGNED NULL,
  video_url     VARCHAR(500)    NOT NULL,
  name          VARCHAR(255)    NOT NULL,
  venue_name    VARCHAR(255)    NOT NULL,
  guest_count   INT UNSIGNED    NOT NULL,
  uploaded_by   BIGINT UNSIGNED NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_reels_uuid (uuid),
  KEY idx_event_reels_event (event_id),
  KEY idx_event_reels_deleted_at (deleted_at),
  CONSTRAINT fk_event_reels_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_event_reels_upload
    FOREIGN KEY (upload_id) REFERENCES uploads (id) ON DELETE SET NULL,
  CONSTRAINT fk_event_reels_user
    FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_event_reels_guest_count CHECK (guest_count > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
