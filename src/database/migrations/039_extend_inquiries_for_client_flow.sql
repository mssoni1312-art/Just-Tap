-- Migration 039: Extend inquiries for client app multi-day submissions
USE justtap;

ALTER TABLE inquiries
  ADD COLUMN date_type ENUM('single', 'multiple') NOT NULL DEFAULT 'single' AFTER client_phone,
  ADD COLUMN total_estimate DECIMAL(12, 2) NULL AFTER capacity,
  ADD COLUMN source ENUM('admin', 'client') NOT NULL DEFAULT 'admin' AFTER total_estimate;

ALTER TABLE inquiries
  MODIFY COLUMN event_date DATE NULL,
  MODIFY COLUMN time_slot VARCHAR(50) NULL,
  MODIFY COLUMN venue VARCHAR(255) NULL,
  MODIFY COLUMN function_name VARCHAR(150) NULL,
  MODIFY COLUMN package_name VARCHAR(100) NULL,
  MODIFY COLUMN capacity VARCHAR(50) NULL;

CREATE TABLE IF NOT EXISTS inquiry_days (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inquiry_id     BIGINT UNSIGNED NOT NULL,
  day_number     INT UNSIGNED    NOT NULL,
  event_date     DATE            NOT NULL,
  venue_name     VARCHAR(255)    NOT NULL,
  function_name  VARCHAR(150)    NOT NULL,
  city           VARCHAR(100)    NOT NULL,
  tablets_count  INT UNSIGNED    NOT NULL DEFAULT 1,
  time_slot      VARCHAR(50)     NOT NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inquiry_days_inquiry (inquiry_id),
  KEY idx_inquiry_days_date (event_date),
  CONSTRAINT fk_inquiry_days_inquiry
    FOREIGN KEY (inquiry_id) REFERENCES inquiries (id) ON DELETE CASCADE,
  CONSTRAINT chk_inquiry_days_tablets CHECK (tablets_count > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
