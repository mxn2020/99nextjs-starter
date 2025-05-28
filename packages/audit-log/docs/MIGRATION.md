# Migration Guide

This guide helps you migrate from other audit logging solutions to `@99packages/audit-log`.

## 📋 Table of Contents

- [Overview](#overview)
- [From Winston/Bunyan](#from-winstonbunyan)
- [From Pino](#from-pino)
- [From Custom Solutions](#from-custom-solutions)
- [From Other Audit Libraries](#from-other-audit-libraries)
- [Database Migrations](#database-migrations)
- [Code Migration Patterns](#code-migration-patterns)
- [Testing Your Migration](#testing-your-migration)
- [Rollback Strategy](#rollback-strategy)

## Overview

Migrating to `@99packages/audit-log` provides several benefits:

✅ **Structured Audit Logging**: Purpose-built for audit trails, not general logging  
✅ **Multiple Database Support**: PostgreSQL, MySQL, MongoDB, SQLite, and file-based  
✅ **React Integration**: Built-in UI components and hooks  
✅ **Security Features**: Data sanitization, PII protection, and compliance tools  
✅ **Performance Optimization**: Batching, queuing, and real-time capabilities  
✅ **Type Safety**: Full TypeScript support with Zod validation  

### Migration Strategy

1. **Assess Current Implementation**: Understand your existing audit logging
2. **Plan Database Schema**: Map existing data to our schema
3. **Migrate Code Gradually**: Replace logging calls incrementally
4. **Test Thoroughly**: Ensure data integrity and functionality
5. **Monitor Performance**: Verify improved performance metrics

## From Winston/Bunyan

### Current Winston Implementation

```javascript
// Before: Winston audit logging
const winston = require('winston');

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'audit.log' }),
    new winston.transports.Console()
  ]
});

// Logging an event
auditLogger.info('User login', {
  userId: '123',
  action: 'login',
  timestamp: new Date(),
  ip: '192.168.1.1'
});
```

### Migrated to @99packages/audit-log

```typescript
// After: Structured audit logging
import { AuditLogger } from '@99packages/audit-log';

const auditLogger = new AuditLogger({
  adapter: 'postgresql', // or your preferred adapter
  connection: {
    // Database connection details
  }
});

// Structured logging with proper audit context
await auditLogger.log({
  action: 'user.login',
  actorId: '123',
  actorType: 'user',
  resource: 'authentication',
  metadata: {
    loginMethod: 'email',
    userAgent: request.headers['user-agent']
  },
  context: {
    ipAddress: '192.168.1.1',
    sessionId: request.sessionId
  }
});
```

### Migration Steps for Winston

1. **Install the package**:
```bash
npm install @99packages/audit-log
npm uninstall winston
```

2. **Create a mapping utility**:
```typescript
// utils/winston-migration.ts
export function convertWinstonToAudit(winstonLog: any) {
  return {
    action: winstonLog.action || 'unknown.action',
    actorId: winstonLog.userId || winstonLog.actorId,
    actorType: winstonLog.actorType || 'user',
    resource: winstonLog.resource || 'unknown',
    resourceId: winstonLog.resourceId,
    metadata: {
      originalLevel: winstonLog.level,
      originalMessage: winstonLog.message,
      ...winstonLog
    },
    timestamp: new Date(winstonLog.timestamp)
  };
}
```

3. **Replace logging calls gradually**:
```typescript
// Replace this pattern
// auditLogger.info('User action', { userId, action, details });

// With this pattern
await auditLogger.log({
  action: 'user.action',
  actorId: userId,
  resource: 'user',
  metadata: details
});
```

## From Pino

### Current Pino Implementation

```javascript
// Before: Pino logging
const pino = require('pino');

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty'
  }
});

// Audit logging with Pino
logger.info({
  audit: true,
  userId: '123',
  action: 'user_update',
  resourceId: 'user_456',
  changes: { email: 'new@email.com' }
}, 'User profile updated');
```

### Migrated Implementation

```typescript
// After: Structured audit logging
import { AuditLogger } from '@99packages/audit-log';

const auditLogger = new AuditLogger({
  adapter: 'postgresql',
  connection: { /* config */ }
});

await auditLogger.log({
  action: 'user.profile.update',
  actorId: '123',
  resource: 'user',
  resourceId: 'user_456',
  metadata: {
    fieldsChanged: ['email'],
    previousEmail: '[REDACTED]', // Don't log PII
    updateSource: 'profile_form'
  }
});
```

### Pino Migration Utility

```typescript
// utils/pino-migration.ts
export class PinoMigrationHelper {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  // Helper to convert Pino audit logs
  async convertPinoAudit(pinoLog: any) {
    if (!pinoLog.audit) {
      return; // Skip non-audit logs
    }

    return await this.auditLogger.log({
      action: this.normalizeAction(pinoLog.action),
      actorId: pinoLog.userId || pinoLog.actorId,
      resource: this.extractResource(pinoLog),
      resourceId: pinoLog.resourceId,
      metadata: {
        originalMsg: pinoLog.msg,
        originalLevel: pinoLog.level,
        ...this.sanitizeMetadata(pinoLog)
      },
      timestamp: new Date(pinoLog.time)
    });
  }

  private normalizeAction(action: string): string {
    // Convert pino action formats to our standards
    const actionMap: Record<string, string> = {
      'user_update': 'user.update',
      'user_create': 'user.create',
      'user_delete': 'user.delete',
      'login_attempt': 'user.login.attempt',
      'login_success': 'user.login',
      'login_failure': 'user.login.failed'
    };
    
    return actionMap[action] || action.replace(/_/g, '.');
  }

  private extractResource(log: any): string {
    if (log.resourceType) return log.resourceType;
    if (log.action?.includes('user')) return 'user';
    if (log.action?.includes('admin')) return 'admin';
    return 'unknown';
  }

  private sanitizeMetadata(log: any): any {
    const { audit, time, level, msg, userId, actorId, action, resourceId, resourceType, ...metadata } = log;
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = { ...metadata };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}
```

## From Custom Solutions

### Database-based Custom Solution

Many teams have custom audit logging that inserts directly into database tables:

```sql
-- Before: Custom audit table
CREATE TABLE user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(100),
  table_name VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Migration Steps

1. **Analyze existing schema**:
```typescript
// utils/schema-analyzer.ts
export async function analyzeExistingAuditSchema(db: any) {
  const schema = await db.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'user_audit_log'
  `);
  
  console.log('Existing schema:', schema.rows);
  
  // Map to our schema
  return {
    mapping: {
      'user_id': 'actor_id',
      'action': 'action',
      'table_name': 'resource',
      'old_values': 'metadata.previous_values',
      'new_values': 'metadata.new_values',
      'created_at': 'timestamp'
    }
  };
}
```

2. **Create data migration script**:
```typescript
// scripts/migrate-audit-data.ts
import { AuditLogger } from '@99packages/audit-log';

export async function migrateExistingAuditData() {
  const auditLogger = new AuditLogger({
    adapter: 'postgresql',
    connection: { /* config */ }
  });

  // Fetch existing audit records in batches
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const oldRecords = await db.query(`
      SELECT * FROM user_audit_log 
      ORDER BY id 
      LIMIT $1 OFFSET $2
    `, [batchSize, offset]);

    if (oldRecords.rows.length === 0) {
      hasMore = false;
      break;
    }

    // Convert to new format
    const auditEvents = oldRecords.rows.map(record => ({
      action: normalizeAction(record.action, record.table_name),
      actorId: record.user_id?.toString(),
      actorType: 'user',
      resource: record.table_name,
      resourceId: extractResourceId(record),
      metadata: {
        migrated: true,
        originalId: record.id,
        previousValues: record.old_values,
        newValues: record.new_values
      },
      timestamp: record.created_at
    }));

    // Batch insert to new system
    await auditLogger.logBatch(auditEvents);
    
    offset += batchSize;
    console.log(`Migrated ${offset} records`);
  }
}

function normalizeAction(action: string, tableName: string): string {
  const actionMap: Record<string, string> = {
    'INSERT': `${tableName}.create`,
    'UPDATE': `${tableName}.update`,
    'DELETE': `${tableName}.delete`
  };
  
  return actionMap[action] || `${tableName}.${action.toLowerCase()}`;
}

function extractResourceId(record: any): string | undefined {
  // Try to extract resource ID from old_values or new_values
  const values = record.new_values || record.old_values;
  return values?.id?.toString() || values?.uuid;
}
```

3. **Run migration with validation**:
```typescript
// scripts/run-migration.ts
async function runMigrationWithValidation() {
  console.log('Starting audit log migration...');
  
  // Count original records
  const originalCount = await db.query('SELECT COUNT(*) FROM user_audit_log');
  console.log(`Original records: ${originalCount.rows[0].count}`);
  
  // Run migration
  await migrateExistingAuditData();
  
  // Validate migration
  const newCount = await auditLogger.query({ 
    filters: { 'metadata.migrated': true },
    count: true 
  });
  console.log(`Migrated records: ${newCount}`);
  
  if (originalCount.rows[0].count === newCount) {
    console.log('✅ Migration completed successfully');
  } else {
    console.error('❌ Migration count mismatch');
  }
}
```

## From Other Audit Libraries

### From audit-log (npm)

```javascript
// Before: audit-log library
const AuditLog = require('audit-log');

const audit = new AuditLog({
  file: './audit.log',
  maxSize: '10MB'
});

audit.log('user', 'login', { userId: '123', ip: '192.168.1.1' });
```

```typescript
// After: @99packages/audit-log
import { AuditLogger } from '@99packages/audit-log';

const auditLogger = new AuditLogger({
  adapter: 'file', // Keep file-based if needed
  connection: {
    directory: './audit-logs',
    maxFileSize: '10MB',
    rotateFiles: true
  }
});

await auditLogger.log({
  action: 'user.login',
  actorId: '123',
  resource: 'authentication',
  context: {
    ipAddress: '192.168.1.1'
  }
});
```

### From express-audit-logger

```javascript
// Before: express-audit-logger
const auditLogger = require('express-audit-logger');

app.use(auditLogger({
  database: 'mongodb://localhost/audit',
  collection: 'audit_logs'
}));
```

```typescript
// After: @99packages/audit-log with middleware
import { auditMiddleware } from '@99packages/audit-log';

const auditLogger = new AuditLogger({
  adapter: 'mongodb',
  connection: {
    url: 'mongodb://localhost/audit',
    collection: 'audit_logs'
  }
});

app.use(auditMiddleware(auditLogger, {
  includeRequest: true,
  includeResponse: false,
  excludePaths: ['/health', '/metrics']
}));
```

## Database Migrations

### PostgreSQL Migration

```sql
-- Create new audit_logs table alongside existing
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  actor_id TEXT,
  actor_type TEXT DEFAULT 'user',
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  organization_id TEXT,
  severity TEXT DEFAULT 'info',
  status TEXT DEFAULT 'success',
  metadata JSONB DEFAULT '{}',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Migrate data from old table
INSERT INTO audit_logs (
  timestamp, actor_id, action, resource, resource_id, metadata
)
SELECT 
  created_at,
  user_id::text,
  CASE 
    WHEN action = 'CREATE' THEN resource_type || '.create'
    WHEN action = 'UPDATE' THEN resource_type || '.update'
    WHEN action = 'DELETE' THEN resource_type || '.delete'
    ELSE resource_type || '.' || LOWER(action)
  END,
  resource_type,
  resource_id::text,
  jsonb_build_object(
    'original_data', old_values,
    'new_data', new_values,
    'migrated', true
  )
FROM legacy_audit_table;

-- Create indexes
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
```

### MySQL Migration

```sql
-- Similar pattern for MySQL
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actor_id VARCHAR(255),
  actor_type VARCHAR(50) DEFAULT 'user',
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  resource_id VARCHAR(255),
  organization_id VARCHAR(255),
  severity ENUM('low', 'info', 'medium', 'high', 'critical') DEFAULT 'info',
  status ENUM('success', 'failure', 'pending') DEFAULT 'success',
  metadata JSON,
  context JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate from existing table
INSERT INTO audit_logs (timestamp, actor_id, action, resource, metadata)
SELECT 
  created_at,
  user_id,
  CONCAT(table_name, '.', LOWER(action_type)),
  table_name,
  JSON_OBJECT(
    'old_values', old_data,
    'new_values', new_data,
    'migrated', true
  )
FROM old_audit_log;
```

## Code Migration Patterns

### Pattern 1: Gradual Replacement

```typescript
// Create a bridge service during migration
class AuditBridge {
  private oldLogger: any;
  private newLogger: AuditLogger;
  private useNewLogger: boolean;

  constructor(oldLogger: any, newLogger: AuditLogger) {
    this.oldLogger = oldLogger;
    this.newLogger = newLogger;
    this.useNewLogger = process.env.USE_NEW_AUDIT_LOGGER === 'true';
  }

  async log(event: any) {
    if (this.useNewLogger) {
      // Use new structured format
      await this.newLogger.log(this.convertToNewFormat(event));
    } else {
      // Keep using old logger
      this.oldLogger.log(event);
    }
  }

  private convertToNewFormat(event: any) {
    return {
      action: event.action || 'unknown.action',
      actorId: event.userId || event.actorId,
      resource: event.resource || 'unknown',
      metadata: event
    };
  }
}

// Use the bridge in your existing code
const auditBridge = new AuditBridge(oldLogger, newLogger);
await auditBridge.log({ userId: '123', action: 'login' });
```

### Pattern 2: Feature Flag Migration

```typescript
// Use feature flags for gradual rollout
import { FeatureFlag } from '@/lib/feature-flags';

class AuditService {
  private oldLogger: any;
  private newLogger: AuditLogger;

  async log(event: any) {
    const useNewAuditLogger = await FeatureFlag.isEnabled('new-audit-logger');
    
    if (useNewAuditLogger) {
      await this.logWithNewSystem(event);
    } else {
      await this.logWithOldSystem(event);
    }
  }

  private async logWithNewSystem(event: any) {
    await this.newLogger.log({
      action: this.normalizeAction(event.action),
      actorId: event.userId,
      resource: event.resource,
      metadata: this.sanitizeMetadata(event)
    });
  }

  private async logWithOldSystem(event: any) {
    this.oldLogger.info(event.message, event);
  }
}
```

### Pattern 3: Dual Logging

```typescript
// Log to both systems during transition
class DualAuditLogger {
  private oldLogger: any;
  private newLogger: AuditLogger;

  async log(event: any) {
    // Log to both systems
    const promises = [
      this.logToOldSystem(event),
      this.logToNewSystem(event)
    ];

    // Wait for both but don't fail if one fails
    const results = await Promise.allSettled(promises);
    
    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Logger ${index} failed:`, result.reason);
      }
    });
  }

  private async logToOldSystem(event: any) {
    this.oldLogger.log(event);
  }

  private async logToNewSystem(event: any) {
    await this.newLogger.log(this.convertEvent(event));
  }
}
```

## Testing Your Migration

### 1. Data Integrity Tests

```typescript
// tests/migration.test.ts
import { describe, it, expect } from 'vitest';

describe('Audit Log Migration', () => {
  it('should migrate all records correctly', async () => {
    // Count original records
    const originalCount = await getOriginalAuditCount();
    
    // Run migration
    await runMigration();
    
    // Count migrated records
    const migratedCount = await auditLogger.query({
      filters: { 'metadata.migrated': true },
      count: true
    });
    
    expect(migratedCount).toBe(originalCount);
  });

  it('should preserve data integrity', async () => {
    // Get sample records before migration
    const sampleRecords = await getOriginalSampleRecords();
    
    // Run migration
    await runMigration();
    
    // Verify migrated records
    for (const original of sampleRecords) {
      const migrated = await auditLogger.query({
        filters: { 'metadata.originalId': original.id }
      });
      
      expect(migrated).toHaveLength(1);
      expect(migrated[0].actorId).toBe(original.user_id.toString());
      expect(migrated[0].action).toContain(original.action.toLowerCase());
    }
  });
});
```

### 2. Performance Comparison

```typescript
// tests/performance.test.ts
describe('Performance Comparison', () => {
  it('should perform better than old system', async () => {
    const events = generateTestEvents(1000);
    
    // Test old system
    const oldStart = Date.now();
    await logWithOldSystem(events);
    const oldTime = Date.now() - oldStart;
    
    // Test new system
    const newStart = Date.now();
    await auditLogger.logBatch(events);
    const newTime = Date.now() - newStart;
    
    console.log(`Old system: ${oldTime}ms, New system: ${newTime}ms`);
    expect(newTime).toBeLessThan(oldTime);
  });
});
```

### 3. Functional Tests

```typescript
// tests/functional.test.ts
describe('Functional Migration Tests', () => {
  it('should maintain all audit functionality', async () => {
    // Test logging
    await auditLogger.log({
      action: 'user.login',
      actorId: 'test-user',
      resource: 'authentication'
    });
    
    // Test querying
    const logs = await auditLogger.query({
      filters: { actorId: 'test-user' }
    });
    
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('user.login');
  });

  it('should support all required queries', async () => {
    // Test various query patterns your app uses
    const userLogs = await auditLogger.query({
      filters: { actorId: 'user123' }
    });
    
    const recentLogs = await auditLogger.query({
      filters: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    
    const criticalEvents = await auditLogger.query({
      filters: { severity: 'critical' }
    });
    
    expect(userLogs).toBeDefined();
    expect(recentLogs).toBeDefined();
    expect(criticalEvents).toBeDefined();
  });
});
```

## Rollback Strategy

### 1. Preparation

```typescript
// Before migration, create backup
async function createMigrationBackup() {
  // Backup existing audit data
  await db.query(`
    CREATE TABLE audit_backup_${Date.now()} AS 
    SELECT * FROM user_audit_log
  `);
  
  // Export configuration
  const config = {
    oldLoggerConfig: getCurrentLoggerConfig(),
    timestamp: new Date(),
    version: process.env.npm_package_version
  };
  
  await fs.writeFile(
    `./migration-backup-${Date.now()}.json`,
    JSON.stringify(config, null, 2)
  );
}
```

### 2. Rollback Plan

```typescript
// rollback.ts
async function rollbackMigration() {
  console.log('Starting rollback...');
  
  // 1. Stop new audit logger
  await auditLogger.flush();
  await auditLogger.close();
  
  // 2. Restore old configuration
  const backupConfig = await loadBackupConfig();
  restoreOldLogger(backupConfig.oldLoggerConfig);
  
  // 3. Verify old system works
  await testOldLoggerFunctionality();
  
  // 4. Clean up new audit table if needed
  const shouldCleanup = await confirmCleanup();
  if (shouldCleanup) {
    await db.query('DROP TABLE audit_logs');
  }
  
  console.log('Rollback completed');
}

async function testOldLoggerFunctionality() {
  // Test that old logger still works
  oldLogger.log('Rollback test event');
  
  // Verify log was written
  const testLog = await findLogEntry('Rollback test event');
  if (!testLog) {
    throw new Error('Old logger not working after rollback');
  }
}
```

### 3. Monitoring Post-Migration

```typescript
// monitoring/post-migration.ts
class MigrationMonitor {
  private metrics = {
    oldSystemErrors: 0,
    newSystemErrors: 0,
    performanceComparison: []
  };

  async monitorMigration() {
    // Monitor for errors in both systems
    setInterval(async () => {
      await this.checkSystemHealth();
      await this.comparePerformance();
      await this.checkDataConsistency();
    }, 60000); // Check every minute
  }

  private async checkSystemHealth() {
    try {
      await auditLogger.health();
    } catch (error) {
      this.metrics.newSystemErrors++;
      console.error('New audit system error:', error);
      
      if (this.metrics.newSystemErrors > 5) {
        await this.triggerRollback();
      }
    }
  }

  private async triggerRollback() {
    console.error('Too many errors, triggering automatic rollback');
    await rollbackMigration();
  }
}
```

---

## Migration Checklist

### Pre-Migration
- [ ] Backup existing audit data
- [ ] Document current audit implementation
- [ ] Test migration scripts on staging environment
- [ ] Prepare rollback procedures
- [ ] Set up monitoring and alerts

### During Migration
- [ ] Run migration in maintenance window
- [ ] Monitor system performance
- [ ] Validate data integrity
- [ ] Test critical audit functionality
- [ ] Keep rollback option ready

### Post-Migration
- [ ] Monitor system performance for 24-48 hours
- [ ] Validate all audit features work correctly
- [ ] Train team on new audit system
- [ ] Update documentation
- [ ] Clean up old audit code (after confirmation)

### Success Criteria
- [ ] All historical data migrated successfully
- [ ] No loss of audit functionality
- [ ] Performance improved or maintained
- [ ] Team comfortable with new system
- [ ] Monitoring shows stable operation

For additional help with migration, join our [Discord community](https://discord.gg/99packages) or check our [documentation](https://docs.99packages.com).
