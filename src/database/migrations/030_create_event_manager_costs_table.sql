-- Migration 030: Manager cost breakdown per event (Cost of Manager screen)

CREATE TABLE IF NOT EXISTS event_manager_costs (
  id                           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id                     BIGINT UNSIGNED NOT NULL,
  client_cost                  DECIMAL(12, 2)  NULL,
  tablet_cost                  DECIMAL(12, 2)  NULL,
  transportation_cost          DECIMAL(12, 2)  NULL,
  assign_manager_cost          DECIMAL(12, 2)  NULL,
  photography_videography_cost DECIMAL(12, 2)  NULL,
  other_charges                DECIMAL(12, 2)  NULL,
  total_cost                   DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  created_at                   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at                   DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_manager_costs_event (event_id),
  KEY idx_event_manager_costs_deleted_at (deleted_at),
  CONSTRAINT fk_event_manager_costs_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
