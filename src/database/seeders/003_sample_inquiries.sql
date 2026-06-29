-- Seeder 003: Sample inquiries, live event, orders, feedback, tasks, table assignments
USE justtap;

INSERT INTO inquiries (uuid, ref_number, client_name, client_phone, event_date, time_slot, venue, function_name, package_name, package_id, capacity, status) VALUES
  ('f2000000-0000-4000-8000-000000000001', 'INQ-9102-2024', 'Ananya Sharma', '+919811122233', '2025-10-26', 'Evening',   'Taj Hotel',      'Wedding Reception', 'Gold',    3, '500', 'pending'),
  ('f2000000-0000-4000-8000-000000000002', 'INQ-9103-2024', 'Vikram Patel',  '+919822233344', '2025-11-15', 'Afternoon', 'Hyatt Regency', 'Corporate Event',   'Premium', 1, '200', 'pending');

INSERT INTO events (uuid, client_name, client_mobile, venue_name, city_name, inquiry_date, start_date, end_date, event_function_name, status, package_id, assigned_manager_id, is_live, created_by)
VALUES (
  'f3000000-0000-4000-8000-000000000001',
  'Dr. Kashyap Kasodariya',
  '+919900011122',
  'Taj Hotel',
  'Mumbai',
  CURDATE() - INTERVAL 3 DAY,
  CURDATE(),
  CURDATE(),
  'Wedding Reception',
  'live',
  3,
  1,
  1,
  1
);

SET @event_id = LAST_INSERT_ID();

INSERT INTO event_functions (uuid, event_id, name, venue, function_date, start_time, end_time, pax, rate, sort_order) VALUES
  ('f4000000-0000-4000-8000-000000000001', @event_id, 'Dinner', 'Taj Hotel Ballroom', CURDATE(), '19:00:00', '23:00:00', 200, 1500.00, 1);

INSERT INTO event_menu_selections (event_id, menu_item_id)
SELECT @event_id, id FROM menu_items
WHERE uuid IN (
  'e1000000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000008',
  'e1000000-0000-4000-8000-000000000009'
);

INSERT INTO event_table_assignments (uuid, event_id, table_number, allocation_type, user_code, description, event_label) VALUES
  ('f5000000-0000-4000-8000-000000000001', @event_id, 1, 'dining',  'Sai001', 'VIP table assignment', 'Wedding Dinner'),
  ('f5000000-0000-4000-8000-000000000002', @event_id, 2, 'dining',  'Sai002', 'Family table',         'Wedding Dinner'),
  ('f5000000-0000-4000-8000-000000000003', @event_id, 1, 'captain', NULL,     NULL,                   NULL);

INSERT INTO event_tasks (uuid, event_id, task_template_id, title, description, status, assigned_to, due_date) VALUES
  ('f6000000-0000-4000-8000-000000000001', @event_id, 1, 'Gain 50+ Followers', 'Promote event on social media',  'completed',   1, CURDATE()),
  ('f6000000-0000-4000-8000-000000000002', @event_id, 2, 'Videography',        'Cover main ceremony',            'in_progress', 2, CURDATE()),
  ('f6000000-0000-4000-8000-000000000003', @event_id, 3, 'Photography',        'Cover dinner function',          'overdue',     2, CURDATE() - INTERVAL 2 DAY),
  ('f6000000-0000-4000-8000-000000000004', @event_id, 4, 'Assign Tablet',      'Setup tablets for all tables',   'pending',     1, CURDATE() + INTERVAL 1 DAY);

INSERT INTO event_orders (uuid, event_id, function_name, manager_id, total_items, delivered_count) VALUES
  ('f7000000-0000-4000-8000-000000000001', @event_id, 'Dinner', 1, 0, 0);

SET @order_id = LAST_INSERT_ID();

