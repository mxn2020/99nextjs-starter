# Performance & Benchmarking Guide

A comprehensive guide to optimizing performance and benchmarking your audit logging implementation with `@99packages/audit-log`.

## 📊 Table of Contents

- [Performance Optimization](#-performance-optimization)
- [Benchmarking Tools](#-benchmarking-tools)
- [Database Performance](#-database-performance)
- [Memory Management](#-memory-management)
- [Monitoring & Metrics](#-monitoring--metrics)
- [Troubleshooting Performance Issues](#-troubleshooting-performance-issues)
- [Best Practices](#-best-practices)

## 🚀 Performance Optimization

### Core Performance Features

The audit log package includes several built-in performance optimizations:

- **Batching**: Automatic batching of multiple audit events
- **Queuing**: Internal queuing system to handle high-volume logging
- **Async Operations**: Non-blocking audit logging
- **Connection Pooling**: Efficient database connection management
- **Data Compression**: Optional compression for large payloads

### Configuration for High Performance

```typescript
import { createAuditLogger, PostgreSQLAdapter } from '@99packages/audit-log';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseKey);

const logger = createAuditLogger({
  adapter: new PostgreSQLAdapter({
    client: supabase,
    // Performance optimizations
    batchSize: 100,           // Batch up to 100 events
    flushInterval: 1000,      // Flush every 1 second
    maxQueueSize: 10000,      // Queue up to 10k events
    enableCompression: true,   // Compress large payloads
    connectionPool: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 30000,
    }
  }),
  // Global performance settings
  enableBatching: true,
  enableAsync: true,
  retryOptions: {
    attempts: 3,
    delay: 1000,
    backoff: 2.0
  }
});
```

### Optimizing for Different Use Cases

#### High-Volume Applications

```typescript
// Configuration for applications with >10k events/minute
const highVolumeConfig = {
  adapter: new PostgreSQLAdapter({
    client: supabase,
    batchSize: 500,
    flushInterval: 500,
    maxQueueSize: 50000,
    enableCompression: true,
    enablePartitioning: true, // Use table partitioning
    indexOptimization: 'write_heavy'
  }),
  enableBatching: true,
  enableAsync: true,
  enableCaching: true,
  cacheSize: 10000
};
```

#### Real-time Applications

```typescript
// Configuration for applications requiring low latency
const realTimeConfig = {
  adapter: new PostgreSQLAdapter({
    client: supabase,
    batchSize: 1,            // No batching for immediate writes
    flushInterval: 0,        // Immediate flush
    enableCompression: false, // Skip compression for speed
    connectionPool: {
      min: 10,               // More connections for lower latency
      max: 50
    }
  }),
  enableBatching: false,
  enableAsync: false,        // Synchronous for guaranteed writes
  retryOptions: {
    attempts: 1             // No retries for speed
  }
};
```

## 🔍 Benchmarking Tools

The package includes comprehensive benchmarking utilities to measure performance.

### Basic Benchmarking

```typescript
import { AuditBenchmark, printBenchmarkResults } from '@99packages/audit-log';

const benchmark = new AuditBenchmark({
  eventCount: 10000,
  concurrency: 10,
  batchSize: 100,
  includeReads: true,
  includeQueries: true
});

// Run benchmark
const results = await benchmark.run(logger);

// Print detailed results
printBenchmarkResults(results);
```

### Custom Benchmark Configuration

```typescript
const customBenchmark = new AuditBenchmark({
  eventCount: 50000,
  concurrency: 20,
  batchSize: 250,
  includeReads: true,
  includeQueries: true,
  // Custom event generator for realistic testing
  eventGenerator: () => ({
    id: generateAuditId(),
    timestamp: new Date(),
    actor: {
      type: 'user',
      id: `user_${Math.floor(Math.random() * 1000)}`,
      name: `Test User ${Math.floor(Math.random() * 1000)}`
    },
    action: 'update',
    resource: {
      type: 'product',
      id: `product_${Math.floor(Math.random() * 5000)}`
    },
    context: {
      userAgent: 'benchmark-test',
      ip: '127.0.0.1',
      sessionId: 'benchmark-session'
    },
    metadata: {
      field: 'price',
      oldValue: Math.floor(Math.random() * 100),
      newValue: Math.floor(Math.random() * 100)
    }
  })
});
```

### Comparing Performance

```typescript
import { compareBenchmarkResults } from '@99packages/audit-log';

// Benchmark with different configurations
const fileResults = await benchmark.run(fileLogger);
const postgresResults = await benchmark.run(postgresLogger);
const mongoResults = await benchmark.run(mongoLogger);

// Compare results
const comparison = compareBenchmarkResults([
  { name: 'File Adapter', results: fileResults },
  { name: 'PostgreSQL Adapter', results: postgresResults },
  { name: 'MongoDB Adapter', results: mongoResults }
]);

console.table(comparison);
```

### Benchmark Results Interpretation

```typescript
interface BenchmarkResults {
  totalTime: number;           // Total execution time (ms)
  eventsPerSecond: number;     // Throughput metric
  averageLatency: number;      // Average operation time (ms)
  p95Latency: number;          // 95th percentile latency (ms)
  p99Latency: number;          // 99th percentile latency (ms)
  memoryUsage: {
    heapUsed: number;          // Memory used (bytes)
    heapTotal: number;         // Total heap size (bytes)
    external: number;          // External memory (bytes)
  };
  operations: {
    write: BenchmarkOperationResult;
    batchWrite?: BenchmarkOperationResult;
    read?: BenchmarkOperationResult;
    query?: BenchmarkOperationResult;
  };
  health: {
    healthy: boolean;
    responseTime: number;
  };
}
```

## 🗄️ Database Performance

### PostgreSQL/Supabase Optimization

#### Indexing Strategy

```sql
-- Essential indexes for audit logs
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_actor_timestamp 
ON audit_logs (actor_id, timestamp DESC);

CREATE INDEX idx_audit_logs_resource_timestamp 
ON audit_logs (resource_type, resource_id, timestamp DESC);

-- GIN index for metadata queries
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN (metadata);
```

#### Table Partitioning

```sql
-- Partition by month for time-based queries
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Automatic partition creation function
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    table_name text;
BEGIN
    start_date := date_trunc('month', CURRENT_DATE);
    end_date := start_date + interval '1 month';
    table_name := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
                   FOR VALUES FROM (%L) TO (%L)',
                   table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

#### Query Optimization

```typescript
// Efficient query patterns
const auditQuery = logger.query()
  .where('timestamp', '>=', startDate)
  .where('timestamp', '<', endDate)
  .where('actor.id', '=', userId)
  .orderBy('timestamp', 'desc')
  .limit(100);

// Use specific indexes
const resourceQuery = logger.query()
  .where('resource.type', '=', 'product')
  .where('resource.id', '=', productId)
  .where('timestamp', '>=', new Date(Date.now() - 86400000)) // Last 24h
  .orderBy('timestamp', 'desc');
```

### MongoDB Optimization

```typescript
// MongoDB-specific performance configuration
const mongoAdapter = new MongoDBAdapter({
  uri: mongoUri,
  database: 'audit_logs',
  collection: 'events',
  // Performance optimizations
  batchSize: 1000,
  writeConcern: { w: 1, j: false }, // Faster writes, less durability
  readConcern: { level: 'local' },
  // Indexing strategy
  indexes: [
    { timestamp: -1 },
    { 'actor.id': 1, timestamp: -1 },
    { 'resource.type': 1, 'resource.id': 1, timestamp: -1 },
    { action: 1 },
    { metadata: 'text' } // Text search
  ]
});
```

## 💾 Memory Management

### Memory-Efficient Configuration

```typescript
// Configuration for memory-constrained environments
const memoryEfficientConfig = {
  adapter: new PostgreSQLAdapter({
    client: supabase,
    batchSize: 50,           // Smaller batches
    maxQueueSize: 1000,      // Smaller queue
    enableCompression: true,  // Compress to save memory
    connectionPool: {
      min: 1,
      max: 5                // Fewer connections
    }
  }),
  enableCaching: false,      // Disable caching to save memory
  retryOptions: {
    attempts: 2             // Fewer retries
  }
};
```

### Memory Monitoring

```typescript
// Monitor memory usage in your application
const monitorMemory = () => {
  const usage = process.memoryUsage();
  console.log({
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
    external: Math.round(usage.external / 1024 / 1024) + ' MB',
    rss: Math.round(usage.rss / 1024 / 1024) + ' MB'
  });
};

// Monitor during high-volume operations
setInterval(monitorMemory, 5000);
```

## 📈 Monitoring & Metrics

### Built-in Health Monitoring

```typescript
// Health check endpoint
app.get('/health/audit', async (req, res) => {
  const health = await logger.getHealth();
  res.json({
    status: health.healthy ? 'ok' : 'error',
    metrics: {
      responseTime: health.responseTime,
      queueSize: health.queueSize,
      errorRate: health.errorRate,
      memoryUsage: health.memoryUsage
    },
    timestamp: new Date().toISOString()
  });
});
```

### Custom Metrics Collection

```typescript
// Custom metrics with Prometheus
import { register, Counter, Histogram, Gauge } from 'prom-client';

const auditCounter = new Counter({
  name: 'audit_events_total',
  help: 'Total number of audit events',
  labelNames: ['action', 'resource_type', 'status']
});

const auditLatency = new Histogram({
  name: 'audit_latency_seconds',
  help: 'Audit operation latency',
  labelNames: ['operation']
});

const queueSize = new Gauge({
  name: 'audit_queue_size',
  help: 'Current audit queue size'
});

// Instrument your logger
const instrumentedLogger = new Proxy(logger, {
  get(target, prop) {
    if (prop === 'log') {
      return async (...args) => {
        const start = Date.now();
        try {
          const result = await target.log(...args);
          auditCounter.inc({ status: 'success' });
          auditLatency.observe({ operation: 'log' }, (Date.now() - start) / 1000);
          return result;
        } catch (error) {
          auditCounter.inc({ status: 'error' });
          throw error;
        }
      };
    }
    return target[prop];
  }
});
```

## 🔧 Troubleshooting Performance Issues

### Common Performance Problems

#### 1. High Latency

**Symptoms**: Slow audit logging operations
**Causes**: 
- Network latency to database
- Inefficient queries
- Missing indexes
- Large payload sizes

**Solutions**:
```typescript
// Enable batching and async operations
const logger = createAuditLogger({
  adapter: new PostgreSQLAdapter({
    client: supabase,
    batchSize: 200,
    flushInterval: 1000
  }),
  enableBatching: true,
  enableAsync: true
});

// Optimize payload size
const optimizedEvent = {
  // Only include essential data
  actor: { type: 'user', id: userId },
  action: 'update',
  resource: { type: 'product', id: productId },
  // Avoid large metadata objects
  metadata: { 
    changedFields: ['price'], // Instead of full object diff
    timestamp: Date.now()
  }
};
```

#### 2. Memory Issues

**Symptoms**: High memory usage, out-of-memory errors
**Causes**:
- Large queue sizes
- Memory leaks
- Large payloads

**Solutions**:
```typescript
// Reduce queue size and batch size
const memoryOptimizedLogger = createAuditLogger({
  adapter: new PostgreSQLAdapter({
    client: supabase,
    batchSize: 25,
    maxQueueSize: 500,
    enableCompression: true
  }),
  enableCaching: false
});

// Implement payload size limits
const MAX_PAYLOAD_SIZE = 1024 * 10; // 10KB

const validatePayloadSize = (event: AuditEvent) => {
  const size = JSON.stringify(event).length;
  if (size > MAX_PAYLOAD_SIZE) {
    throw new Error(`Audit event payload too large: ${size} bytes`);
  }
};
```

#### 3. Database Connection Issues

**Symptoms**: Connection timeouts, pool exhaustion
**Causes**:
- Too few connections
- Connection leaks
- Long-running transactions

**Solutions**:
```typescript
// Optimize connection pool
const connectionOptimizedAdapter = new PostgreSQLAdapter({
  client: supabase,
  connectionPool: {
    min: 5,
    max: 25,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    createRetryIntervalMillis: 200
  }
});

// Monitor connection health
setInterval(async () => {
  const health = await logger.getHealth();
  if (!health.healthy) {
    console.error('Audit logger unhealthy:', health);
  }
}, 30000);
```

## ✅ Best Practices

### 1. Choose the Right Configuration

```typescript
// Development (easy debugging)
const devConfig = {
  adapter: new FileAdapter({ directory: './audit-logs' }),
  enableBatching: false,
  enableAsync: false
};

// Staging (similar to production)
const stagingConfig = {
  adapter: new PostgreSQLAdapter({ client: supabase }),
  enableBatching: true,
  batchSize: 50,
  enableAsync: true
};

// Production (high performance)
const prodConfig = {
  adapter: new PostgreSQLAdapter({
    client: supabase,
    batchSize: 200,
    flushInterval: 1000,
    enableCompression: true,
    connectionPool: { min: 5, max: 20 }
  }),
  enableBatching: true,
  enableAsync: true,
  enableCaching: true
};
```

### 2. Monitor and Alert

```typescript
// Set up monitoring
const setupMonitoring = (logger: AuditLogger) => {
  // Monitor queue size
  setInterval(async () => {
    const health = await logger.getHealth();
    if (health.queueSize > 5000) {
      console.warn('Audit queue size high:', health.queueSize);
    }
  }, 10000);

  // Monitor error rate
  let errorCount = 0;
  let totalCount = 0;
  
  logger.on('error', () => errorCount++);
  logger.on('success', () => totalCount++);
  
  setInterval(() => {
    const errorRate = totalCount > 0 ? errorCount / totalCount : 0;
    if (errorRate > 0.05) { // 5% error rate
      console.error('High audit error rate:', errorRate);
    }
    errorCount = 0;
    totalCount = 0;
  }, 60000);
};
```

### 3. Regular Performance Testing

```typescript
// Automated performance testing
const runPerformanceTest = async () => {
  const benchmark = new AuditBenchmark({
    eventCount: 10000,
    concurrency: 10,
    batchSize: 100
  });
  
  const results = await benchmark.run(logger);
  
  // Assert performance requirements
  expect(results.eventsPerSecond).toBeGreaterThan(1000);
  expect(results.p95Latency).toBeLessThan(100); // 100ms
  expect(results.memoryUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB
  
  return results;
};

// Run in CI/CD pipeline
if (process.env.NODE_ENV === 'test') {
  test('performance requirements', runPerformanceTest);
}
```

### 4. Database Maintenance

```sql
-- PostgreSQL maintenance queries

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM audit_logs 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC LIMIT 100;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'audit_logs';

-- Monitor table size
SELECT 
  pg_size_pretty(pg_total_relation_size('audit_logs')) as total_size,
  pg_size_pretty(pg_relation_size('audit_logs')) as table_size,
  pg_size_pretty(pg_indexes_size('audit_logs')) as index_size;

-- Archive old data
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '2 years';
```

---

## 📊 Performance Benchmarks

### Typical Performance Metrics

| Configuration | Events/Second | P95 Latency | Memory Usage |
|---------------|---------------|-------------|--------------|
| File Adapter | 5,000 | 2ms | 50MB |
| PostgreSQL (Single) | 3,000 | 5ms | 75MB |
| PostgreSQL (Batch) | 15,000 | 20ms | 100MB |
| MongoDB (Single) | 4,000 | 4ms | 80MB |
| MongoDB (Batch) | 18,000 | 15ms | 120MB |

### Hardware Requirements

**Minimum Requirements**:
- CPU: 2 cores
- RAM: 4GB
- Storage: SSD recommended

**Recommended for High-Volume**:
- CPU: 4+ cores
- RAM: 8GB+
- Storage: NVMe SSD
- Network: Low latency to database

---

This performance guide provides comprehensive information for optimizing your audit logging implementation. Regular monitoring and benchmarking will help ensure your system maintains optimal performance as it scales.
