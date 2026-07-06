-- Migration 029: Link event tasks to team allocation board (parent template + team type)
USE justtap;

ALTER TABLE event_tasks
  ADD COLUMN team_type ENUM('justTap', 'justSocial', 'photoVideo') NULL AFTER due_date,
  ADD COLUMN parent_task_template_id BIGINT UNSIGNED NULL AFTER team_type,
  ADD KEY idx_event_tasks_team_type (team_type),
  ADD KEY idx_event_tasks_parent_template (parent_task_template_id),
  ADD CONSTRAINT fk_event_tasks_parent_template
    FOREIGN KEY (parent_task_template_id) REFERENCES task_templates (id) ON DELETE SET NULL;
