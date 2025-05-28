import type { Pool, PoolClient } from 'pg';
import type { 
  AuditAdapter, 
  AuditEvent, 
  AuditFilter, 
  AuditStats, 
  AdapterConfig 
} from '../../types';
import { adapterConfigSchema, auditFilterSchema } from '../../schemas';
import { retry } from '../../utils';

export interface PostgreSQLAdapterConfig extends AdapterConfig {
  pool?: Pool;
  connectionString?: string;
  tableName?: string;
  createTable?: boolean;
}

export class PostgreSQLAuditAdapter implements AuditAdapter {
  private pool: Pool;
  private config: Required<Pick<PostgreSQLAdapterConfig, 'tableName' | 'createTable'>>;
  private isInitialized = false;

  constructor(config: PostgreSQLAdapterConfig) {
    if (!config.pool && !config.connectionString) {
      throw new Error('Either pool or connectionString must be provided');
    }

    this.pool = config.pool || this.createPool(config.connectionString!);
    this.config = {
      tableName: config.tableName || 'audit_logs',
      createTable: config.createTable ?? true,
    };
  }

  private createPool(connectionString: string): Pool {
    const { Pool } = require('pg');
    return new Pool({ connectionString });
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.config.createTable) {
      await this.createTableIfNotExists();
    }

