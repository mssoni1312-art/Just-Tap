-- Migration 028: Merge duplicate staff (same normalized name + role), keep lowest id

-- Re-point event manager references from duplicate staff to canonical row
UPDATE events e
JOIN (
  SELECT s.id AS dup_id, g.keep_id
  FROM staff s
  INNER JOIN (
    SELECT LOWER(TRIM(name)) AS norm_name, role, MIN(id) AS keep_id
    FROM staff
    WHERE deleted_at IS NULL
    GROUP BY LOWER(TRIM(name)), role
    HAVING COUNT(*) > 1
  ) g ON LOWER(TRIM(s.name)) = g.norm_name AND s.role = g.role AND s.id <> g.keep_id
  WHERE s.deleted_at IS NULL
) m ON e.assigned_manager_id = m.dup_id
SET e.assigned_manager_id = m.keep_id
WHERE e.deleted_at IS NULL;

-- Drop duplicate manager allocations when canonical row is already on the event
UPDATE event_manager_allocations ema
INNER JOIN (
  SELECT s.id AS dup_id, g.keep_id
  FROM staff s
  INNER JOIN (
    SELECT LOWER(TRIM(name)) AS norm_name, role, MIN(id) AS keep_id
    FROM staff
    WHERE deleted_at IS NULL
    GROUP BY LOWER(TRIM(name)), role
    HAVING COUNT(*) > 1
  ) g ON LOWER(TRIM(s.name)) = g.norm_name AND s.role = g.role AND s.id <> g.keep_id
  WHERE s.deleted_at IS NULL
) m ON ema.staff_id = m.dup_id
INNER JOIN event_manager_allocations ema_keep
  ON ema_keep.event_id = ema.event_id
  AND ema_keep.staff_id = m.keep_id
  AND ema_keep.deleted_at IS NULL
SET ema.deleted_at = NOW()
WHERE ema.deleted_at IS NULL;

-- Re-point remaining manager allocations
UPDATE event_manager_allocations ema
INNER JOIN (
  SELECT s.id AS dup_id, g.keep_id
  FROM staff s
  INNER JOIN (
    SELECT LOWER(TRIM(name)) AS norm_name, role, MIN(id) AS keep_id
    FROM staff
    WHERE deleted_at IS NULL
    GROUP BY LOWER(TRIM(name)), role
    HAVING COUNT(*) > 1
  ) g ON LOWER(TRIM(s.name)) = g.norm_name AND s.role = g.role AND s.id <> g.keep_id
  WHERE s.deleted_at IS NULL
) m ON ema.staff_id = m.dup_id
SET ema.staff_id = m.keep_id
WHERE ema.deleted_at IS NULL;

UPDATE event_tasks et
INNER JOIN (
  SELECT s.id AS dup_id, g.keep_id
  FROM staff s
  INNER JOIN (
    SELECT LOWER(TRIM(name)) AS norm_name, role, MIN(id) AS keep_id
    FROM staff
    WHERE deleted_at IS NULL
    GROUP BY LOWER(TRIM(name)), role
    HAVING COUNT(*) > 1
  ) g ON LOWER(TRIM(s.name)) = g.norm_name AND s.role = g.role AND s.id <> g.keep_id
  WHERE s.deleted_at IS NULL
) m ON et.assigned_to = m.dup_id
SET et.assigned_to = m.keep_id
WHERE et.deleted_at IS NULL;

UPDATE event_table_assignments eta
INNER JOIN (
  SELECT s.id AS dup_id, g.keep_id
  FROM staff s
  INNER JOIN (
    SELECT LOWER(TRIM(name)) AS norm_name, role, MIN(id) AS keep_id
    FROM staff
    WHERE deleted_at IS NULL
    GROUP BY LOWER(TRIM(name)), role
    HAVING COUNT(*) > 1
  ) g ON LOWER(TRIM(s.name)) = g.norm_name AND s.role = g.role AND s.id <> g.keep_id
  WHERE s.deleted_at IS NULL
) m ON eta.staff_id = m.dup_id
SET eta.staff_id = m.keep_id
WHERE eta.deleted_at IS NULL;

-- Move linked user account to canonical staff when canonical has none
UPDATE staff keep_row
INNER JOIN (
  SELECT s.id AS dup_id, g.keep_id
  FROM staff s
  INNER JOIN (
    SELECT LOWER(TRIM(name)) AS norm_name, role, MIN(id) AS keep_id
    FROM staff
    WHERE deleted_at IS NULL
    GROUP BY LOWER(TRIM(name)), role
    HAVING COUNT(*) > 1
  ) g ON LOWER(TRIM(s.name)) = g.norm_name AND s.role = g.role AND s.id <> g.keep_id
  WHERE s.deleted_at IS NULL
) m ON keep_row.id = m.keep_id
INNER JOIN staff dup_row ON dup_row.id = m.dup_id
SET keep_row.user_id = dup_row.user_id
WHERE keep_row.user_id IS NULL
  AND dup_row.user_id IS NOT NULL;

UPDATE staff dup_row
INNER JOIN (
  SELECT s.id AS dup_id, g.keep_id
  FROM staff s
  INNER JOIN (
    SELECT LOWER(TRIM(name)) AS norm_name, role, MIN(id) AS keep_id
    FROM staff
    WHERE deleted_at IS NULL
    GROUP BY LOWER(TRIM(name)), role
    HAVING COUNT(*) > 1
  ) g ON LOWER(TRIM(s.name)) = g.norm_name AND s.role = g.role AND s.id <> g.keep_id
  WHERE s.deleted_at IS NULL
) m ON dup_row.id = m.dup_id
INNER JOIN staff keep_row ON keep_row.id = m.keep_id
SET dup_row.user_id = NULL
WHERE dup_row.user_id IS NOT NULL
  AND keep_row.user_id = dup_row.user_id;

-- Soft-delete duplicate staff rows
UPDATE staff s
INNER JOIN (
  SELECT s2.id AS dup_id
  FROM staff s2
  INNER JOIN (
    SELECT LOWER(TRIM(name)) AS norm_name, role, MIN(id) AS keep_id
    FROM staff
    WHERE deleted_at IS NULL
    GROUP BY LOWER(TRIM(name)), role
    HAVING COUNT(*) > 1
  ) g ON LOWER(TRIM(s2.name)) = g.norm_name AND s2.role = g.role AND s2.id <> g.keep_id
  WHERE s2.deleted_at IS NULL
) m ON s.id = m.dup_id
SET s.deleted_at = NOW(), s.is_active = 0;
