-- Migration 038: Make client dashboard content global (not tied to an event)
-- Idempotent: 034 may already create the table without event_id.

SET @fk_client_dashboard_content_event_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_dashboard_content'
    AND CONSTRAINT_NAME = 'fk_client_dashboard_content_event'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @drop_fk_client_dashboard_content_event = IF(
  @fk_client_dashboard_content_event_exists > 0,
  'ALTER TABLE client_dashboard_content DROP FOREIGN KEY fk_client_dashboard_content_event',
  'SELECT 1'
);

PREPARE stmt_drop_fk_client_dashboard_content_event FROM @drop_fk_client_dashboard_content_event;
EXECUTE stmt_drop_fk_client_dashboard_content_event;
DEALLOCATE PREPARE stmt_drop_fk_client_dashboard_content_event;

SET @idx_client_dashboard_content_event_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_dashboard_content'
    AND INDEX_NAME = 'idx_client_dashboard_content_event'
);

SET @drop_idx_client_dashboard_content_event = IF(
  @idx_client_dashboard_content_event_exists > 0,
  'ALTER TABLE client_dashboard_content DROP INDEX idx_client_dashboard_content_event',
  'SELECT 1'
);

PREPARE stmt_drop_idx_client_dashboard_content_event FROM @drop_idx_client_dashboard_content_event;
EXECUTE stmt_drop_idx_client_dashboard_content_event;
DEALLOCATE PREPARE stmt_drop_idx_client_dashboard_content_event;

SET @client_dashboard_content_event_id_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_dashboard_content'
    AND COLUMN_NAME = 'event_id'
);

SET @drop_client_dashboard_content_event_id = IF(
  @client_dashboard_content_event_id_exists > 0,
  'ALTER TABLE client_dashboard_content DROP COLUMN event_id',
  'SELECT 1'
);

PREPARE stmt_drop_client_dashboard_content_event_id FROM @drop_client_dashboard_content_event_id;
EXECUTE stmt_drop_client_dashboard_content_event_id;
DEALLOCATE PREPARE stmt_drop_client_dashboard_content_event_id;
