-- Migration 020: Manager role and staff-to-user link for Manager portal auth
USE justtap;

ALTER TABLE users DROP CHECK chk_users_role;

ALTER TABLE users
  MODIFY role ENUM('super_admin', 'manager') NOT NULL DEFAULT 'super_admin';

ALTER TABLE users
  ADD CONSTRAINT chk_users_role CHECK (role IN ('super_admin', 'manager'));

ALTER TABLE staff
  ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER uuid,
  ADD UNIQUE KEY uk_staff_user (user_id),
  ADD CONSTRAINT fk_staff_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;
