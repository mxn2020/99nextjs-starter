import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  AuditLogger, 
  ResourceAuditLogger, 
  ActorAuditLogger 
} from '../lib/audit-logger';
import { 
  AuditEvent, 
  AuditAdapter, 
  AuditLoggerConfig,
  AuditStats,
  AuditFilter,
  PaginatedResult
} from '../types/audit';

// Health check result interface
interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
}

// Mock adapter for testing
class MockAuditAdapter implements AuditAdapter {
  events: AuditEvent[] = [];
  shouldThrow = false;
  healthStatus = true;
  responseTime = 100;

  async log(event: AuditEvent): Promise<void> {
    if (this.shouldThrow) {
      throw new Error('Mock adapter error');
    }
    this.events.push(event);
  }

  async logBatch(events: AuditEvent[]): Promise<void> {
    if (this.shouldThrow) {
      throw new Error('Mock adapter error');
    }
    this.events.push(...events);
  }

  async query(): Promise<PaginatedResult<AuditEvent>> {
    return {
      data: this.events,
      total: this.events.length,
      hasMore: false
    };
  }

  async count(): Promise<number> {
    return this.events.length;
  }

  async getStats(): Promise<AuditStats> {
    return {
      totalEvents: this.events.length,
      eventsByAction: {} as any,
      eventsByResource: {} as any,
      eventsByLevel: {} as any,
      successRate: 1.0,
      timeRange: {
        start: new Date(),
        end: new Date()
      }
    };
  }

  async purge(): Promise<number> {
    const count = this.events.length;
    this.events = [];
    return count;
  }

  async healthCheck(): Promise<boolean> {
    return this.healthStatus;
  }

  async close(): Promise<void> {
    // Mock close
  }

  // Helper method for health check results
  getHealthResult(): HealthCheckResult {
    return {
      healthy: this.healthStatus,
      responseTime: this.responseTime
    };
  }

  reset() {
    this.events = [];
    this.shouldThrow = false;
    this.healthStatus = true;
    this.responseTime = 100;
  }
}

