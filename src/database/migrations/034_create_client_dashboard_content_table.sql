-- Migration 034: Client dashboard content (discover experience + testimonials)

CREATE TABLE IF NOT EXISTS client_dashboard_content (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)        NOT NULL DEFAULT (UUID()),
  content_type  ENUM('discover_experience', 'testimonial') NOT NULL,
  upload_id     BIGINT UNSIGNED NULL,
  video_url     VARCHAR(500)    NULL,
  description   TEXT            NOT NULL,
  name          VARCHAR(150)    NULL,
  rating        TINYINT UNSIGNED NULL,
  sort_order    INT UNSIGNED    NOT NULL DEFAULT 0,
  created_by    BIGINT UNSIGNED NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_client_dashboard_content_uuid (uuid),
  KEY idx_client_dashboard_content_type (content_type),
  KEY idx_client_dashboard_content_deleted_at (deleted_at),
  CONSTRAINT fk_client_dashboard_content_upload
    FOREIGN KEY (upload_id) REFERENCES uploads (id) ON DELETE SET NULL,
  CONSTRAINT fk_client_dashboard_content_user
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_client_dashboard_testimonial_rating
    CHECK (content_type != 'testimonial' OR (rating IS NOT NULL AND rating BETWEEN 1 AND 5)),
  CONSTRAINT chk_client_dashboard_testimonial_name
    CHECK (content_type != 'testimonial' OR (name IS NOT NULL AND CHAR_LENGTH(TRIM(name)) > 0)),
  CONSTRAINT chk_client_dashboard_discover_video
    CHECK (content_type != 'discover_experience' OR (video_url IS NOT NULL AND CHAR_LENGTH(TRIM(video_url)) > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
