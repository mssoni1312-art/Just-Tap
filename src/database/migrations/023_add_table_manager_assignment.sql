-- Migration 023: Link table assignments to a manager (staff) for the
-- "Select tables to assign" screen and the Manager Report "Assigned Tables" list.
USE justtap;

ALTER TABLE event_table_assignments
  ADD COLUMN staff_id BIGINT UNSIGNED NULL AFTER allocation_type,
  ADD KEY idx_eta_staff (staff_id),
  ADD CONSTRAINT fk_eta_staff
    FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE SET NULL;
