-- Migration 013: Create event tab 4 fields (Just Tap Information, Photography, Just Social, Bride/Groom, Pricing)

ALTER TABLE events
  ADD COLUMN no_of_tablets INT UNSIGNED NULL AFTER is_live,
  ADD COLUMN no_of_captains INT UNSIGNED NULL AFTER no_of_tablets,
  ADD COLUMN no_of_managers INT UNSIGNED NULL AFTER no_of_captains,
  ADD COLUMN just_tap_rate DECIMAL(12, 2) NULL AFTER no_of_managers,
  ADD COLUMN has_photography_videography TINYINT(1) NOT NULL DEFAULT 0 AFTER just_tap_rate,
  ADD COLUMN photography_name VARCHAR(150) NULL AFTER has_photography_videography,
  ADD COLUMN photography_number VARCHAR(20) NULL AFTER photography_name,
  ADD COLUMN photography_city VARCHAR(100) NULL AFTER photography_number,
  ADD COLUMN photography_description TEXT NULL AFTER photography_city,
  ADD COLUMN photography_rate DECIMAL(12, 2) NULL AFTER photography_description,
  ADD COLUMN client_instagram_id VARCHAR(150) NULL AFTER photography_rate,
  ADD COLUMN no_of_followers INT UNSIGNED NULL AFTER client_instagram_id,
  ADD COLUMN no_of_food_reels INT UNSIGNED NULL AFTER no_of_followers,
  ADD COLUMN no_of_testimonial_reels INT UNSIGNED NULL AFTER no_of_food_reels,
  ADD COLUMN bride_name VARCHAR(150) NULL AFTER no_of_testimonial_reels,
  ADD COLUMN bride_instagram_id VARCHAR(150) NULL AFTER bride_name,
  ADD COLUMN groom_name VARCHAR(150) NULL AFTER bride_instagram_id,
  ADD COLUMN groom_instagram_id VARCHAR(150) NULL AFTER groom_name,
  ADD COLUMN total_rate DECIMAL(12, 2) NULL AFTER groom_instagram_id,
  ADD COLUMN discount_rate DECIMAL(5, 2) NULL AFTER total_rate,
  ADD COLUMN final_rate DECIMAL(12, 2) NULL AFTER discount_rate;

CREATE TABLE IF NOT EXISTS event_captain_allocations (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id   BIGINT UNSIGNED NOT NULL,
  staff_id   BIGINT UNSIGNED NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_captain (event_id, staff_id),
  KEY idx_eca_staff (staff_id),
  CONSTRAINT fk_eca_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_eca_staff
    FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_bride_groom_images (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id   BIGINT UNSIGNED NOT NULL,
  image_url  VARCHAR(512)    NOT NULL,
  sort_order INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME        NULL,
  PRIMARY KEY (id),
  KEY idx_ebgi_event (event_id),
  CONSTRAINT fk_ebgi_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
