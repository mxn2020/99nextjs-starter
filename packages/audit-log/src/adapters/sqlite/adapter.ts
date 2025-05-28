import Database from 'better-sqlite3';
import { AuditAdapter, AuditEvent, AuditEventFilter, PaginatedResult, AuditStats } from '../../types';
import { sanitizeData } from '../../utils';

export interface SQLiteAdapterConfig {
  path: string;
  options?: Database.Options;
}

export class SQLiteAdapter implements AuditAdapter {
  private db: Database.Database;
  private tableName: string;

  constructor(config: SQLiteAdapterConfig, tableName = 'audit_logs') {
    this.tableName = tableName;
    this.db = new Database(config.path, config.options);
    
    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('foreign_keys = ON');
  }

  async initialize(): Promise<void> {
    // Create table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        action TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        actor_type TEXT NOT NULL,
        resource_id TEXT,
        resource_type TEXT,
        level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')) DEFAULT 'info',
        description TEXT NOT NULL,
        metadata TEXT,
        ip_address TEXT,
        user_agent TEXT,
        context TEXT NOT NULL,
        correlation_id TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_timestamp ON ${this.tableName}(timestamp);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_action ON ${this.tableName}(action);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_actor ON ${this.tableName}(actor_id, actor_type);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_resource ON ${this.tableName}(resource_id, resource_type);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_level ON ${this.tableName}(level);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_correlation ON ${this.tableName}(correlation_id);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_composite_actor_time ON ${this.tableName}(actor_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_composite_resource_time ON ${this.tableName}(resource_id, timestamp);
    `);

    // Create FTS virtual table for full-text search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS ${this.tableName}_fts USING fts5(
        id UNINDEXED,
        description,
        content=${this.tableName},
        content_rowid=rowid
      )
    `);

    // Create triggers to keep FTS table in sync
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS ${this.tableName}_fts_insert AFTER INSERT ON ${this.tableName} BEGIN
        INSERT INTO ${this.tableName}_fts(rowid, id, description) VALUES (new.rowid, new.id, new.description);
      END;
      
      CREATE TRIGGER IF NOT EXISTS ${this.tableName}_fts_delete AFTER DELETE ON ${this.tableName} BEGIN
        INSERT INTO ${this.tableName}_fts(${this.tableName}_fts, rowid, id, description) VALUES('delete', old.rowid, old.id, old.description);
      END;
      
      CREATE TRIGGER IF NOT EXISTS ${this.tableName}_fts_update AFTER UPDATE ON ${this.tableName} BEGIN
        INSERT INTO ${this.tableName}_fts(${this.tableName}_fts, rowid, id, description) VALUES('delete', old.rowid, old.id, old.description);
        INSERT INTO ${this.tableName}_fts(rowid, id, description) VALUES (new.rowid, new.id, new.description);
      END;
    `);
  }

  async log(event: AuditEvent): Promise<void> {
    const sanitizedEvent = sanitizeData(event);
    
    const stmt = this.db.prepare(`
      INSERT INTO ${this.tableName} (
        id, timestamp, action, actor_id, actor_type, resource_id, resource_type,
        level, description, metadata, ip_address, user_agent, context, correlation_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      sanitizedEvent.id,
      sanitizedEvent.timestamp.getTime(),
      sanitizedEvent.action,
      sanitizedEvent.actorId,
      sanitizedEvent.actorType,
      sanitizedEvent.resourceId || null,
      sanitizedEvent.resourceType || null,
      sanitizedEvent.level,
      sanitizedEvent.description,
      JSON.stringify(sanitizedEvent.metadata || {}),
      sanitizedEvent.ipAddress || null,
      sanitizedEvent.userAgent || null,
      JSON.stringify(sanitizedEvent.context),
      sanitizedEvent.correlationId || null
    );
  }

