-- Migration 031: Add description to billing functions

ALTER TABLE event_billing_functions
  ADD COLUMN description TEXT NULL AFTER name;
