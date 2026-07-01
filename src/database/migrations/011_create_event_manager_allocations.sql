-- Migration 011: Event manager allocations (multi-select)

CREATE TABLE IF NOT EXISTS event_manager_allocations (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id   BIGINT UNSIGNED NOT NULL,
  staff_id   BIGINT UNSIGNED NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_manager (event_id, staff_id),
  KEY idx_ema_staff (staff_id),
  CONSTRAINT fk_ema_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_ema_staff
    FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backfill from existing single assigned_manager_id
INSERT INTO event_manager_allocations (event_id, staff_id)
SELECT e.id, e.assigned_manager_id
FROM events e
WHERE e.assigned_manager_id IS NOT NULL
  AND e.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM event_manager_allocations ema
    WHERE ema.event_id = e.id
      AND ema.staff_id = e.assigned_manager_id
      AND ema.deleted_at IS NULL
  );
