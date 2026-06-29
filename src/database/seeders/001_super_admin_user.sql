-- Seeder 001: Super Admin user & preferences
-- Password: admin123 (bcrypt hash injected by setup.js)
USE justtap;

INSERT INTO users (uuid, email, phone, password_hash, first_name, last_name, handle, role, status)
VALUES (
  'a1000000-0000-4000-8000-000000000001',
  'admin@justtap.com',
  '+919876543210',
  '__BCRYPT_HASH__',
  'Admin',
  'Super Admin',
  '@admin_justtap',
  'super_admin',
  'active'
);

INSERT INTO user_preferences (user_id, push_enabled, email_alerts_enabled, dark_mode_enabled, onboarding_completed)
VALUES (LAST_INSERT_ID(), 1, 1, 1, 0);
