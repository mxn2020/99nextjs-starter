-- MySQL migration script for audit logs table
-- Run this script to create the audit logs table with proper indexes

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  timestamp DATETIME(3) NOT NULL,
  action VARCHAR(100) NOT NULL,
  actor_id VARCHAR(255) NOT NULL,
  actor_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  resource_type VARCHAR(100),
  level ENUM('debug', 'info', 'warn', 'error') NOT NULL DEFAULT 'info',
  description TEXT NOT NULL,
  metadata JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  context JSON NOT NULL,
  correlation_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for optimal query performance
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, actor_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_id, resource_type);
CREATE INDEX idx_audit_logs_level ON audit_logs(level);
CREATE INDEX idx_audit_logs_correlation ON audit_logs(correlation_id);

-- Composite indexes for common query patterns
CREATE INDEX idx_audit_logs_actor_time ON audit_logs(actor_id, timestamp);
CREATE INDEX idx_audit_logs_resource_time ON audit_logs(resource_id, timestamp);
CREATE INDEX idx_audit_logs_action_time ON audit_logs(action, timestamp);

-- Full-text search index for description
ALTER TABLE audit_logs ADD FULLTEXT(description);

-- Optional: Create a procedure for efficient cleanup of old records
DELIMITER //

CREATE PROCEDURE CleanupOldAuditLogs(IN older_than_days INT)
BEGIN
  DECLARE deleted_count INT DEFAULT 0;
  
  DELETE FROM audit_logs 
  WHERE timestamp < DATE_SUB(NOW(), INTERVAL older_than_days DAY);
  
  SET deleted_count = ROW_COUNT();
  SELECT deleted_count as deleted_records;
END //

DELIMITER ;

-- Example usage of cleanup procedure:
-- CALL CleanupOldAuditLogs(90); -- Remove records older than 90 days

-- Create a view for easier querying with computed columns
CREATE VIEW audit_logs_view AS
SELECT 
  id,
  timestamp,
  action,
  actor_id,
  actor_type,
  resource_id,
  resource_type,
  level,
  description,
  metadata,
  ip_address,
  user_agent,
  context,
  correlation_id,
  created_at,
  updated_at,
  -- Additional computed columns
  TIMESTAMPDIFF(SECOND, created_at, updated_at) as duration_seconds,
  DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour_bucket,
  DATE(timestamp) as day_bucket
FROM audit_logs;