INSERT INTO order_tables (uuid, event_order_id, table_number, waiter_name, is_active) VALUES
  ('f8000000-0000-4000-8000-000000000001', @order_id, 1, 'Rajesh Kumar', 1),
  ('f8000000-0000-4000-8000-000000000002', @order_id, 2, 'Amit Singh',   1),
  ('f8000000-0000-4000-8000-000000000003', @order_id, 3, 'Suresh Patel', 1);

INSERT INTO order_line_items (uuid, order_table_id, menu_item_id, order_ref, quantity, status, category)
SELECT
  'f9000000-0000-4000-8000-000000000001',
  ot.id,
  (SELECT id FROM menu_items WHERE uuid = 'e1000000-0000-4000-8000-000000000008'),
  'ORD-1-001',
  3,
  'delivered',
  'Starters'
FROM order_tables ot
WHERE ot.uuid = 'f8000000-0000-4000-8000-000000000001';

SET @line_item_id = LAST_INSERT_ID();

INSERT INTO order_item_batches (uuid, order_line_item_id, batch_number, item_count, status, is_active) VALUES
  ('fa000000-0000-4000-8000-000000000001', @line_item_id, 1, 2, 'delivered',   0),
  ('fa000000-0000-4000-8000-000000000002', @line_item_id, 2, 1, 'in_process',  1);

INSERT INTO order_line_items (uuid, order_table_id, menu_item_id, order_ref, quantity, status, category)
SELECT
  'f9000000-0000-4000-8000-000000000002',
  ot.id,
  (SELECT id FROM menu_items WHERE uuid = 'e1000000-0000-4000-8000-000000000001'),
  'ORD-2-001',
  2,
  'delivered',
  'Starters'
FROM order_tables ot
WHERE ot.uuid = 'f8000000-0000-4000-8000-000000000002';

INSERT INTO order_line_items (uuid, order_table_id, menu_item_id, order_ref, quantity, status, category)
SELECT
  'f9000000-0000-4000-8000-000000000003',
  ot.id,
  (SELECT id FROM menu_items WHERE uuid = 'e1000000-0000-4000-8000-000000000002'),
  'ORD-3-001',
  4,
  'in_process',
  'Main'
FROM order_tables ot
WHERE ot.uuid = 'f8000000-0000-4000-8000-000000000003';

INSERT INTO feedback_reviews (uuid, event_id, client_name, rating, comment, table_no, sentiment) VALUES
  ('fb000000-0000-4000-8000-000000000001', @event_id, 'Rohan Mehta',  5.0, 'Excellent food and service!',                    'T1', 'HAPPY'),
  ('fb000000-0000-4000-8000-000000000002', @event_id, 'Sneha Reddy',  4.0, 'Good experience overall.',                       'T2', 'HAPPY'),
  ('fb000000-0000-4000-8000-000000000003', @event_id, 'Arjun Das',    3.0, 'Food was okay, service could improve.',          'T3', 'NEUTRAL');

INSERT INTO activity_logs (event_id, user_id, action, description) VALUES
  (@event_id, 1, 'event_created',  'Sample live event seeded for development'),
  (@event_id, 1, 'menu_planned',   'Menu items selected for wedding dinner'),
  (@event_id, 1, 'tables_assigned','Dining tables 1-2 assigned');

-- Additional calendar events for home screen
INSERT INTO events (uuid, client_name, client_mobile, venue_name, city_name, start_date, end_date, status, package_id, assigned_manager_id, is_live, created_by) VALUES
  ('f3000000-0000-4000-8000-000000000002', 'Amit Kumar',    NULL, 'Hyatt Hotel', 'Mumbai', CURDATE(),     CURDATE(),     'cancelled', 2, 2, 0, 1),
  ('f3000000-0000-4000-8000-000000000003', 'Rajesh Yadav',  NULL, 'Taj Hotel',   'Mumbai', CURDATE() + 1, CURDATE() + 1, 'confirmed', 3, 1, 0, 1),
  ('f3000000-0000-4000-8000-000000000004', 'Sanjay Reddy',  NULL, 'Taj Hotel',   'Pune',   CURDATE() + 2, CURDATE() + 2, 'r_menu',    3, 3, 0, 1);
