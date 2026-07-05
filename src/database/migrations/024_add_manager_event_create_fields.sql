-- Migration 024: Manager create-event flow fields (client address, notes, function sub-venue)

ALTER TABLE clients
  ADD COLUMN client_address VARCHAR(255) NULL AFTER caterer_name;

ALTER TABLE events
  ADD COLUMN client_address VARCHAR(255) NULL AFTER caterer_name,
  ADD COLUMN tablet_service VARCHAR(150) NULL AFTER no_of_managers,
  ADD COLUMN media_client_address VARCHAR(255) NULL AFTER tablet_service,
  ADD COLUMN food_notes TEXT NULL AFTER groom_instagram_id,
  ADD COLUMN event_remarks TEXT NULL AFTER food_notes;

ALTER TABLE event_functions
  ADD COLUMN sub_venue_remarks VARCHAR(255) NULL AFTER venue;