  async logBatch(events: AuditEvent[]): Promise<void> {
    if (events.length === 0) return;

    const sanitizedEvents = events.map(event => sanitizeData(event));
    
    const stmt = this.db.prepare(`
      INSERT INTO ${this.tableName} (
        id, timestamp, action, actor_id, actor_type, resource_id, resource_type,
        level, description, metadata, ip_address, user_agent, context, correlation_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((events: any[]) => {
      for (const event of events) {
        stmt.run(
          event.id,
          event.timestamp.getTime(),
          event.action,
          event.actorId,
          event.actorType,
          event.resourceId || null,
          event.resourceType || null,
          event.level,
          event.description,
          JSON.stringify(event.metadata || {}),
          event.ipAddress || null,
          event.userAgent || null,
          JSON.stringify(event.context),
          event.correlationId || null
        );
      }
    });

    transaction(sanitizedEvents);
  }

  async query(filter: AuditEventFilter): Promise<PaginatedResult<AuditEvent>> {
    const conditions: string[] = [];
    const values: any[] = [];

    // Build WHERE conditions
    if (filter.actorId) {
      conditions.push('actor_id = ?');
      values.push(filter.actorId);
    }

    if (filter.actorType) {
      conditions.push('actor_type = ?');
      values.push(filter.actorType);
    }

    if (filter.resourceId) {
      conditions.push('resource_id = ?');
      values.push(filter.resourceId);
    }

    if (filter.resourceType) {
      conditions.push('resource_type = ?');
      values.push(filter.resourceType);
    }

    if (filter.action) {
      conditions.push('action = ?');
      values.push(filter.action);
    }

    if (filter.level) {
      conditions.push('level = ?');
      values.push(filter.level);
    }

    if (filter.correlationId) {
      conditions.push('correlation_id = ?');
      values.push(filter.correlationId);
    }

    if (filter.startDate) {
      conditions.push('timestamp >= ?');
      values.push(filter.startDate.getTime());
    }

    if (filter.endDate) {
      conditions.push('timestamp <= ?');
      values.push(filter.endDate.getTime());
    }

    let fromClause = this.tableName;
    if (filter.search) {
      fromClause = `${this.tableName} INNER JOIN ${this.tableName}_fts ON ${this.tableName}.id = ${this.tableName}_fts.id`;
      conditions.push(`${this.tableName}_fts MATCH ?`);
      values.push(filter.search);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = filter.sortBy ? `ORDER BY ${filter.sortBy} ${filter.sortOrder || 'DESC'}` : 'ORDER BY timestamp DESC';
    const limit = filter.limit || 100;
    const offset = filter.offset || 0;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${fromClause} ${whereClause}`;
    const countResult = this.db.prepare(countQuery).get(values) as { total: number };
    const total = countResult.total;

    // Get data
    const dataQuery = `
      SELECT ${this.tableName}.* FROM ${fromClause} 
      ${whereClause} 
      ${orderBy} 
      LIMIT ? OFFSET ?
    `;
    
    const rows = this.db.prepare(dataQuery).all([...values, limit, offset]) as any[];

    const events: AuditEvent[] = rows.map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      action: row.action,
      actorId: row.actor_id,
      actorType: row.actor_type,
      resourceId: row.resource_id || undefined,
      resourceType: row.resource_type || undefined,
      level: row.level,
      description: row.description,
      metadata: JSON.parse(row.metadata || '{}'),
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      context: JSON.parse(row.context),
      correlationId: row.correlation_id || undefined,
    }));

    return {
      data: events,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
    };
  }

  async count(filter: AuditEventFilter): Promise<number> {
    const conditions: string[] = [];
    const values: any[] = [];

    // Build WHERE conditions (same as query method)
    if (filter.actorId) {
      conditions.push('actor_id = ?');
      values.push(filter.actorId);
    }

    if (filter.actorType) {
      conditions.push('actor_type = ?');
      values.push(filter.actorType);
    }

    if (filter.resourceId) {
      conditions.push('resource_id = ?');
      values.push(filter.resourceId);
    }

    if (filter.resourceType) {
      conditions.push('resource_type = ?');
      values.push(filter.resourceType);
    }

    if (filter.action) {
      conditions.push('action = ?');
      values.push(filter.action);
    }

    if (filter.level) {
      conditions.push('level = ?');
      values.push(filter.level);
    }

    if (filter.correlationId) {
      conditions.push('correlation_id = ?');
      values.push(filter.correlationId);
    }

    if (filter.startDate) {
      conditions.push('timestamp >= ?');
      values.push(filter.startDate.getTime());
    }

    if (filter.endDate) {
      conditions.push('timestamp <= ?');
      values.push(filter.endDate.getTime());
    }

    let fromClause = this.tableName;
    if (filter.search) {
      fromClause = `${this.tableName} INNER JOIN ${this.tableName}_fts ON ${this.tableName}.id = ${this.tableName}_fts.id`;
      conditions.push(`${this.tableName}_fts MATCH ?`);
      values.push(filter.search);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT COUNT(*) as total FROM ${fromClause} ${whereClause}`;
    
    const result = this.db.prepare(query).get(values) as { total: number };
    return result.total;
  }

  async getStats(filter: AuditEventFilter): Promise<AuditStats> {
    const conditions: string[] = [];
    const values: any[] = [];

    // Build WHERE conditions for date range
    if (filter.startDate) {
      conditions.push('timestamp >= ?');
      values.push(filter.startDate.getTime());
    }

    if (filter.endDate) {
      conditions.push('timestamp <= ?');
      values.push(filter.endDate.getTime());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get action counts
    const actionQuery = `
      SELECT action, COUNT(*) as count 
      FROM ${this.tableName} ${whereClause}
      GROUP BY action 
      ORDER BY count DESC
    `;
    const actionResult = this.db.prepare(actionQuery).all(values) as Array<{ action: string; count: number }>;
    const actionCounts: Record<string, number> = {};
    actionResult.forEach(row => {
      actionCounts[row.action] = row.count;
    });

    // Get level counts
    const levelQuery = `
      SELECT level, COUNT(*) as count 
      FROM ${this.tableName} ${whereClause}
      GROUP BY level
    `;
    const levelResult = this.db.prepare(levelQuery).all(values) as Array<{ level: string; count: number }>;
    const levelCounts: Record<string, number> = {};
    levelResult.forEach(row => {
      levelCounts[row.level] = row.count;
    });

    // Get total events
    const totalQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const totalResult = this.db.prepare(totalQuery).get(values) as { total: number };
    const totalEvents = totalResult.total;

    return {
      totalEvents,
      actionCounts,
      levelCounts,
    };
  }

  async purge(olderThan: Date): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE timestamp < ?`);
    const result = stmt.run(olderThan.getTime());
    return result.changes;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = this.db.prepare('SELECT 1 as healthy').get() as { healthy: number };
      return result.healthy === 1;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
