import { Mutex } from 'async-mutex';
import type { 
  AuditEvent, 
  AuditEventAction, 
  AuditLevel, 
  AuditResource, 
  AuditContext, 
  AuditAdapter, 
  AuditLoggerConfig,
  ActorType 
} from '../types';
import { auditEventSchema, auditLoggerConfigSchema } from '../schemas';
import { 
  generateAuditId, 
  createTimestamp, 
  sanitizeData, 
  calculateAuditLevel, 
  debounce, 
  retry 
} from '../utils';

export class AuditLogger {
  private adapter: AuditAdapter;
  private config: AuditLoggerConfig;
  private eventQueue: AuditEvent[] = [];
  private flushMutex = new Mutex();
  private flushTimeout: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor(adapter: AuditAdapter, config: Partial<AuditLoggerConfig> = {}) {
    this.adapter = adapter;
    this.config = auditLoggerConfigSchema.parse(config);
    
    // Setup automatic flushing
    this.scheduleFlush();
    
    // Setup graceful shutdown
    this.setupGracefulShutdown();
  }

  /**
   * Log a single audit event
   */
  async log(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enabled || this.isShuttingDown) {
      return;
    }

    // Apply filters
    if (!this.shouldLogEvent(eventData)) {
      return;
    }

    // Create complete event
    const event: AuditEvent = {
      id: generateAuditId(),
      timestamp: createTimestamp(),
      ...eventData,
      level: eventData.level || calculateAuditLevel(eventData.action, eventData.resource, eventData.success),
    };

    // Sanitize sensitive data
    if (this.config.sanitize.enabled) {
      event.oldValues = event.oldValues ? sanitizeData(
        event.oldValues, 
        this.config.sanitize.fields, 
        this.config.sanitize.replacement
      ) : undefined;
      
      event.newValues = event.newValues ? sanitizeData(
        event.newValues, 
        this.config.sanitize.fields, 
        this.config.sanitize.replacement
      ) : undefined;
      
      if (event.context?.custom) {
        event.context.custom = sanitizeData(
          event.context.custom, 
          this.config.sanitize.fields, 
          this.config.sanitize.replacement
        );
      }
    }

    // Add metadata
    event.metadata = {
      ...this.config.metadata,
      ...event.metadata,
    };

    // Validate event
    try {
      auditEventSchema.parse(event);
    } catch (error) {
      console.error('Invalid audit event:', error);
      return;
    }

    // Add to queue
    this.eventQueue.push(event);

    // Flush if queue is full or batching is disabled
    if (this.eventQueue.length >= this.config.batchSize || this.config.batchSize === 1) {
      await this.flush();
    }
  }

  /**
   * Log multiple events at once
   */
  async logBatch(events: Omit<AuditEvent, 'id' | 'timestamp'>[]): Promise<void> {
    for (const event of events) {
      await this.log(event);
    }
  }

  /**
   * Create a specialized logger for a specific resource
   */
  forResource(resource: AuditResource): ResourceAuditLogger {
    return new ResourceAuditLogger(this, resource);
  }

  /**
   * Create a specialized logger for a specific actor
   */
  forActor(actorId: string, actorType: ActorType = 'user'): ActorAuditLogger {
    return new ActorAuditLogger(this, actorId, actorType);
  }

  /**
   * Manually flush pending events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    await this.flushMutex.runExclusive(async () => {
      if (this.eventQueue.length === 0) {
        return;
      }

      const eventsToFlush = [...this.eventQueue];
      this.eventQueue = [];

      try {
        await retry(
          () => this.adapter.logBatch(eventsToFlush),
          this.config.maxRetries,
          this.config.retryDelay
        );
      } catch (error) {
        console.error('Failed to flush audit events after retries:', error);
        // Re-queue events for retry (at the beginning to maintain order)
        this.eventQueue.unshift(...eventsToFlush);
      }
    });
  }

  /**
   * Get audit statistics
   */
  async getStats(startDate?: Date, endDate?: Date) {
    return this.adapter.getStats({ startDate, endDate });
  }

  /**
   * Query audit events
   */
  async query(filter: Parameters<AuditAdapter['query']>[0]) {
    return this.adapter.query(filter);
  }

  /**
   * Count audit events
   */
  async count(filter: Parameters<AuditAdapter['count']>[0]) {
    return this.adapter.count(filter);
  }

  /**
   * Purge old audit events
   */
  async purge(olderThan: Date): Promise<number> {
    return this.adapter.purge(olderThan);
  }

  /**
   * Check adapter health
   */
  async healthCheck(): Promise<boolean> {
    return this.adapter.healthCheck();
  }

  /**
   * Gracefully shutdown the logger
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    // Clear flush timeout
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    // Flush remaining events
    await this.flush();

    // Close adapter
    await this.adapter.close();
  }

  private shouldLogEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): boolean {
    const { filters } = this.config;

    // Check level filter
    const eventLevel = event.level || calculateAuditLevel(event.action, event.resource, event.success);
    const levelPriority: Record<string, number> = { 
      debug: 0, info: 1, warn: 2, error: 3,
      low: 1, medium: 2, high: 3, critical: 4 
    };
    const configLevelPriority = levelPriority[this.config.level] ?? 0;
    const eventLevelPriority = levelPriority[eventLevel] ?? 0;
    
    if (eventLevelPriority < configLevelPriority) {
      return false;
    }

    // Check exclude filters
    if (filters.exclude) {
      if (filters.exclude.actions?.includes(event.action)) return false;
      if (filters.exclude.resources?.includes(event.resource)) return false;
      if (event.actorId && filters.exclude.actors?.includes(event.actorId)) return false;
    }

    // Check include filters (if specified, event must match)
    if (filters.include) {
      const hasIncludeFilters = 
        filters.include.actions?.length || 
        filters.include.resources?.length || 
        filters.include.actors?.length;

      if (hasIncludeFilters) {
        const matchesAction = !filters.include.actions?.length || 
          filters.include.actions.includes(event.action);
        const matchesResource = !filters.include.resources?.length || 
          filters.include.resources.includes(event.resource);
        const matchesActor = !filters.include.actors?.length || 
          (event.actorId && filters.include.actors.includes(event.actorId));

        if (!matchesAction || !matchesResource || !matchesActor) {
          return false;
        }
      }
    }

    return true;
  }

  private scheduleFlush(): void {
    if (this.flushTimeout || this.isShuttingDown) {
      return;
    }

    this.flushTimeout = setTimeout(async () => {
      try {
        await this.flush();
      } catch (error) {
        console.error('Scheduled flush failed:', error);
      }
      
      // Clear the timeout reference
      this.flushTimeout = null;
      
      // Schedule next flush only if not shutting down
      if (!this.isShuttingDown) {
        this.scheduleFlush();
      }
    }, this.config.flushInterval);
  }

  private setupGracefulShutdown(): void {
    const shutdown = () => {
      this.shutdown().catch(console.error);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('beforeExit', shutdown);
  }
}

/**
 * Resource-specific audit logger
 */
