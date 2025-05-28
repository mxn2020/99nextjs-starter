-- SQLite Migration Script for Audit Logs
-- Version: 001
-- Description: Create audit logs table with FTS support and optimized indexes

-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000; -- 64MB cache
PRAGMA temp_store = memory;
PRAGMA mmap_size = 268435456; -- 256MB mmap

-- Create main audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('low', 'medium', 'high', 'critical')),
    
    -- Actor information
    actor_id TEXT NOT NULL,
    actor_type TEXT NOT NULL,
    actor_name TEXT,
    actor_email TEXT,
    
    -- Resource information
    resource_id TEXT,
    resource_type TEXT,
    resource_name TEXT,
    
    -- Context and metadata (stored as JSON)
    context TEXT, -- JSON string
    metadata TEXT, -- JSON string
    
    -- Additional fields
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    duration_ms INTEGER,
    
    -- Indexing helpers (extracted from JSON for better performance)
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    request_id TEXT
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, actor_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id);

-- Composite indexes for common query combinations
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_action ON audit_logs(timestamp, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_timestamp ON audit_logs(actor_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_timestamp ON audit_logs(resource_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_level ON audit_logs(action, level);

-- Create FTS virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS audit_logs_fts USING fts5(
    id UNINDEXED,
    action,
    actor_name,
    actor_email,
    resource_name,
    context,
    metadata,
    error_message,
    content='audit_logs',
    content_rowid='rowid'
);

-- Triggers to keep FTS table in sync
CREATE TRIGGER IF NOT EXISTS audit_logs_fts_insert AFTER INSERT ON audit_logs
BEGIN
    INSERT INTO audit_logs_fts(
        rowid, id, action, actor_name, actor_email, 
        resource_name, context, metadata, error_message
    ) VALUES (
        NEW.rowid, NEW.id, NEW.action, NEW.actor_name, NEW.actor_email,
        NEW.resource_name, NEW.context, NEW.metadata, NEW.error_message
    );
END;

CREATE TRIGGER IF NOT EXISTS audit_logs_fts_delete AFTER DELETE ON audit_logs
BEGIN
    INSERT INTO audit_logs_fts(audit_logs_fts, rowid, id, action, actor_name, actor_email, resource_name, context, metadata, error_message) 
    VALUES('delete', OLD.rowid, OLD.id, OLD.action, OLD.actor_name, OLD.actor_email, OLD.resource_name, OLD.context, OLD.metadata, OLD.error_message);
END;

CREATE TRIGGER IF NOT EXISTS audit_logs_fts_update AFTER UPDATE ON audit_logs
BEGIN
    INSERT INTO audit_logs_fts(audit_logs_fts, rowid, id, action, actor_name, actor_email, resource_name, context, metadata, error_message) 
    VALUES('delete', OLD.rowid, OLD.id, OLD.action, OLD.actor_name, OLD.actor_email, OLD.resource_name, OLD.context, OLD.metadata, OLD.error_message);
    INSERT INTO audit_logs_fts(
        rowid, id, action, actor_name, actor_email, 
        resource_name, context, metadata, error_message
    ) VALUES (
        NEW.rowid, NEW.id, NEW.action, NEW.actor_name, NEW.actor_email,
        NEW.resource_name, NEW.context, NEW.metadata, NEW.error_message
    );
END;

-- Create view for common statistics queries
CREATE VIEW IF NOT EXISTS audit_stats AS
SELECT 
    DATE(timestamp) as date,
    action,
    level,
    actor_type,
    resource_type,
    success,
    COUNT(*) as count,
    AVG(duration_ms) as avg_duration_ms,
    MIN(timestamp) as first_occurrence,
    MAX(timestamp) as last_occurrence
FROM audit_logs
GROUP BY DATE(timestamp), action, level, actor_type, resource_type, success;

-- Create view for actor activity summary
CREATE VIEW IF NOT EXISTS actor_activity AS
SELECT 
    actor_id,
    actor_type,
    actor_name,
    actor_email,
    COUNT(*) as total_events,
    COUNT(CASE WHEN success = 1 THEN 1 END) as successful_events,
    COUNT(CASE WHEN success = 0 THEN 1 END) as failed_events,
    MIN(timestamp) as first_activity,
    MAX(timestamp) as last_activity,
    COUNT(DISTINCT action) as unique_actions,
    COUNT(DISTINCT resource_id) as unique_resources
FROM audit_logs
GROUP BY actor_id, actor_type, actor_name, actor_email;

-- Create view for resource access summary
CREATE VIEW IF NOT EXISTS resource_activity AS
SELECT 
    resource_id,
    resource_type,
    resource_name,
    COUNT(*) as total_accesses,
    COUNT(DISTINCT actor_id) as unique_actors,
    COUNT(DISTINCT action) as unique_actions,
    MIN(timestamp) as first_access,
    MAX(timestamp) as last_access,
    COUNT(CASE WHEN success = 1 THEN 1 END) as successful_accesses,
    COUNT(CASE WHEN success = 0 THEN 1 END) as failed_accesses
FROM audit_logs
WHERE resource_id IS NOT NULL
GROUP BY resource_id, resource_type, resource_name;

-- Create trigger for automatic cleanup of old records (optional)
-- This trigger runs daily and removes records older than 1 year
-- Uncomment if you want automatic cleanup
/*
CREATE TRIGGER IF NOT EXISTS audit_logs_cleanup
AFTER INSERT ON audit_logs
WHEN NEW.id = (SELECT id FROM audit_logs ORDER BY timestamp DESC LIMIT 1)
AND datetime('now', 'localtime') > datetime(NEW.timestamp, '+1 day')
BEGIN
    DELETE FROM audit_logs 
    WHERE timestamp < datetime('now', '-1 year');
END;
*/

-- Create indexes on views for better performance
CREATE INDEX IF NOT EXISTS idx_audit_stats_date ON audit_logs(DATE(timestamp));
CREATE INDEX IF NOT EXISTS idx_audit_stats_combo ON audit_logs(DATE(timestamp), action, level);

-- Analyze tables for query optimization
ANALYZE audit_logs;
ANALYZE audit_logs_fts;

-- Vacuum to optimize database
VACUUM;

-- Print completion message
SELECT 'SQLite audit logs migration completed successfully' as message;
