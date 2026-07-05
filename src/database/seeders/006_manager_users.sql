-- Seeder 006: Manager portal users linked to event_manager staff
-- Password: manager123 (bcrypt hash injected by setup.js)
USE justtap;

INSERT INTO users (uuid, email, phone, password_hash, first_name, last_name, handle, role, status)
VALUES
  (
    'a1000000-0000-4000-8000-000000000002',
    'manager@justtap.com',
    '+919876543211',
    '__BCRYPT_HASH__',
    'Swapnil',
    'Ghodeswar',
    '@manager_swapnil',
    'manager',
    'active'
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'manager2@justtap.com',
    '+919876543212',
    '__BCRYPT_HASH__',
    'Priya',
    'Sharma',
    '@manager_priya',
    'manager',
    'active'
  );

INSERT INTO user_preferences (user_id, push_enabled, email_alerts_enabled, dark_mode_enabled, onboarding_completed)
SELECT id, 1, 1, 1, 0 FROM users WHERE email = 'manager@justtap.com';

INSERT INTO user_preferences (user_id, push_enabled, email_alerts_enabled, dark_mode_enabled, onboarding_completed)
SELECT id, 1, 1, 1, 0 FROM users WHERE email = 'manager2@justtap.com';

UPDATE staff s
JOIN users u ON u.email = 'manager@justtap.com'
SET s.user_id = u.id
WHERE s.uuid = 'b1000000-0000-4000-8000-000000000001';

UPDATE staff s
JOIN users u ON u.email = 'manager2@justtap.com'
SET s.user_id = u.id
WHERE s.uuid = 'b1000000-0000-4000-8000-000000000002';

-- Upcoming event allocated only to manager 2 (Priya) for ownership isolation tests
INSERT INTO events (uuid, client_name, client_mobile, venue_name, city_name, inquiry_date, start_date, end_date, event_function_name, status, package_id, assigned_manager_id, is_live, created_by)
SELECT
  'f3000000-0000-4000-8000-000000000002',
  'Rohan Mehta',
  '+919988877766',
  'Hyatt Regency',
  'Pune',
  CURDATE(),
  CURDATE() + INTERVAL 14 DAY,
  CURDATE() + INTERVAL 14 DAY,
  'Corporate Gala',
  'confirmed',
  2,
  (SELECT id FROM staff WHERE uuid = 'b1000000-0000-4000-8000-000000000002'),
  0,
  (SELECT id FROM users WHERE email = 'admin@justtap.com')
WHERE NOT EXISTS (
  SELECT 1 FROM events WHERE uuid = 'f3000000-0000-4000-8000-000000000002'
);

INSERT INTO event_manager_allocations (event_id, staff_id)
SELECT e.id, s.id
FROM events e
JOIN staff s ON s.uuid = 'b1000000-0000-4000-8000-000000000002'
WHERE e.uuid = 'f3000000-0000-4000-8000-000000000002'
  AND NOT EXISTS (
    SELECT 1 FROM event_manager_allocations ema
    WHERE ema.event_id = e.id AND ema.staff_id = s.id AND ema.deleted_at IS NULL
  );
