-- Migration 009: Triggers for data integrity
-- Note: executed statement-by-statement by setup.js (BEGIN/END blocks cannot use DELIMITER via mysql2)
USE justtap;

DROP TRIGGER IF EXISTS trg_users_before_soft_delete;
CREATE TRIGGER trg_users_before_soft_delete
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    SET NEW.email = CONCAT(OLD.email, '.deleted.', OLD.id);
    IF OLD.phone IS NOT NULL THEN
      SET NEW.phone = CONCAT(OLD.phone, '.d', OLD.id);
    END IF;
    SET NEW.status = 'inactive';
  END IF;
END;

DROP TRIGGER IF EXISTS trg_order_line_items_after_insert;
CREATE TRIGGER trg_order_line_items_after_insert
AFTER INSERT ON order_line_items
FOR EACH ROW
BEGIN
  DECLARE v_event_order_id BIGINT UNSIGNED;

  SELECT ot.event_order_id INTO v_event_order_id
  FROM order_tables ot
  WHERE ot.id = NEW.order_table_id;

  UPDATE event_orders eo
  SET
    total_items = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id AND oli.deleted_at IS NULL
    ),
    delivered_count = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id
        AND oli.deleted_at IS NULL
        AND oli.status = 'delivered'
    ),
    updated_at = NOW()
  WHERE eo.id = v_event_order_id;
END;

DROP TRIGGER IF EXISTS trg_order_line_items_after_update;
CREATE TRIGGER trg_order_line_items_after_update
AFTER UPDATE ON order_line_items
FOR EACH ROW
BEGIN
  DECLARE v_event_order_id BIGINT UNSIGNED;

  SELECT ot.event_order_id INTO v_event_order_id
  FROM order_tables ot
  WHERE ot.id = NEW.order_table_id;

  UPDATE event_orders eo
  SET
    total_items = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id AND oli.deleted_at IS NULL
    ),
    delivered_count = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id
        AND oli.deleted_at IS NULL
        AND oli.status = 'delivered'
    ),
    updated_at = NOW()
  WHERE eo.id = v_event_order_id;
END;

DROP TRIGGER IF EXISTS trg_order_line_items_after_delete;
CREATE TRIGGER trg_order_line_items_after_delete
AFTER DELETE ON order_line_items
FOR EACH ROW
BEGIN
  DECLARE v_event_order_id BIGINT UNSIGNED;

  SELECT ot.event_order_id INTO v_event_order_id
  FROM order_tables ot
  WHERE ot.id = OLD.order_table_id;

  UPDATE event_orders eo
  SET
    total_items = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id AND oli.deleted_at IS NULL
    ),
    delivered_count = (
      SELECT COALESCE(SUM(oli.quantity), 0)
      FROM order_line_items oli
      JOIN order_tables ot2 ON ot2.id = oli.order_table_id
      WHERE ot2.event_order_id = v_event_order_id
        AND oli.deleted_at IS NULL
        AND oli.status = 'delivered'
    ),
    updated_at = NOW()
  WHERE eo.id = v_event_order_id;
END;

DROP TRIGGER IF EXISTS trg_event_tasks_before_update;
CREATE TRIGGER trg_event_tasks_before_update
BEFORE UPDATE ON event_tasks
FOR EACH ROW
BEGIN
  IF NEW.due_date < CURDATE()
     AND NEW.status NOT IN ('completed', 'overdue')
     AND NEW.deleted_at IS NULL THEN
    SET NEW.status = 'overdue';
  END IF;
END;
