-- QUANDA production backend: initial persistence and analytics schema.
-- Compatible with MySQL/MariaDB using InnoDB and utf8mb4.

CREATE TABLE IF NOT EXISTS synthetic_scenarios (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(140) NOT NULL,
  configuration_json LONGTEXT NOT NULL,
  random_seed VARCHAR(128) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_synthetic_scenarios_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  account_type VARCHAR(20) NOT NULL DEFAULT 'anonymous',
  created_at DATETIME(3) NOT NULL,
  last_seen_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  is_synthetic TINYINT(1) NOT NULL DEFAULT 0,
  scenario_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  PRIMARY KEY (id),
  KEY idx_users_created_at (created_at),
  KEY idx_users_last_seen_at (last_seen_at),
  KEY idx_users_synthetic_created (is_synthetic, created_at),
  KEY idx_users_scenario (scenario_id),
  CONSTRAINT fk_users_scenario
    FOREIGN KEY (scenario_id) REFERENCES synthetic_scenarios (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS anonymous_credentials (
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  token_hash BINARY(32) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  last_used_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_anonymous_credentials_token_hash (token_hash),
  KEY idx_anonymous_credentials_last_used (last_used_at),
  CONSTRAINT fk_anonymous_credentials_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  token_hash BINARY(32) NOT NULL,
  started_at DATETIME(3) NOT NULL,
  last_seen_at DATETIME(3) NOT NULL,
  ended_at DATETIME(3) NULL,
  client_metadata LONGTEXT NULL,
  is_synthetic TINYINT(1) NOT NULL DEFAULT 0,
  scenario_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token_hash (token_hash),
  KEY idx_sessions_user_started (user_id, started_at),
  KEY idx_sessions_user_last_seen (user_id, last_seen_at),
  KEY idx_sessions_last_seen_at (last_seen_at),
  KEY idx_sessions_synthetic_started (is_synthetic, started_at),
  KEY idx_sessions_scenario (scenario_id),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_sessions_scenario
    FOREIGN KEY (scenario_id) REFERENCES synthetic_scenarios (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  client_project_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  schema_version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  title VARCHAR(140) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  input_fingerprint VARCHAR(200) NULL,
  project_data LONGTEXT NOT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  completed_at DATETIME(3) NULL,
  deleted_at DATETIME(3) NULL,
  is_synthetic TINYINT(1) NOT NULL DEFAULT 0,
  scenario_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_user_client_id (user_id, client_project_id),
  KEY idx_projects_user_updated (user_id, updated_at),
  KEY idx_projects_user_status (user_id, status),
  KEY idx_projects_synthetic_updated (is_synthetic, updated_at),
  KEY idx_projects_scenario (scenario_id),
  CONSTRAINT fk_projects_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_projects_scenario
    FOREIGN KEY (scenario_id) REFERENCES synthetic_scenarios (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  client_event_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  session_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  project_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  event_name VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  event_time DATETIME(3) NOT NULL,
  properties_json LONGTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  is_synthetic TINYINT(1) NOT NULL DEFAULT 0,
  scenario_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_events_client_event_id (client_event_id),
  KEY idx_events_user_time (user_id, event_time),
  KEY idx_events_session_time (session_id, event_time),
  KEY idx_events_project_time (project_id, event_time),
  KEY idx_events_name_time (event_name, event_time),
  KEY idx_events_time (event_time),
  KEY idx_events_synthetic_time (is_synthetic, event_time),
  KEY idx_events_scenario (scenario_id),
  CONSTRAINT fk_events_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_events_session
    FOREIGN KEY (session_id) REFERENCES sessions (id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_events_project
    FOREIGN KEY (project_id) REFERENCES projects (id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_events_scenario
    FOREIGN KEY (scenario_id) REFERENCES synthetic_scenarios (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
