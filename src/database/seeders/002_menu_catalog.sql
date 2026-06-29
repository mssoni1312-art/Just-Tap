-- Seeder 002: Staff, menu catalog, packages, task templates, content pages
USE justtap;

INSERT INTO staff (uuid, name, role, is_active) VALUES
  ('b1000000-0000-4000-8000-000000000001', 'Swapnil Ghodeswar', 'event_manager', 1),
  ('b1000000-0000-4000-8000-000000000002', 'Priya Sharma',      'event_manager', 1),
  ('b1000000-0000-4000-8000-000000000003', 'Rahul Verma',       'event_manager', 1);

INSERT INTO menu_categories (uuid, name, description, sort_order) VALUES
  ('c1000000-0000-4000-8000-000000000001', 'Main',      'Main course dishes',           1),
  ('c1000000-0000-4000-8000-000000000002', 'Breakfast', 'Morning breakfast items',      2),
  ('c1000000-0000-4000-8000-000000000003', 'Shakes',    'Fresh shakes and smoothies',   3),
  ('c1000000-0000-4000-8000-000000000004', 'Drinks',    'Beverages and cocktails',      4),
  ('c1000000-0000-4000-8000-000000000005', 'Starters',  'Appetizers and starters',      5),
  ('c1000000-0000-4000-8000-000000000006', 'Salad',     'Fresh salads',                 6);

INSERT INTO menu_packages (uuid, name, slug, type) VALUES
  ('d1000000-0000-4000-8000-000000000001', 'Premium', 'premium', 'premium'),
  ('d1000000-0000-4000-8000-000000000002', 'Silver',  'silver',  'silver'),
  ('d1000000-0000-4000-8000-000000000003', 'Gold',    'gold',    'gold'),
  ('d1000000-0000-4000-8000-000000000004', 'Custom',  'custom',  'custom');

INSERT INTO menu_items (uuid, category_id, name, description, price, is_veg, is_best_seller, is_active) VALUES
  ('e1000000-0000-4000-8000-000000000001', 1, 'Paneer Tikka',      'Grilled cottage cheese with spices', 350.00, 1, 1, 1),
  ('e1000000-0000-4000-8000-000000000002', 1, 'Butter Chicken',    'Classic creamy butter chicken',      450.00, 0, 1, 1),
  ('e1000000-0000-4000-8000-000000000003', 1, 'Dal Makhani',       'Slow cooked black lentils',          280.00, 1, 0, 1),
  ('e1000000-0000-4000-8000-000000000004', 2, 'Masala Dosa',       'Crispy dosa with potato filling',    180.00, 1, 0, 1),
  ('e1000000-0000-4000-8000-000000000005', 2, 'Poha',              'Flattened rice breakfast',           120.00, 1, 0, 1),
  ('e1000000-0000-4000-8000-000000000006', 3, 'Mango Shake',       'Fresh mango milkshake',              150.00, 1, 0, 1),
  ('e1000000-0000-4000-8000-000000000007', 4, 'Fresh Lime Soda',   'Refreshing lime soda',                80.00, 1, 0, 1),
  ('e1000000-0000-4000-8000-000000000008', 5, 'Veg Spring Rolls',  'Crispy vegetable rolls',             220.00, 1, 0, 1),
  ('e1000000-0000-4000-8000-000000000009', 6, 'Caesar Salad',      'Classic caesar with croutons',       250.00, 0, 0, 1);

INSERT INTO menu_package_items (package_id, menu_item_id)
SELECT 1, id FROM menu_items WHERE uuid IN (
  'e1000000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000003',
  'e1000000-0000-4000-8000-000000000008',
  'e1000000-0000-4000-8000-000000000009'
);

INSERT INTO task_templates (uuid, name, description, category, is_active) VALUES
  ('f1000000-0000-4000-8000-000000000001', 'Gain 50+ Followers', 'Social media promotion task',    'marketing',   1),
  ('f1000000-0000-4000-8000-000000000002', 'Videography',        'Event videography coverage',       'media',       1),
  ('f1000000-0000-4000-8000-000000000003', 'Photography',        'Event photography coverage',       'media',       1),
  ('f1000000-0000-4000-8000-000000000004', 'Assign Tablet',      'Assign tablet devices to tables',  'operations',  1);

INSERT INTO content_pages (page_key, content) VALUES
  ('about', JSON_OBJECT(
    'title', 'About Just Tap',
    'description', 'Just Tap is a premium event catering platform built for Super Admins to manage inquiries, events, menus, and on-ground operations from one place.',
    'version', '1.0.0',
    'eventsManaged', 500
  )),
  ('contact', JSON_OBJECT(
    'email', 'support@justtap.com',
    'phone', '+91 98765 43210',
    'address', '123 Catering Lane, Mumbai, India',
    'supportHours', 'Mon–Sat, 9:00 AM – 6:00 PM IST'
  ));
