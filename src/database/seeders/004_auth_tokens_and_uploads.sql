-- Seeder 004: Auth token samples & uploads (tables not covered by earlier seeders)
USE justtap;

INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at) VALUES
  (1, '__RESET_TOKEN_HASH_ACTIVE__', DATE_ADD(NOW(), INTERVAL 1 HOUR),  NULL),
  (1, '__RESET_TOKEN_HASH_USED__',   DATE_ADD(NOW(), INTERVAL -1 DAY), NOW() - INTERVAL 2 HOUR);

INSERT INTO otp_verifications (identifier, code_hash, expires_at, verified_at) VALUES
  ('+919876543210',   '__OTP_CODE_HASH_PENDING__',  DATE_ADD(NOW(), INTERVAL 10 MINUTE), NULL),
  ('admin@justtap.com', '__OTP_CODE_HASH_VERIFIED__', DATE_ADD(NOW(), INTERVAL -1 HOUR),  NOW() - INTERVAL 30 MINUTE);

INSERT INTO uploads (uuid, user_id, original_name, stored_name, mime_type, size_bytes, upload_type) VALUES
  ('u1000000-0000-4000-8000-000000000001', 1, 'admin-avatar.jpg',  'seed-admin-avatar.jpg',  'image/jpeg', 245760, 'avatar'),
  ('u1000000-0000-4000-8000-000000000002', 1, 'event-menu.pdf',    'seed-event-menu.pdf',    'application/pdf', 1048576, 'document');
