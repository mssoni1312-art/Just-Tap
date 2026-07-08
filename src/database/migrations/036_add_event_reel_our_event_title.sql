-- Migration 036: Link event reels to Our Events titles

ALTER TABLE event_reels
  ADD COLUMN client_event_title_id BIGINT UNSIGNED NULL AFTER event_id,
  ADD KEY idx_event_reels_our_event (client_event_title_id),
  ADD CONSTRAINT fk_event_reels_our_event
    FOREIGN KEY (client_event_title_id) REFERENCES client_event_titles (id) ON DELETE SET NULL;
