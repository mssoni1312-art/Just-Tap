-- Migration 022: Optional staff designation for team allocation display
USE justtap;

ALTER TABLE staff
  ADD COLUMN designation VARCHAR(150) NULL AFTER role;
