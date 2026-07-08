-- Migration 037: Make client reels and our-event titles global (not tied to parent event)

ALTER TABLE client_event_titles
  MODIFY event_id BIGINT UNSIGNED NULL;

ALTER TABLE event_reels
  DROP FOREIGN KEY fk_event_reels_event;

ALTER TABLE event_reels
  MODIFY event_id BIGINT UNSIGNED NULL;
