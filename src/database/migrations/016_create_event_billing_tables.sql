-- Migration 016: Event billing & finances (Save & Preview for client app)

CREATE TABLE IF NOT EXISTS event_billing (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id      BIGINT UNSIGNED NOT NULL,
  show_to_client TINYINT(1)     NOT NULL DEFAULT 0,
  cgst_percent  DECIMAL(5, 2)   NULL,
  cgst_amount   DECIMAL(12, 2)  NULL,
  sgst_percent  DECIMAL(5, 2)   NULL,
  sgst_amount   DECIMAL(12, 2)  NULL,
  discount      DECIMAL(12, 2)  NULL DEFAULT 0,
  round_off     DECIMAL(12, 2)  NULL DEFAULT 0,
  grand_total   DECIMAL(12, 2)  NULL,
  notes         TEXT            NULL,
  previewed_at  DATETIME        NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_billing_event (event_id),
  KEY idx_event_billing_show_client (show_to_client),
  KEY idx_event_billing_deleted_at (deleted_at),
  CONSTRAINT fk_event_billing_event
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_billing_functions (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  billing_id        BIGINT UNSIGNED NOT NULL,
  event_function_id BIGINT UNSIGNED NULL,
  name              VARCHAR(150)    NOT NULL,
  function_date     DATE            NULL,
  start_time        TIME            NULL,
  pax               INT UNSIGNED    NULL,
  extra_charges     DECIMAL(12, 2)  NULL DEFAULT 0,
  rate_per_plate    DECIMAL(12, 2)  NULL,
  amount            DECIMAL(12, 2)  NULL,
  sort_order        INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME        NULL,
  PRIMARY KEY (id),
  KEY idx_ebf_billing (billing_id),
  KEY idx_ebf_event_function (event_function_id),
  KEY idx_ebf_deleted_at (deleted_at),
  CONSTRAINT fk_ebf_billing
    FOREIGN KEY (billing_id) REFERENCES event_billing (id) ON DELETE CASCADE,
  CONSTRAINT fk_ebf_event_function
    FOREIGN KEY (event_function_id) REFERENCES event_functions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_billing_function_charges (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  billing_function_id BIGINT UNSIGNED NOT NULL,
  label               VARCHAR(255)    NOT NULL,
  amount              DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  sort_order          INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME        NULL,
  PRIMARY KEY (id),
  KEY idx_ebfc_function (billing_function_id),
  KEY idx_ebfc_deleted_at (deleted_at),
  CONSTRAINT fk_ebfc_function
    FOREIGN KEY (billing_function_id) REFERENCES event_billing_functions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_billing_payments (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  billing_id  BIGINT UNSIGNED NOT NULL,
  amount      DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  paid_at     DATETIME        NULL,
  description VARCHAR(255)    NULL,
  sort_order  INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME        NULL,
  PRIMARY KEY (id),
  KEY idx_ebp_billing (billing_id),
  KEY idx_ebp_deleted_at (deleted_at),
  CONSTRAINT fk_ebp_billing
    FOREIGN KEY (billing_id) REFERENCES event_billing (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
