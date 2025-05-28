# Troubleshooting Guide

A comprehensive troubleshooting guide for common issues with `@99packages/audit-log`.

## 📋 Table of Contents

- [Quick Diagnostics](#-quick-diagnostics)
- [Common Issues](#-common-issues)
- [Database-Specific Issues](#-database-specific-issues)
- [Configuration Problems](#-configuration-problems)
- [Performance Issues](#-performance-issues)
- [Development Issues](#-development-issues)
- [Debugging Tools](#-debugging-tools)
- [Getting Help](#-getting-help)

## 🔍 Quick Diagnostics

### Health Check

First, run a health check to identify immediate issues:

```typescript
import { createAuditLogger } from '@99packages/audit-log';

const logger = createAuditLogger({
  // your configuration
});

// Quick health check
const health = await logger.getHealth();
console.log('Health Status:', health);

if (!health.healthy) {
  console.error('Issues detected:', health.issues);
}
```

### Environment Verification

```typescript
// Check environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing environment variables:', missingVars);
}
```

### Test Basic Functionality

```typescript
// Basic functionality test
async function testBasicFunctionality() {
  try {
    // Test logging
    await logger.log({
      actor: { type: 'system', id: 'test' },
      action: 'test',
      resource: { type: 'test', id: 'test-resource' },
      context: { test: true }
    });
    console.log('✅ Logging works');

    // Test querying
    const events = await logger.query().limit(1).execute();
    console.log('✅ Querying works', events.length);

    return true;
  } catch (error) {
    console.error('❌ Basic functionality failed:', error);
    return false;
  }
}
```

## 🚨 Common Issues

### 1. "Module not found" errors

**Problem**: Import/export errors with the audit log package

**Symptoms**:
```
Error: Cannot find module '@99packages/audit-log'
Module not found: Can't resolve '@99packages/audit-log/ui'
```

**Solutions**:

```bash
# Ensure package is installed
pnpm install @99packages/audit-log

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check package.json has correct dependency
# "dependencies": {
#   "@99packages/audit-log": "^1.0.0"
# }
```

```typescript
// Use correct import syntax
import { createAuditLogger, PostgreSQLAdapter } from '@99packages/audit-log';
import { AuditTable } from '@99packages/audit-log/ui';
import { useAuditEvents } from '@99packages/audit-log/hooks';
```

### 2. TypeScript compilation errors

**Problem**: TypeScript type errors when using the package

**Symptoms**:
```
Type 'AuditEvent' is not assignable to type 'ExpectedType'
Property 'metadata' is missing in type
```

**Solutions**:

```typescript
// Ensure proper type imports
import type { AuditEvent, AuditFilter, AuditAdapter } from '@99packages/audit-log';

// Use proper type annotations
const event: AuditEvent = {
  actor: { type: 'user', id: 'user123' },
  action: 'create',
  resource: { type: 'post', id: 'post456' },
  timestamp: new Date(),
  context: {},
  metadata: {} // Include all required fields
};

// For TypeScript strict mode
const filter: AuditFilter = {
  limit: 10,
  offset: 0,
  // Specify all filter properties explicitly
  where: {
    action: 'create'
  }
};
```

### 3. Database connection failures

**Problem**: Cannot connect to database

**Symptoms**:
```
Error: Connection timeout
Error: Database connection refused
Error: Invalid credentials
```

**Solutions**:

```typescript
// Test connection separately
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Test basic connection
try {
  const { data, error } = await supabase.from('audit_logs').select('id').limit(1);
  if (error) throw error;
  console.log('✅ Database connection successful');
} catch (error) {
  console.error('❌ Database connection failed:', error);
}
```

```typescript
// Check connection configuration
const adapter = new PostgreSQLAdapter({
  client: supabase,
  // Add connection debugging
  debug: true,
  connectionPool: {
    min: 1,
    max: 5,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000
  }
});
```

### 4. Permission denied errors

**Problem**: Database permission errors

**Symptoms**:
```
Error: permission denied for table audit_logs
Error: RLS policy violation
Error: insufficient privileges
```

**Solutions**:

```sql
-- Check table permissions
SELECT table_name, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'audit_logs';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO authenticated;
GRANT USAGE ON SEQUENCE audit_logs_id_seq TO authenticated;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'audit_logs';

-- Create basic RLS policy
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON audit_logs
FOR SELECT USING (
  auth.uid()::text = actor_id OR
  auth.jwt() ->> 'role' = 'admin'
);
```

### 5. React hydration errors

**Problem**: Server-side rendering issues with React components

**Symptoms**:
```
Warning: Text content did not match. Server: "..." Client: "..."
Error: Hydration failed because the initial UI does not match
```

**Solutions**:

```tsx
// Use dynamic imports for client-only components
import dynamic from 'next/dynamic';

const AuditTable = dynamic(() => import('@99packages/audit-log/ui').then(mod => mod.AuditTable), {
  ssr: false,
  loading: () => <div>Loading audit logs...</div>
});

// Or use useEffect for client-side only rendering
function AuditDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return <AuditTable />;
}
```

## 🗄️ Database-Specific Issues

### PostgreSQL/Supabase Issues

#### Table doesn't exist

```sql
-- Create the audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_type VARCHAR(50) NOT NULL,
  actor_id VARCHAR(255) NOT NULL,
  actor_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  resource_name VARCHAR(255),
  context JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  organization_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
```

#### Migration issues

```typescript
// Check current schema version
const checkSchema = async () => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Table does not exist, running migrations...');
      // Run migration scripts
    }
  } catch (error) {
    console.error('Schema check failed:', error);
  }
};
```

### MongoDB Issues

#### Connection string problems

```typescript
// Test MongoDB connection
import { MongoClient } from 'mongodb';

const testMongoConnection = async () => {
  const client = new MongoClient(process.env.MONGODB_URI!);
  
  try {
    await client.connect();
    console.log('✅ MongoDB connection successful');
    
    // Test collection access
    const db = client.db('audit_logs');
    const collection = db.collection('events');
    await collection.findOne({});
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  } finally {
    await client.close();
  }
};
```

#### Index creation issues

```typescript
// Create MongoDB indexes manually
const createIndexes = async () => {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  
  const collection = client.db('audit_logs').collection('events');
  
  await collection.createIndexes([
    { key: { timestamp: -1 } },
    { key: { 'actor.id': 1, timestamp: -1 } },
    { key: { 'resource.type': 1, 'resource.id': 1 } },
    { key: { action: 1 } }
  ]);
  
  await client.close();
};
```

## ⚙️ Configuration Problems

### 1. Invalid adapter configuration

**Problem**: Adapter initialization fails

```typescript
// ❌ Incorrect configuration
const adapter = new PostgreSQLAdapter({
  // Missing required fields
  batchSize: 100
});

// ✅ Correct configuration
const adapter = new PostgreSQLAdapter({
  client: supabase, // Required
  tableName: 'audit_logs', // Optional, has default
  batchSize: 100,
  flushInterval: 1000
});
```

### 2. Environment variable issues

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Common issues:
# - Missing variables
# - Incorrect URLs
# - Wrong key types (anon vs service)
```

### 3. Configuration validation

```typescript
// Add configuration validation
const validateConfig = (config: any) => {
  const required = ['adapter'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
  
  // Validate adapter type
  if (!config.adapter.log || typeof config.adapter.log !== 'function') {
    throw new Error('Invalid adapter: must implement log method');
  }
};
```

## 🚀 Performance Issues

### 1. Slow audit logging

**Symptoms**: High latency, timeouts

**Diagnosis**:
```typescript
// Measure operation time
const measureTime = async (operation: () => Promise<any>) => {
  const start = Date.now();
  try {
    await operation();
    console.log(`Operation took ${Date.now() - start}ms`);
  } catch (error) {
    console.error(`Operation failed after ${Date.now() - start}ms:`, error);
  }
};

// Test logging performance
await measureTime(() => logger.log(testEvent));
```

**Solutions**:
```typescript
// Enable batching and async operations
const optimizedLogger = createAuditLogger({
  adapter: new PostgreSQLAdapter({
    client: supabase,
    batchSize: 100,      // Batch operations
    flushInterval: 1000, // Flush every second
    enableCompression: true
  }),
  enableBatching: true,
  enableAsync: true      // Non-blocking operations
});
```

### 2. Memory issues

**Diagnosis**:
```typescript
// Monitor memory usage
const monitorMemory = () => {
  const usage = process.memoryUsage();
  console.log({
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB'
  });
};

setInterval(monitorMemory, 5000);
```

**Solutions**:
```typescript
// Reduce memory usage
const memoryEfficientConfig = {
  adapter: new PostgreSQLAdapter({
    client: supabase,
    batchSize: 25,        // Smaller batches
    maxQueueSize: 500,    // Smaller queue
    enableCompression: true
  }),
  enableCaching: false    // Disable caching
};
```

## 🛠️ Development Issues

### 1. Next.js development server issues

**Problem**: Hot reload breaks audit logging

```typescript
// Use singleton pattern for development
let globalLogger: AuditLogger | undefined;

export const getAuditLogger = () => {
  if (!globalLogger) {
    globalLogger = createAuditLogger({
      // configuration
    });
  }
  return globalLogger;
};

// In pages/_app.tsx or app/layout.tsx
if (process.env.NODE_ENV === 'development') {
  // Prevent multiple instances during development
  (global as any).__auditLogger = getAuditLogger();
}
```

### 2. Testing issues

```typescript
// Mock audit logger for tests
export const createMockAuditLogger = (): AuditLogger => ({
  log: jest.fn(),
  query: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([])
  })),
  getHealth: jest.fn().mockResolvedValue({ healthy: true }),
  close: jest.fn()
});

// Use in tests
const mockLogger = createMockAuditLogger();
```

### 3. Build issues

```bash
# Clear build cache
rm -rf .next
pnpm build

# Check for build-time errors
pnpm build 2>&1 | grep -i error

# Common build issues:
# - Missing environment variables
# - TypeScript errors
# - Dependency conflicts
```

## 🔧 Debugging Tools

### Enable Debug Logging

```typescript
// Enable verbose logging
const logger = createAuditLogger({
  adapter: new PostgreSQLAdapter({
    client: supabase,
    debug: true // Enable debug output
  }),
  debug: true
});

// Or use environment variable
process.env.DEBUG = 'audit-log:*';
```

### Custom Debug Wrapper

```typescript
// Wrap logger with debugging
const createDebugLogger = (logger: AuditLogger) => {
  return new Proxy(logger, {
    get(target, prop) {
      if (prop === 'log') {
        return async (...args: any[]) => {
          console.log('🔍 Audit log call:', args);
          try {
            const result = await target.log(...args);
            console.log('✅ Audit log success');
            return result;
          } catch (error) {
            console.error('❌ Audit log error:', error);
            throw error;
          }
        };
      }
      return target[prop];
    }
  });
};
```

### Health Monitoring

```typescript
// Comprehensive health check
const comprehensiveHealthCheck = async () => {
  console.log('🔍 Running comprehensive health check...');
  
  // 1. Basic connectivity
  try {
    const health = await logger.getHealth();
    console.log('Health status:', health);
  } catch (error) {
    console.error('Health check failed:', error);
  }
  
  // 2. Write test
  try {
    await logger.log({
      actor: { type: 'system', id: 'health-check' },
      action: 'test',
      resource: { type: 'health', id: 'check' }
    });
    console.log('✅ Write test passed');
  } catch (error) {
    console.error('❌ Write test failed:', error);
  }
  
  // 3. Read test
  try {
    const events = await logger.query().limit(1).execute();
    console.log('✅ Read test passed, found', events.length, 'events');
  } catch (error) {
    console.error('❌ Read test failed:', error);
  }
  
  // 4. Database connectivity
  try {
    const { data, error } = await supabase.from('audit_logs').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connectivity test passed');
  } catch (error) {
    console.error('❌ Database connectivity test failed:', error);
  }
};
```

## 📞 Getting Help

### 1. Error Information Collection

When reporting issues, include:

```typescript
// Collect system information
const collectDiagnosticInfo = async () => {
  return {
    // Environment
    nodeVersion: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV,
    
    // Package version
    packageVersion: require('@99packages/audit-log/package.json').version,
    
    // Configuration (sanitized)
    config: {
      adapterType: logger.adapter.constructor.name,
      enableBatching: logger.config.enableBatching,
      enableAsync: logger.config.enableAsync
    },
    
    // Health status
    health: await logger.getHealth(),
    
    // Recent errors (if any)
    recentErrors: logger.getRecentErrors?.() || []
  };
};
```

### 2. Minimal Reproduction Example

```typescript
// Create minimal example that reproduces the issue
import { createAuditLogger, PostgreSQLAdapter } from '@99packages/audit-log';

const reproduceIssue = async () => {
  const logger = createAuditLogger({
    adapter: new PostgreSQLAdapter({
      // minimal configuration
    })
  });
  
  try {
    // Steps that reproduce the issue
    await logger.log({
      actor: { type: 'user', id: 'test' },
      action: 'test',
      resource: { type: 'test', id: 'test' }
    });
  } catch (error) {
    console.error('Issue reproduced:', error);
  }
};
```

### 3. Common Solutions Checklist

Before reporting an issue, try:

- [ ] Update to latest package version
- [ ] Clear node_modules and reinstall dependencies
- [ ] Check environment variables are set correctly
- [ ] Verify database permissions and connectivity
- [ ] Run health check diagnostic
- [ ] Check for TypeScript compilation errors
- [ ] Review configuration against documentation
- [ ] Test with minimal reproduction example

### 4. Support Channels

1. **GitHub Issues**: For bugs and feature requests
2. **Documentation**: Check the comprehensive docs first
3. **Examples**: Review example implementations
4. **Community**: Check discussions and existing issues

---

This troubleshooting guide covers the most common issues you might encounter. For complex problems, don't hesitate to create a minimal reproduction example and seek help through the appropriate channels.
