-- Migration 015: Manage Packages — features, pricing, package-feature mapping

ALTER TABLE menu_packages
  ADD COLUMN price DECIMAL(12, 2) NULL AFTER type,
  ADD COLUMN is_most_popular TINYINT(1) NOT NULL DEFAULT 0 AFTER price,
  ADD COLUMN sort_order INT UNSIGNED NOT NULL DEFAULT 0 AFTER is_most_popular,
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER sort_order;

CREATE TABLE IF NOT EXISTS package_features (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid       CHAR(36)        NOT NULL DEFAULT (UUID()),
  name       VARCHAR(150)    NOT NULL,
  is_active  TINYINT(1)      NOT NULL DEFAULT 1,
  sort_order INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_package_features_uuid (uuid),
  KEY idx_package_features_sort (sort_order),
  KEY idx_package_features_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_package_features (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  package_id BIGINT UNSIGNED NOT NULL,
  feature_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_package_feature (package_id, feature_id),
  KEY idx_mpf_feature (feature_id),
  CONSTRAINT fk_mpf_package
    FOREIGN KEY (package_id) REFERENCES menu_packages (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpf_feature
    FOREIGN KEY (feature_id) REFERENCES package_features (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO package_features (uuid, name, sort_order, is_active) VALUES
  ('f2000000-0000-4000-8000-000000000001', 'Social Media Growth',       1, 1),
  ('f2000000-0000-4000-8000-000000000002', 'Professional Photography',  2, 1),
  ('f2000000-0000-4000-8000-000000000003', 'Cinematic Videography',     3, 0),
  ('f2000000-0000-4000-8000-000000000004', 'VIP Support',               4, 1);

UPDATE menu_packages SET price = 499.00, sort_order = 1, is_most_popular = 0 WHERE slug = 'premium' AND deleted_at IS NULL;
UPDATE menu_packages SET price = 699.00, sort_order = 2, is_most_popular = 1 WHERE slug = 'silver' AND deleted_at IS NULL;
UPDATE menu_packages SET price = 1499.00, sort_order = 3, is_most_popular = 0 WHERE slug = 'gold' AND deleted_at IS NULL;
UPDATE menu_packages SET sort_order = 4 WHERE slug = 'custom' AND deleted_at IS NULL;

INSERT INTO menu_package_features (package_id, feature_id)
SELECT mp.id, pf.id
FROM menu_packages mp
JOIN package_features pf ON pf.name = 'Social Media Growth' AND pf.deleted_at IS NULL
WHERE mp.slug IN ('premium', 'silver', 'gold') AND mp.deleted_at IS NULL
ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW();

INSERT INTO menu_package_features (package_id, feature_id)
SELECT mp.id, pf.id
FROM menu_packages mp
JOIN package_features pf ON pf.name = 'Professional Photography' AND pf.deleted_at IS NULL
WHERE mp.slug IN ('silver', 'gold') AND mp.deleted_at IS NULL
ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW();

INSERT INTO menu_package_features (package_id, feature_id)
SELECT mp.id, pf.id
FROM menu_packages mp
JOIN package_features pf ON pf.name = 'VIP Support' AND pf.deleted_at IS NULL
WHERE mp.slug = 'gold' AND mp.deleted_at IS NULL
ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW();
