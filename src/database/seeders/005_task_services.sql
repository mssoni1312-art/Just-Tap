-- Seeder 005: Service task templates (Just Tap, Just Social, Photography & Videography)
USE justtap;

INSERT INTO task_templates (uuid, name, description, category, is_active) VALUES
  ('f1000000-0000-4000-8000-000000000101', 'Just Tap',                    'On-ground Just Tap service for event operations',           'service', 1),
  ('f1000000-0000-4000-8000-000000000102', 'Just Social',                 'Social media promotion and engagement service',             'service', 1),
  ('f1000000-0000-4000-8000-000000000103', 'Photography & Videography',   'Professional photography and videography coverage',         'service', 1);
