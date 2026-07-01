-- Migration 012: Clients master + event client linkage

CREATE TABLE IF NOT EXISTS clients (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid             CHAR(36)        NOT NULL DEFAULT (UUID()),
  name             VARCHAR(150)    NOT NULL,
  caterer_name     VARCHAR(150)    NOT NULL,
  city_name        VARCHAR(100)    NOT NULL,
  contact_no       VARCHAR(20)     NULL,
  reference        VARCHAR(150)    NOT NULL,
  is_high_priority TINYINT(1)      NOT NULL DEFAULT 0,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_clients_uuid (uuid),
  KEY idx_clients_name (name),
  KEY idx_clients_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE events
  ADD COLUMN client_id BIGINT UNSIGNED NULL AFTER inquiry_id,
  ADD COLUMN caterer_name VARCHAR(150) NULL AFTER client_mobile,
  ADD COLUMN reference VARCHAR(150) NULL AFTER caterer_name,
  ADD COLUMN is_high_priority TINYINT(1) NOT NULL DEFAULT 0 AFTER reference,
  ADD KEY idx_events_client (client_id),
  ADD CONSTRAINT fk_events_client
    FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL;
