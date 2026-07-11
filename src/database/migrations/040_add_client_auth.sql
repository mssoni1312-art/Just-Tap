-- Migration 040: Client role and clients-to-user link for Client app auth
USE justtap;

ALTER TABLE users DROP CHECK chk_users_role;

ALTER TABLE users
  MODIFY role ENUM('super_admin', 'manager', 'client') NOT NULL DEFAULT 'super_admin';

ALTER TABLE users
  ADD CONSTRAINT chk_users_role CHECK (role IN ('super_admin', 'manager', 'client'));

ALTER TABLE clients
  ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER uuid,
  ADD UNIQUE KEY uk_clients_user (user_id),
  ADD CONSTRAINT fk_clients_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;
