-- Migration 038: Make client dashboard content global (not tied to an event)

ALTER TABLE client_dashboard_content
  DROP FOREIGN KEY fk_client_dashboard_content_event;

ALTER TABLE client_dashboard_content
  DROP INDEX idx_client_dashboard_content_event;

ALTER TABLE client_dashboard_content
  DROP COLUMN event_id;