describe('AuditLogger', () => {
  let mockAdapter: MockAuditAdapter;
  let logger: AuditLogger;

  beforeEach(() => {
    mockAdapter = new MockAuditAdapter();
    logger = new AuditLogger(mockAdapter, {
      sanitize: {
        enabled: true,
        fields: ['password', 'token', 'secret', 'key', 'authorization'],
        replacement: '[REDACTED]',
      },
    });
  });

  afterEach(async () => {
    await logger.shutdown();
    mockAdapter.reset();
    vi.clearAllTimers();
  });

  describe('Basic Logging', () => {
    it('should log a basic audit event', async () => {
      const event = {
        action: 'login' as const,
        resource: 'session' as const,
        level: 'medium' as const,
        actorId: 'user123',
        actorType: 'user' as const,
        description: 'User login',
        success: true,
      };

      await logger.log(event);
      
      expect(mockAdapter.events).toHaveLength(1);
      expect(mockAdapter.events[0]!.action).toBe('login');
      expect(mockAdapter.events[0]!.actorId).toBe('user123');
    });

    it('should generate ID and timestamp if not provided', async () => {
      const event = {
        action: 'logout' as const,
        resource: 'session' as const,
        level: 'low' as const,
        actorId: 'user123',
        actorType: 'user' as const,
        description: 'User logout',
        success: true,
      };

      await logger.log(event);
      
      expect(mockAdapter.events).toHaveLength(1);
      expect(mockAdapter.events[0]!.id).toBeDefined();
      expect(mockAdapter.events[0]!.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Batching', () => {
    it('should batch events when batch size is reached', async () => {
      const batchLogger = new AuditLogger(mockAdapter, {
        batchSize: 3,
        flushInterval: 1000,
        sanitize: {
          enabled: true,
          fields: ['password', 'token', 'secret', 'key', 'authorization'],
          replacement: '[REDACTED]',
        },
      });

      // Log events that should be batched
      await Promise.all([
        batchLogger.log({
          action: 'create',
          resource: 'data',
          level: 'low',
          description: 'Test event 1',
          success: true,
        }),
        batchLogger.log({
          action: 'update',
          resource: 'data',
          level: 'low',
          description: 'Test event 2',
          success: true,
        }),
        batchLogger.log({
          action: 'delete',
          resource: 'data',
          level: 'low',
          description: 'Test event 3',
          success: true,
        }),
      ]);

      // Should have logged all events
      expect(mockAdapter.events).toHaveLength(3);

      await batchLogger.shutdown();
    });

    it('should flush batch on interval', async () => {
      vi.useFakeTimers();

      const batchLogger = new AuditLogger(mockAdapter, {
        batchSize: 10, // Large batch size
        flushInterval: 100, // Short interval
        sanitize: {
          enabled: true,
          fields: ['password', 'token', 'secret', 'key', 'authorization'],
          replacement: '[REDACTED]',
        },
      });

      await batchLogger.log({
        action: 'create',
        resource: 'data',
        level: 'low',
        description: 'Test event',
        success: true,
      });

      // Advance timer to trigger flush
      vi.advanceTimersByTime(150);
      await vi.runAllTimersAsync();

      // Events should now be flushed
      expect(mockAdapter.events).toHaveLength(1);

      await batchLogger.shutdown();
      vi.useRealTimers();
    });

    it('should handle critical events immediately', async () => {
      const batchLogger = new AuditLogger(mockAdapter, {
        batchSize: 10,
        flushInterval: 10000,
        sanitize: {
          enabled: true,
          fields: ['password', 'token', 'secret', 'key', 'authorization'],
          replacement: '[REDACTED]',
        },
      });

      await batchLogger.log({
        action: 'access_denied',
        resource: 'system',
        level: 'critical',
        description: 'Security breach',
        success: false,
      });

      // Should be logged immediately
      expect(mockAdapter.events).toHaveLength(1);

      await batchLogger.shutdown();
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive fields', async () => {
      const sanitizingLogger = new AuditLogger(mockAdapter, {
        sanitize: {
          enabled: true,
          fields: ['password', 'secret'],
          replacement: '[REDACTED]',
        },
      });

      await sanitizingLogger.log({
        action: 'update',
        resource: 'user',
        level: 'medium',
        description: 'User update',
        success: true,
        newValues: {
          password: 'secret123',
          name: 'John Doe',
          secret: 'topsecret',
        },
      });

      const loggedEvent = mockAdapter.events[0]!;
      expect(loggedEvent.newValues?.password).toBe('[REDACTED]');
      expect(loggedEvent.newValues?.secret).toBe('[REDACTED]');
      expect(loggedEvent.newValues?.name).toBe('John Doe'); // Not sensitive

      await sanitizingLogger.shutdown();
    });
  });

  describe('Filtering', () => {
    it('should filter events based on level', async () => {
      const filteringLogger = new AuditLogger(mockAdapter, {
        level: 'high',
        sanitize: {
          enabled: true,
          fields: ['password', 'token', 'secret', 'key', 'authorization'],
          replacement: '[REDACTED]',
        },
      });

      await Promise.all([
        filteringLogger.log({
          action: 'read',
          resource: 'data',
          level: 'low',
          description: 'Low level event',
          success: true,
        }),
        filteringLogger.log({
          action: 'update',
          resource: 'data',
          level: 'medium',
          description: 'Medium level event',
          success: true,
        }),
        filteringLogger.log({
          action: 'delete',
          resource: 'data',
          level: 'high',
          description: 'High level event',
          success: true,
        }),
        filteringLogger.log({
          action: 'access_denied',
          resource: 'system',
          level: 'critical',
          description: 'Critical event',
          success: false,
        }),
      ]);

      // Only high and critical should be logged
      expect(mockAdapter.events).toHaveLength(2);
      expect(mockAdapter.events.map(e => e.level)).toEqual(['high', 'critical']);

      await filteringLogger.shutdown();
    });

    it('should filter events based on exclude filters', async () => {
      const filteringLogger = new AuditLogger(mockAdapter, {
        filters: {
          exclude: {
            actions: ['read'],
            actors: ['system'],
          },
        },
        sanitize: {
          enabled: true,
          fields: ['password', 'token', 'secret', 'key', 'authorization'],
          replacement: '[REDACTED]',
        },
      });

      await Promise.all([
        filteringLogger.log({
          action: 'read',
          resource: 'data',
          level: 'medium',
          actorId: 'user1',
          description: 'Read event - should be excluded',
          success: true,
        }),
        filteringLogger.log({
          action: 'update',
          resource: 'data',
          level: 'medium',
          actorId: 'system',
          description: 'System event - should be excluded',
          success: true,
        }),
        filteringLogger.log({
          action: 'update',
          resource: 'data',
          level: 'medium',
          actorId: 'user1',
          description: 'User update - should be included',
          success: true,
        }),
      ]);

      // Only the user update should be logged
      expect(mockAdapter.events).toHaveLength(1);
      expect(mockAdapter.events[0]!.description).toBe('User update - should be included');

      await filteringLogger.shutdown();
    });
  });

  describe('Error Handling', () => {
    it('should handle adapter errors gracefully', async () => {
      mockAdapter.shouldThrow = true;
      
      // Should not throw
      await expect(logger.log({
        action: 'create',
        resource: 'data',
        level: 'medium',
        description: 'Test event',
        success: true,
      })).resolves.not.toThrow();
    });

    it('should retry failed operations', async () => {
      const retryLogger = new AuditLogger(mockAdapter, {
        maxRetries: 3,
        retryDelay: 10,
        sanitize: {
          enabled: true,
          fields: ['password', 'token', 'secret', 'key', 'authorization'],
          replacement: '[REDACTED]',
        },
      });

      let attempts = 0;
      mockAdapter.log = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary error');
        }
        return Promise.resolve();
      });

      await retryLogger.log({
        action: 'create',
        resource: 'data',
        level: 'medium',
        description: 'Test event',
        success: true,
      });

      expect(attempts).toBe(3); // Initial call + 2 retries

      await retryLogger.shutdown();
    });
  });

  describe('Health Monitoring', () => {
    it('should check adapter health', async () => {
      const health = await logger.healthCheck();
      
      expect(health).toBe(true);
    });

    it('should handle unhealthy adapter', async () => {
      mockAdapter.healthStatus = false;

      const health = await logger.healthCheck();
      
      expect(health).toBe(false);
    });

    it('should get health results with timing', () => {
      const health = mockAdapter.getHealthResult();
      
      expect(health.healthy).toBe(true);
      expect(health.responseTime).toBe(100);
    });

    it('should handle unhealthy adapter with timing', () => {
      mockAdapter.healthStatus = false;
      mockAdapter.responseTime = 5000;

      const health = mockAdapter.getHealthResult();
      
      expect(health.healthy).toBe(false);
      expect(health.responseTime).toBe(5000);
    });
  });
});

