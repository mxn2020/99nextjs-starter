import { createConnection, createPool, Pool, PoolConnection, RowDataPacket, OkPacket } from 'mysql2/promise';
import { AuditAdapter, AuditEvent, AuditEventFilter, PaginatedResult, AuditStats } from '../../types';
import { sanitizeData } from '../../utils';

export interface MySQLAdapterConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  acquireTimeout?: number;
  timeout?: number;
  ssl?: any;
}

interface AuditEventRow extends RowDataPacket {
  id: string;
  timestamp: Date;
  action: string;
  actor_id: string;
  actor_type: string;
  resource_id: string | null;
  resource_type: string | null;
  level: string;
  description: string;
  metadata: string;
  ip_address: string | null;
  user_agent: string | null;
  context: string;
  correlation_id: string | null;
}

export class MySQLAdapter implements AuditAdapter {
  private pool: Pool;
  private tableName: string;

  constructor(config: MySQLAdapterConfig, tableName = 'audit_logs') {
    this.tableName = tableName;
    this.pool = createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: config.connectionLimit || 10,
      acquireTimeout: config.acquireTimeout || 60000,
      timeout: config.timeout || 60000,
      ssl: config.ssl,
      dateStrings: false,
      supportBigNumbers: true,
      bigNumberStrings: false,
    });
  }

  async initialize(): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      // Create table if it doesn't exist
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
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
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_timestamp (timestamp),
          INDEX idx_action (action),
          INDEX idx_actor (actor_id, actor_type),
          INDEX idx_resource (resource_id, resource_type),
          INDEX idx_level (level),
          INDEX idx_correlation (correlation_id),
          INDEX idx_composite_actor_time (actor_id, timestamp),
          INDEX idx_composite_resource_time (resource_id, timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Create full-text index for description
      await connection.execute(`
        ALTER TABLE ${this.tableName} 
        ADD FULLTEXT(description)
      `).catch(() => {
        // Ignore if already exists
      });
    } finally {
      connection.release();
    }
  }

  async log(event: AuditEvent): Promise<void> {
    const sanitizedEvent = sanitizeData(event);
    
    const query = `
      INSERT INTO ${this.tableName} (
        id, timestamp, action, actor_id, actor_type, resource_id, resource_type,
        level, description, metadata, ip_address, user_agent, context, correlation_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      sanitizedEvent.id,
      sanitizedEvent.timestamp,
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
      sanitizedEvent.correlationId || null,
    ];

    await this.pool.execute(query, values);
  }

  async logBatch(events: AuditEvent[]): Promise<void> {
    if (events.length === 0) return;

    const sanitizedEvents = events.map(event => sanitizeData(event));
    
    const query = `
      INSERT INTO ${this.tableName} (
        id, timestamp, action, actor_id, actor_type, resource_id, resource_type,
        level, description, metadata, ip_address, user_agent, context, correlation_id
      ) VALUES ${sanitizedEvents.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
    `;

    const values = sanitizedEvents.flatMap(event => [
      event.id,
      event.timestamp,
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
      event.correlationId || null,
    ]);

    await this.pool.execute(query, values);
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
      values.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push('timestamp <= ?');
      values.push(filter.endDate);
    }

    if (filter.search) {
      conditions.push('MATCH(description) AGAINST(? IN BOOLEAN MODE)');
      values.push(filter.search);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = filter.sortBy ? `ORDER BY ${filter.sortBy} ${filter.sortOrder || 'DESC'}` : 'ORDER BY timestamp DESC';
    const limit = filter.limit || 100;
    const offset = filter.offset || 0;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const [countResult] = await this.pool.execute<RowDataPacket[]>(countQuery, values);
    const total = countResult[0].total;

    // Get data
    const dataQuery = `
      SELECT * FROM ${this.tableName} 
      ${whereClause} 
      ${orderBy} 
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await this.pool.execute<AuditEventRow[]>(dataQuery, [...values, limit, offset]);

    const events: AuditEvent[] = rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      action: row.action as any,
      actorId: row.actor_id,
      actorType: row.actor_type as any,
      resourceId: row.resource_id || undefined,
      resourceType: row.resource_type as any || undefined,
      level: row.level as any,
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
      values.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push('timestamp <= ?');
      values.push(filter.endDate);
    }

    if (filter.search) {
      conditions.push('MATCH(description) AGAINST(? IN BOOLEAN MODE)');
      values.push(filter.search);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    
    const [result] = await this.pool.execute<RowDataPacket[]>(query, values);
    return result[0].total;
  }

  async getStats(filter: AuditEventFilter): Promise<AuditStats> {
    const conditions: string[] = [];
    const values: any[] = [];

    // Build WHERE conditions for date range
    if (filter.startDate) {
      conditions.push('timestamp >= ?');
      values.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push('timestamp <= ?');
      values.push(filter.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get action counts
    const actionQuery = `
      SELECT action, COUNT(*) as count 
      FROM ${this.tableName} ${whereClause}
      GROUP BY action 
      ORDER BY count DESC
    `;
    const [actionResult] = await this.pool.execute<RowDataPacket[]>(actionQuery, values);
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
    const [levelResult] = await this.pool.execute<RowDataPacket[]>(levelQuery, values);
    const levelCounts: Record<string, number> = {};
    levelResult.forEach(row => {
      levelCounts[row.level] = row.count;
    });

    // Get total events
    const totalQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const [totalResult] = await this.pool.execute<RowDataPacket[]>(totalQuery, values);
    const totalEvents = totalResult[0].total;

    return {
      totalEvents,
      actionCounts,
      levelCounts,
    };
  }

  async purge(olderThan: Date): Promise<number> {
    const query = `DELETE FROM ${this.tableName} WHERE timestamp < ?`;
    const [result] = await this.pool.execute<OkPacket>(query, [olderThan]);
    return result.affectedRows || 0;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const [result] = await this.pool.execute<RowDataPacket[]>('SELECT 1 as healthy');
      return result[0].healthy === 1;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
