-- Migration 014: Add tentative event status

ALTER TABLE events
  MODIFY COLUMN status ENUM('inquiry', 'confirmed', 'cancelled', 'r_menu', 'live', 'tentative')
  NOT NULL DEFAULT 'inquiry';