describe('ResourceAuditLogger', () => {
  let mockAdapter: MockAuditAdapter;
  let baseLogger: AuditLogger;
  let logger: ResourceAuditLogger;

  beforeEach(() => {
    mockAdapter = new MockAuditAdapter();
    baseLogger = new AuditLogger(mockAdapter, {
      sanitize: {
        enabled: true,
        fields: ['password', 'token', 'secret', 'key', 'authorization'],
        replacement: '[REDACTED]',
      },
    });
    logger = baseLogger.forResource('data');
  });

  afterEach(async () => {
    await baseLogger.shutdown();
    mockAdapter.reset();
  });

  it('should log resource creation', async () => {
    await logger.create('doc123', { title: 'Test Document', content: 'Content' });

    expect(mockAdapter.events).toHaveLength(1);
    expect(mockAdapter.events[0]!.action).toBe('create');
    expect(mockAdapter.events[0]!.resource).toBe('data');
    expect(mockAdapter.events[0]!.resourceId).toBe('doc123');
  });

  it('should log resource access', async () => {
    await logger.read('doc123');

    expect(mockAdapter.events).toHaveLength(1);
    expect(mockAdapter.events[0]!.action).toBe('read');
    expect(mockAdapter.events[0]!.resource).toBe('data');
  });

  it('should log resource updates', async () => {
    await logger.update(
      'doc123',
      { title: 'Old Title' },
      { title: 'New Title' }
    );

    expect(mockAdapter.events).toHaveLength(1);
    expect(mockAdapter.events[0]!.action).toBe('update');
    expect(mockAdapter.events[0]!.oldValues?.title).toBe('Old Title');
    expect(mockAdapter.events[0]!.newValues?.title).toBe('New Title');
  });

  it('should log resource deletion', async () => {
    await logger.delete('doc123', { title: 'Test Document' });

    expect(mockAdapter.events).toHaveLength(1);
    expect(mockAdapter.events[0]!.action).toBe('delete');
    expect(mockAdapter.events[0]!.level).toBe('high'); // Deletion is high severity
  });
});

describe('ActorAuditLogger', () => {
  let mockAdapter: MockAuditAdapter;
  let baseLogger: AuditLogger;
  let logger: ActorAuditLogger;

  beforeEach(() => {
    mockAdapter = new MockAuditAdapter();
    baseLogger = new AuditLogger(mockAdapter, {
      sanitize: {
        enabled: true,
        fields: ['password', 'token', 'secret', 'key', 'authorization'],
        replacement: '[REDACTED]',
      },
    });
    logger = baseLogger.forActor('user123', 'user');
  });

  afterEach(async () => {
    await baseLogger.shutdown();
    mockAdapter.reset();
  });

  it('should log user login success', async () => {
    await logger.login(true, { ipAddress: '192.168.1.1' });

    expect(mockAdapter.events).toHaveLength(1);
    expect(mockAdapter.events[0]!.action).toBe('login');
    expect(mockAdapter.events[0]!.actorId).toBe('user123');
    expect(mockAdapter.events[0]!.success).toBe(true);
  });

  it('should log user login failure', async () => {
    await logger.login(false, { ipAddress: '192.168.1.1' }, 'Invalid password');

    expect(mockAdapter.events).toHaveLength(1);
    expect(mockAdapter.events[0]!.action).toBe('login_failed');
    expect(mockAdapter.events[0]!.success).toBe(false);
    expect(mockAdapter.events[0]!.error?.message).toBe('Invalid password');
  });

  it('should log user logout', async () => {
    await logger.logout({ sessionId: 'session123' });

    expect(mockAdapter.events).toHaveLength(1);
    expect(mockAdapter.events[0]!.action).toBe('logout');
    expect(mockAdapter.events[0]!.success).toBe(true);
  });

  it('should log access denied', async () => {
    await logger.accessDenied('data', 'doc123', { ipAddress: '192.168.1.1' });

    expect(mockAdapter.events).toHaveLength(1);
    expect(mockAdapter.events[0]!.action).toBe('access_denied');
    expect(mockAdapter.events[0]!.resource).toBe('data');
    expect(mockAdapter.events[0]!.resourceId).toBe('doc123');
    expect(mockAdapter.events[0]!.success).toBe(false);
  });
});