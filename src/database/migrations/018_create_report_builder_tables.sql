USE justtap;

CREATE TABLE IF NOT EXISTS report_templates (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)        NOT NULL DEFAULT (UUID()),
  name          VARCHAR(150)    NOT NULL,
  slug          VARCHAR(150)    NOT NULL,
  category      ENUM('luxury', 'minimal', 'classic', 'custom') NOT NULL DEFAULT 'classic',
  description   TEXT            NULL,
  preview_url   VARCHAR(500)    NULL,
  thumbnail_url VARCHAR(500)    NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  sort_order    INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_report_templates_uuid (uuid),
  UNIQUE KEY uk_report_templates_slug (slug),
  KEY idx_report_templates_category (category),
  KEY idx_report_templates_active (is_active),
  KEY idx_report_templates_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_master (
  id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid                     CHAR(36)        NOT NULL DEFAULT (UUID()),
  event_id                 BIGINT UNSIGNED NOT NULL,
  template_id              BIGINT UNSIGNED NULL,
  package_id               BIGINT UNSIGNED NULL,
  status                   ENUM('draft', 'published', 'shared') NOT NULL DEFAULT 'draft',
  include_menu_in_template TINYINT(1)      NOT NULL DEFAULT 1,
  layout_position          ENUM('top', 'background', 'side') NULL,
  bride_groom_photo_url    VARCHAR(500)    NULL,
  created_by               BIGINT UNSIGNED NULL,
  updated_by               BIGINT UNSIGNED NULL,
  published_at             DATETIME        NULL,
  created_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at               DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_report_master_uuid (uuid),
  UNIQUE KEY uk_report_master_event (event_id),
  KEY idx_report_master_status (status),
  KEY idx_report_master_template (template_id),
  KEY idx_report_master_package (package_id),
  KEY idx_report_master_created_by (created_by),
  KEY idx_report_master_deleted_at (deleted_at),
  CONSTRAINT fk_report_master_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_report_master_template
    FOREIGN KEY (template_id) REFERENCES report_templates (id) ON DELETE SET NULL,
  CONSTRAINT fk_report_master_package
    FOREIGN KEY (package_id) REFERENCES menu_packages (id) ON DELETE SET NULL,
  CONSTRAINT fk_report_master_created_by
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_report_master_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_settings (
  report_id    BIGINT UNSIGNED NOT NULL,
  typography   JSON            NULL,
  grid         JSON            NULL,
  photo_filter JSON            NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (report_id),
  CONSTRAINT fk_report_settings_report
    FOREIGN KEY (report_id) REFERENCES report_master (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_theme (
  report_id  BIGINT UNSIGNED NOT NULL,
  colors     JSON            NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (report_id),
  CONSTRAINT fk_report_theme_report
    FOREIGN KEY (report_id) REFERENCES report_master (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_photos (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id  BIGINT UNSIGNED NOT NULL,
  image_url  VARCHAR(500)    NOT NULL,
  upload_id  BIGINT UNSIGNED NULL,
  sort_order INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME        NULL,
  PRIMARY KEY (id),
  KEY idx_report_photos_report (report_id),
  KEY idx_report_photos_deleted_at (deleted_at),
  CONSTRAINT fk_report_photos_report
    FOREIGN KEY (report_id) REFERENCES report_master (id) ON DELETE CASCADE,
  CONSTRAINT fk_report_photos_upload
    FOREIGN KEY (upload_id) REFERENCES uploads (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_shares (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid        CHAR(36)        NOT NULL DEFAULT (UUID()),
  report_id   BIGINT UNSIGNED NOT NULL,
  share_token VARCHAR(64)     NOT NULL,
  shared_by   BIGINT UNSIGNED NULL,
  shared_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME        NULL,
  notes       TEXT            NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_report_shares_uuid (uuid),
  UNIQUE KEY uk_report_shares_token (share_token),
  KEY idx_report_shares_report (report_id),
  CONSTRAINT fk_report_shares_report
    FOREIGN KEY (report_id) REFERENCES report_master (id) ON DELETE CASCADE,
  CONSTRAINT fk_report_shares_user
    FOREIGN KEY (shared_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO report_templates (name, slug, category, description, sort_order)
SELECT * FROM (
  SELECT 'Royal Noir', 'royal-noir', 'luxury', 'Dark luxury theme with gold accents', 1
  UNION ALL SELECT 'Classic Gold', 'classic-gold', 'classic', 'Traditional gold-bordered layout', 2
  UNION ALL SELECT 'Elegant White', 'elegant-white', 'minimal', 'Clean minimal white design', 3
  UNION ALL SELECT 'Modern Gold', 'modern-gold', 'luxury', 'Contemporary gold typography', 4
  UNION ALL SELECT 'Heritage Classic', 'heritage-classic', 'classic', 'Timeless serif typography', 5
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM report_templates LIMIT 1);