export class ResourceAuditLogger {
  constructor(
    private logger: AuditLogger,
    private resource: AuditResource
  ) {}

  async log(eventData: Omit<AuditEvent, 'id' | 'timestamp' | 'resource'>): Promise<void> {
    return this.logger.log({
      ...eventData,
      resource: this.resource,
    });
  }

  async create(resourceId: string, newValues: Record<string, any>, context?: AuditContext): Promise<void> {
    return this.log({
      action: 'create',
      resourceId,
      level: 'medium',
      success: true,
      description: `Created ${this.resource.toLowerCase()} ${resourceId}`,
      newValues,
      context,
    });
  }

  async update(
    resourceId: string, 
    oldValues: Record<string, any>, 
    newValues: Record<string, any>, 
    context?: AuditContext
  ): Promise<void> {
    return this.log({
      action: 'update',
      resourceId,
      level: 'medium',
      success: true,
      description: `Updated ${this.resource.toLowerCase()} ${resourceId}`,
      oldValues,
      newValues,
      context,
    });
  }

  async delete(resourceId: string, oldValues: Record<string, any>, context?: AuditContext): Promise<void> {
    return this.log({
      action: 'delete',
      resourceId,
      level: 'high',
      success: true,
      description: `Deleted ${this.resource.toLowerCase()} ${resourceId}`,
      oldValues,
      context,
    });
  }

  async read(resourceId: string, context?: AuditContext): Promise<void> {
    return this.log({
      action: 'read',
      resourceId,
      level: 'low',
      success: true,
      description: `Read ${this.resource.toLowerCase()} ${resourceId}`,
      context,
    });
  }
}

/**
 * Actor-specific audit logger
 */
export class ActorAuditLogger {
  constructor(
    private logger: AuditLogger,
    private actorId: string,
    private actorType: ActorType
  ) {}

  async log(eventData: Omit<AuditEvent, 'id' | 'timestamp' | 'actorId' | 'actorType'>): Promise<void> {
    return this.logger.log({
      ...eventData,
      actorId: this.actorId,
      actorType: this.actorType,
    });
  }

  async login(success: boolean, context?: AuditContext, error?: string): Promise<void> {
    return this.log({
      action: success ? 'login' : 'login_failed',
      resource: 'session',
      level: success ? 'medium' : 'critical',
      success,
      description: success ? 'User logged in successfully' : 'User login failed',
      context,
      error: error ? { message: error } : undefined,
    });
  }

  async logout(context?: AuditContext): Promise<void> {
    return this.log({
      action: 'logout',
      resource: 'session',
      level: 'low',
      success: true,
      description: 'User logged out',
      context,
    });
  }

  async accessDenied(resource: AuditResource, resourceId?: string, context?: AuditContext): Promise<void> {
    return this.log({
      action: 'access_denied',
      resource,
      resourceId,
      level: 'high',
      success: false,
      description: `Access denied to ${resource.toLowerCase()}${resourceId ? ` ${resourceId}` : ''}`,
      context,
    });
  }
}
