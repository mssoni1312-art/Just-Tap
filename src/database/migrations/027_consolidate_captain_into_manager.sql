-- Migration 027: Treat captain and manager as the same staff role and allocation

-- Reclassify captain staff as event managers
UPDATE staff
SET role = 'event_manager'
WHERE role = 'captain'
  AND deleted_at IS NULL;

-- Move captain event allocations into manager allocations
INSERT INTO event_manager_allocations (event_id, staff_id, created_at, updated_at)
SELECT eca.event_id, eca.staff_id, eca.created_at, eca.updated_at
FROM event_captain_allocations eca
WHERE eca.deleted_at IS NULL
ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW();

-- Preserve headcount when only captain count was set
UPDATE events
SET no_of_managers = COALESCE(no_of_managers, no_of_captains)
WHERE no_of_captains IS NOT NULL
  AND deleted_at IS NULL;

DROP TABLE IF EXISTS event_captain_allocations;

ALTER TABLE events
  DROP COLUMN no_of_captains;

ALTER TABLE staff
  MODIFY role ENUM('event_manager', 'waiter', 'other') NOT NULL DEFAULT 'event_manager';
