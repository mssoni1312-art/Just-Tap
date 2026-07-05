-- Migration 021: Dynamic feedback questionnaire (admin-managed questions + guest responses)
USE justtap;

CREATE TABLE IF NOT EXISTS feedback_questions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)        NOT NULL DEFAULT (UUID()),
  question_text TEXT            NOT NULL,
  question_type ENUM('rating', 'text', 'single_choice', 'multiple_choice', 'yes_no') NOT NULL DEFAULT 'text',
  options       JSON            NULL,
  is_required   TINYINT(1)      NOT NULL DEFAULT 1,
  sort_order    INT UNSIGNED    NOT NULL DEFAULT 0,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  event_id      BIGINT UNSIGNED NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_feedback_questions_uuid (uuid),
  KEY idx_feedback_questions_event (event_id),
  KEY idx_feedback_questions_active (is_active),
  KEY idx_feedback_questions_sort (sort_order),
  KEY idx_feedback_questions_deleted_at (deleted_at),
  CONSTRAINT fk_feedback_questions_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid        CHAR(36)        NOT NULL DEFAULT (UUID()),
  event_id    BIGINT UNSIGNED NOT NULL,
  client_name VARCHAR(150)    NULL,
  table_no    VARCHAR(20)     NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_feedback_submissions_uuid (uuid),
  KEY idx_feedback_submissions_event (event_id),
  KEY idx_feedback_submissions_created (created_at),
  CONSTRAINT fk_feedback_submissions_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback_question_responses (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL DEFAULT (UUID()),
  submission_id   BIGINT UNSIGNED NOT NULL,
  question_id     BIGINT UNSIGNED NOT NULL,
  answer_text     TEXT            NULL,
  answer_rating   DECIMAL(2, 1)   NULL,
  answer_options  JSON            NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_feedback_question_responses_uuid (uuid),
  KEY idx_feedback_responses_submission (submission_id),
  KEY idx_feedback_responses_question (question_id),
  CONSTRAINT fk_feedback_responses_submission
    FOREIGN KEY (submission_id) REFERENCES feedback_submissions (id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_responses_question
    FOREIGN KEY (question_id) REFERENCES feedback_questions (id) ON DELETE CASCADE,
  CONSTRAINT chk_feedback_responses_rating CHECK (answer_rating IS NULL OR (answer_rating >= 1.0 AND answer_rating <= 5.0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