    this.isInitialized = true;
  }

  private async createTableIfNotExists(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.config.tableName} (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        action VARCHAR(50) NOT NULL,
        resource VARCHAR(50) NOT NULL,
        resource_id VARCHAR(255),
        level VARCHAR(20) NOT NULL,
        actor_id VARCHAR(255),
        actor_type VARCHAR(20),
        target_id VARCHAR(255),
        target_type VARCHAR(255),
        description TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        context JSONB,
        old_values JSONB,
        new_values JSONB,
        error JSONB,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_${this.config.tableName}_timestamp 
        ON ${this.config.tableName} (timestamp);
      CREATE INDEX IF NOT EXISTS idx_${this.config.tableName}_action 
        ON ${this.config.tableName} (action);
      CREATE INDEX IF NOT EXISTS idx_${this.config.tableName}_resource 
        ON ${this.config.tableName} (resource);
      CREATE INDEX IF NOT EXISTS idx_${this.config.tableName}_actor_id 
        ON ${this.config.tableName} (actor_id);
      CREATE INDEX IF NOT EXISTS idx_${this.config.tableName}_level 
        ON ${this.config.tableName} (level);
      CREATE INDEX IF NOT EXISTS idx_${this.config.tableName}_success 
        ON ${this.config.tableName} (success);
    `;

    await this.pool.query(createTableSQL);
  }

  async log(event: AuditEvent): Promise<void> {
    await this.initialize();
    
    const sql = `
      INSERT INTO ${this.config.tableName} (
        id, timestamp, action, resource, resource_id, level,
        actor_id, actor_type, target_id, target_type, description,
        success, context, old_values, new_values, error, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `;

    const values = [
      event.id,
      event.timestamp,
      event.action,
      event.resource,
      event.resourceId,
      event.level,
      event.actorId,
      event.actorType,
      event.targetId,
      event.targetType,
      event.description,
      event.success,
      event.context ? JSON.stringify(event.context) : null,
      event.oldValues ? JSON.stringify(event.oldValues) : null,
      event.newValues ? JSON.stringify(event.newValues) : null,
      event.error ? JSON.stringify(event.error) : null,
      event.metadata ? JSON.stringify(event.metadata) : null,
    ];

    await retry(() => this.pool.query(sql, values));
  }

  async logBatch(events: AuditEvent[]): Promise<void> {
    if (events.length === 0) return;
    
    await this.initialize();

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const event of events) {
        const sql = `
          INSERT INTO ${this.config.tableName} (
            id, timestamp, action, resource, resource_id, level,
            actor_id, actor_type, target_id, target_type, description,
            success, context, old_values, new_values, error, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `;

        const values = [
          event.id,
          event.timestamp,
          event.action,
          event.resource,
          event.resourceId,
          event.level,
          event.actorId,
          event.actorType,
          event.targetId,
          event.targetType,
          event.description,
          event.success,
          event.context ? JSON.stringify(event.context) : null,
          event.oldValues ? JSON.stringify(event.oldValues) : null,
          event.newValues ? JSON.stringify(event.newValues) : null,
          event.error ? JSON.stringify(event.error) : null,
          event.metadata ? JSON.stringify(event.metadata) : null,
        ];

        await client.query(sql, values);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    await this.initialize();
    
    const validatedFilter = auditFilterSchema.parse(filter);
    const { whereClause, values } = this.buildWhereClause(validatedFilter);

    const sql = `
      SELECT 
        id, timestamp, action, resource, resource_id, level,
        actor_id, actor_type, target_id, target_type, description,
        success, context, old_values, new_values, error, metadata
      FROM ${this.config.tableName}
      ${whereClause}
      ORDER BY ${validatedFilter.sortBy} ${validatedFilter.sortOrder}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const result = await this.pool.query(sql, [
      ...values,
      validatedFilter.limit,
      validatedFilter.offset,
    ]);

    return result.rows.map(this.mapRowToEvent);
  }

  async count(filter: Omit<AuditFilter, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>): Promise<number> {
    await this.initialize();
    
    const { whereClause, values } = this.buildWhereClause(filter);
    const sql = `SELECT COUNT(*) as count FROM ${this.config.tableName} ${whereClause}`;
    
    const result = await this.pool.query(sql, values);
    return parseInt(result.rows[0].count);
  }

  async getStats(filter: { startDate?: Date; endDate?: Date } = {}): Promise<AuditStats> {
    await this.initialize();
    
    const { whereClause, values } = this.buildWhereClause(filter);

    // Get total count
    const totalResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM ${this.config.tableName} ${whereClause}`,
      values
    );
    const totalEvents = parseInt(totalResult.rows[0].count);

    // Get events by action
    const actionResult = await this.pool.query(
      `SELECT action, COUNT(*) as count FROM ${this.config.tableName} ${whereClause} GROUP BY action`,
      values
    );
    const eventsByAction = actionResult.rows.reduce((acc, row) => {
      acc[row.action] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Get events by resource
    const resourceResult = await this.pool.query(
      `SELECT resource, COUNT(*) as count FROM ${this.config.tableName} ${whereClause} GROUP BY resource`,
      values
    );
    const eventsByResource = resourceResult.rows.reduce((acc, row) => {
      acc[row.resource] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Get events by level
    const levelResult = await this.pool.query(
      `SELECT level, COUNT(*) as count FROM ${this.config.tableName} ${whereClause} GROUP BY level`,
      values
    );
    const eventsByLevel = levelResult.rows.reduce((acc, row) => {
      acc[row.level] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Get success rate
    const successResult = await this.pool.query(
      `SELECT success, COUNT(*) as count FROM ${this.config.tableName} ${whereClause} GROUP BY success`,
      values
    );
    const successCount = successResult.rows.find(row => row.success)?.count || 0;
    const successRate = totalEvents > 0 ? (parseInt(successCount) / totalEvents) * 100 : 0;

    // Get time range
    const timeRangeResult = await this.pool.query(
      `SELECT MIN(timestamp) as start, MAX(timestamp) as end FROM ${this.config.tableName} ${whereClause}`,
      values
    );
    const timeRange = {
      start: timeRangeResult.rows[0].start || new Date(),
      end: timeRangeResult.rows[0].end || new Date(),
    };

    return {
      totalEvents,
      eventsByAction,
      eventsByResource,
      eventsByLevel,
      successRate,
      timeRange,
    };
  }

  async purge(olderThan: Date): Promise<number> {
    await this.initialize();
    
    const sql = `DELETE FROM ${this.config.tableName} WHERE timestamp < $1`;
    const result = await this.pool.query(sql, [olderThan]);
    return result.rowCount || 0;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private buildWhereClause(filter: any): { whereClause: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filter.startDate) {
      conditions.push(`timestamp >= $${values.length + 1}`);
      values.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push(`timestamp <= $${values.length + 1}`);
      values.push(filter.endDate);
    }

    if (filter.actions?.length) {
      conditions.push(`action = ANY($${values.length + 1})`);
      values.push(filter.actions);
    }

    if (filter.resources?.length) {
      conditions.push(`resource = ANY($${values.length + 1})`);
      values.push(filter.resources);
    }

    if (filter.levels?.length) {
      conditions.push(`level = ANY($${values.length + 1})`);
      values.push(filter.levels);
    }

    if (filter.actorIds?.length) {
      conditions.push(`actor_id = ANY($${values.length + 1})`);
      values.push(filter.actorIds);
    }

    if (typeof filter.success === 'boolean') {
      conditions.push(`success = $${values.length + 1}`);
      values.push(filter.success);
    }

    if (filter.search) {
      conditions.push(`(description ILIKE $${values.length + 1} OR actor_id ILIKE $${values.length + 1})`);
      values.push(`%${filter.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values };
  }

  private mapRowToEvent(row: any): AuditEvent {
    return {
      id: row.id,
      timestamp: row.timestamp,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      level: row.level,
      actorId: row.actor_id,
      actorType: row.actor_type,
      targetId: row.target_id,
      targetType: row.target_type,
      description: row.description,
      success: row.success,
      context: row.context ? JSON.parse(row.context) : undefined,
      oldValues: row.old_values ? JSON.parse(row.old_values) : undefined,
      newValues: row.new_values ? JSON.parse(row.new_values) : undefined,
      error: row.error ? JSON.parse(row.error) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
