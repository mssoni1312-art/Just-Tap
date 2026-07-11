-- Migration 041: Link inquiries to client accounts for client app history
USE justtap;

ALTER TABLE inquiries
  ADD COLUMN client_id BIGINT UNSIGNED NULL AFTER client_phone,
  ADD KEY idx_inquiries_client (client_id),
  ADD CONSTRAINT fk_inquiries_client
    FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL;
