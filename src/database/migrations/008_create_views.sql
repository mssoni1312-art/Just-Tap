-- Migration 008: Read-optimized views for Super Admin mobile screens
USE justtap;

-- Home / Events tab: event list with relations
CREATE OR REPLACE VIEW v_events_list AS
SELECT
  e.id,
  e.uuid,
  e.client_name,
  e.client_mobile,
  e.venue_name,
  e.city_name,
  e.inquiry_date,
  e.start_date,
  e.end_date,
  e.event_function_name,
  e.status,
  e.is_live,
  e.package_id,
  mp.name   AS package_name,
  mp.type   AS package_type,
  e.assigned_manager_id,
  s.name    AS manager_name,
  e.inquiry_id,
  e.created_by,
  e.created_at,
  e.updated_at
FROM events e
LEFT JOIN menu_packages mp ON mp.id = e.package_id AND mp.deleted_at IS NULL
LEFT JOIN staff s ON s.id = e.assigned_manager_id AND s.deleted_at IS NULL
WHERE e.deleted_at IS NULL;

-- Calendar markers: one row per event date + status
CREATE OR REPLACE VIEW v_events_calendar AS
SELECT
  e.id          AS event_id,
  e.uuid        AS event_uuid,
  e.start_date  AS event_date,
  e.status,
  e.is_live,
  e.client_name,
  e.venue_name
FROM events e
WHERE e.deleted_at IS NULL;

-- Inquiry tab: pending inquiries with optional package link
CREATE OR REPLACE VIEW v_inquiries_pending AS
SELECT
  i.id,
  i.uuid,
  i.ref_number,
  i.client_name,
  i.client_phone,
  i.event_date,
  i.time_slot,
  i.venue,
  i.function_name,
  i.package_name,
  i.package_id,
  mp.slug AS package_slug,
  i.capacity,
  i.status,
  i.converted_event_id,
  e.uuid  AS converted_event_uuid,
  i.created_at
FROM inquiries i
LEFT JOIN menu_packages mp ON mp.id = i.package_id AND mp.deleted_at IS NULL
LEFT JOIN events e ON e.id = i.converted_event_id AND e.deleted_at IS NULL
WHERE i.deleted_at IS NULL AND i.status = 'pending';

-- Tasks screen: KPI summary
CREATE OR REPLACE VIEW v_task_summary AS
SELECT
  COUNT(*) AS total_tasks,
  SUM(CASE WHEN due_date = CURDATE() AND status NOT IN ('completed') THEN 1 ELSE 0 END) AS today_tasks,
  SUM(CASE WHEN status = 'overdue' OR (due_date < CURDATE() AND status NOT IN ('completed')) THEN 1 ELSE 0 END) AS overdue_tasks,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
FROM event_tasks
WHERE deleted_at IS NULL;

-- Feedback screen: per-event rating summary
CREATE OR REPLACE VIEW v_feedback_summary AS
SELECT
  event_id,
  ROUND(AVG(rating), 1) AS avg_rating,
  COUNT(*)              AS review_count,
  SUM(CASE WHEN is_flagged = 1 THEN 1 ELSE 0 END) AS flagged_count
FROM feedback_reviews
WHERE deleted_at IS NULL
GROUP BY event_id;

-- Menu Category screen: categories with live item counts
CREATE OR REPLACE VIEW v_menu_categories_with_counts AS
SELECT
  mc.id,
  mc.uuid,
  mc.name,
  mc.description,
  mc.sort_order,
  COUNT(mi.id) AS item_count
FROM menu_categories mc
LEFT JOIN menu_items mi ON mi.category_id = mc.id AND mi.deleted_at IS NULL AND mi.is_active = 1
WHERE mc.deleted_at IS NULL
GROUP BY mc.id, mc.uuid, mc.name, mc.description, mc.sort_order;

-- Order overview: event order with manager
CREATE OR REPLACE VIEW v_event_orders_overview AS
SELECT
  eo.id,
  eo.uuid,
  eo.event_id,
  ev.uuid AS event_uuid,
  eo.function_name,
  eo.manager_id,
  s.name  AS manager_name,
  eo.total_items,
  eo.delivered_count,
  eo.created_at,
  eo.updated_at
FROM event_orders eo
JOIN events ev ON ev.id = eo.event_id AND ev.deleted_at IS NULL
LEFT JOIN staff s ON s.id = eo.manager_id AND s.deleted_at IS NULL
WHERE eo.deleted_at IS NULL;
