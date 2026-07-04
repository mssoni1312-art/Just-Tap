USE justtap;

CREATE TABLE IF NOT EXISTS report_pdf (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL DEFAULT (UUID()),
  report_id       BIGINT UNSIGNED NOT NULL,
  pdf_url         VARCHAR(500)    NOT NULL,
  stored_name     VARCHAR(255)    NOT NULL,
  file_size_bytes INT UNSIGNED    NULL,
  page_count      INT UNSIGNED    NULL,
  template_slug   VARCHAR(150)    NULL,
  generated_by    BIGINT UNSIGNED NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_report_pdf_uuid (uuid),
  KEY idx_report_pdf_report (report_id),
  KEY idx_report_pdf_deleted_at (deleted_at),
  CONSTRAINT fk_report_pdf_report
    FOREIGN KEY (report_id) REFERENCES report_master (id) ON DELETE CASCADE,
  CONSTRAINT fk_report_pdf_user
    FOREIGN KEY (generated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
