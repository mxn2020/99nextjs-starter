import type { AuditAdapter, AuditEvent, AuditFilter } from '../types/audit.js';
import { generateAuditId, createContext } from '../utils/helpers.js';

export interface BenchmarkConfig {
  /** Number of events to generate for testing */
  eventCount: number;
  /** Number of concurrent operations */
  concurrency: number;
  /** Batch size for batch operations */
  batchSize: number;
  /** Whether to include read operations in benchmark */
  includeReads: boolean;
  /** Whether to include query operations in benchmark */
  includeQueries: boolean;
  /** Custom event generator function */
  eventGenerator?: () => AuditEvent;
}

export interface BenchmarkResults {
  /** Total time taken in milliseconds */
  totalTime: number;
  /** Events per second */
  eventsPerSecond: number;
  /** Average latency per operation in milliseconds */
  averageLatency: number;
  /** 95th percentile latency */
  p95Latency: number;
  /** 99th percentile latency */
  p99Latency: number;
  /** Memory usage statistics */
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  /** Detailed operation results */
  operations: {
    write: BenchmarkOperationResult;
    batchWrite?: BenchmarkOperationResult;
    read?: BenchmarkOperationResult;
    query?: BenchmarkOperationResult;
  };
  /** Health check results */
  health: {
    healthy: boolean;
    responseTime: number;
  };
}

export interface BenchmarkOperationResult {
  /** Number of operations performed */
  count: number;
  /** Total time for all operations */
  totalTime: number;
  /** Average time per operation */
  averageTime: number;
  /** All operation times for percentile calculation */
  latencies: number[];
  /** Number of successful operations */
  successCount: number;
  /** Number of failed operations */
  errorCount: number;
  /** Error messages if any */
  errors: string[];
}

/**
 * Performance benchmarking utility for audit adapters
 */
export class AuditBenchmark {
  private adapter: AuditAdapter;
  private config: BenchmarkConfig;

  constructor(adapter: AuditAdapter, config: Partial<BenchmarkConfig> = {}) {
    this.adapter = adapter;
    this.config = {
      eventCount: 1000,
      concurrency: 10,
      batchSize: 50,
      includeReads: true,
      includeQueries: true,
      ...config,
    };
  }

  /**
   * Run comprehensive benchmark tests
   */
  async run(): Promise<BenchmarkResults> {
    console.log('Starting audit adapter benchmark...');
    console.log(`Configuration:`, this.config);

    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    const results: BenchmarkResults = {
      totalTime: 0,
      eventsPerSecond: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
      },
      operations: {
        write: this.createEmptyOperationResult(),
      },
      health: {
        healthy: false,
        responseTime: 0,
      },
    };

    try {
      // Test health check
      results.health = await this.benchmarkHealthCheck();

      // Test individual writes
      results.operations.write = await this.benchmarkWrites();

      // Test batch writes
      results.operations.batchWrite = await this.benchmarkBatchWrites();

      // Test reads if enabled
      if (this.config.includeReads) {
        results.operations.read = await this.benchmarkReads();
      }

      // Test queries if enabled
      if (this.config.includeQueries) {
        results.operations.query = await this.benchmarkQueries();
      }

      // Calculate overall statistics
      const endTime = Date.now();
      const endMemory = process.memoryUsage();

      results.totalTime = endTime - startTime;
      results.eventsPerSecond = (this.config.eventCount * 2) / (results.totalTime / 1000); // writes + batch writes
      
      const allLatencies = [
        ...results.operations.write.latencies,
        ...(results.operations.batchWrite?.latencies || []),
        ...(results.operations.read?.latencies || []),
        ...(results.operations.query?.latencies || []),
      ];

      results.averageLatency = allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;
      results.p95Latency = this.calculatePercentile(allLatencies, 95);
      results.p99Latency = this.calculatePercentile(allLatencies, 99);

      results.memoryUsage = {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
      };

      console.log('Benchmark completed successfully');
      return results;

    } catch (error) {
      console.error('Benchmark failed:', error);
      throw error;
    }
  }

  /**
   * Benchmark health check operations
   */
  private async benchmarkHealthCheck(): Promise<{ healthy: boolean; responseTime: number }> {
    const start = Date.now();
    const health = await this.adapter.healthCheck();
    const responseTime = Date.now() - start;

    return {
      healthy: health.healthy,
      responseTime,
    };
  }

  /**
   * Benchmark individual write operations
   */
  private async benchmarkWrites(): Promise<BenchmarkOperationResult> {
    console.log(`Benchmarking ${this.config.eventCount} individual writes...`);

    const result = this.createEmptyOperationResult();
    const events = this.generateEvents(this.config.eventCount);
    
    const promises = events.map(async (event) => {
      const start = Date.now();
      try {
        await this.adapter.log(event);
        const latency = Date.now() - start;
        result.latencies.push(latency);
        result.successCount++;
      } catch (error) {
        const latency = Date.now() - start;
        result.latencies.push(latency);
        result.errorCount++;
        result.errors.push(error instanceof Error ? error.message : String(error));
      }
    });

    const startTime = Date.now();
    
    // Execute with controlled concurrency
    await this.executeConcurrent(promises, this.config.concurrency);
    
    result.totalTime = Date.now() - startTime;
    result.count = events.length;
    result.averageTime = result.totalTime / result.count;

    return result;
  }

  /**
   * Benchmark batch write operations
   */
  private async benchmarkBatchWrites(): Promise<BenchmarkOperationResult> {
    console.log(`Benchmarking batch writes (batch size: ${this.config.batchSize})...`);

    const result = this.createEmptyOperationResult();
    const events = this.generateEvents(this.config.eventCount);
    const batches = this.createBatches(events, this.config.batchSize);

    const promises = batches.map(async (batch) => {
      const start = Date.now();
      try {
        await this.adapter.logBatch(batch);
        const latency = Date.now() - start;
        result.latencies.push(latency);
        result.successCount++;
      } catch (error) {
        const latency = Date.now() - start;
        result.latencies.push(latency);
        result.errorCount++;
        result.errors.push(error instanceof Error ? error.message : String(error));
      }
    });

    const startTime = Date.now();
    await this.executeConcurrent(promises, this.config.concurrency);
    
    result.totalTime = Date.now() - startTime;
    result.count = batches.length;
    result.averageTime = result.totalTime / result.count;

    return result;
  }

  /**
   * Benchmark read operations
   */
  private async benchmarkReads(): Promise<BenchmarkOperationResult> {
    console.log('Benchmarking read operations...');

    const result = this.createEmptyOperationResult();
    const readCount = Math.min(100, this.config.eventCount / 10); // 10% of writes or max 100

    const promises = Array.from({ length: readCount }, async () => {
      const start = Date.now();
      try {
        await this.adapter.query({}, 10, 0);
        const latency = Date.now() - start;
        result.latencies.push(latency);
        result.successCount++;
      } catch (error) {
        const latency = Date.now() - start;
        result.latencies.push(latency);
        result.errorCount++;
        result.errors.push(error instanceof Error ? error.message : String(error));
      }
    });

    const startTime = Date.now();
    await this.executeConcurrent(promises, this.config.concurrency);
    
    result.totalTime = Date.now() - startTime;
    result.count = readCount;
    result.averageTime = result.totalTime / result.count;

    return result;
  }

  /**
   * Benchmark query operations
   */
  private async benchmarkQueries(): Promise<BenchmarkOperationResult> {
    console.log('Benchmarking query operations...');

    const result = this.createEmptyOperationResult();
    const queries: AuditFilter[] = [
      { actions: ['user.login'] },
      { levels: ['high', 'critical'] },
      { actorIds: ['user123'] },
      { success: false },
      { 
        dateRange: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          to: new Date(),
        }
      },
    ];

    const promises = queries.flatMap(query => 
      Array.from({ length: 5 }, async () => {
        const start = Date.now();
        try {
          await this.adapter.query(query, 20, 0);
          const latency = Date.now() - start;
          result.latencies.push(latency);
          result.successCount++;
        } catch (error) {
          const latency = Date.now() - start;
          result.latencies.push(latency);
          result.errorCount++;
          result.errors.push(error instanceof Error ? error.message : String(error));
        }
      })
    );

    const startTime = Date.now();
    await this.executeConcurrent(promises, this.config.concurrency);
    
    result.totalTime = Date.now() - startTime;
    result.count = promises.length;
    result.averageTime = result.totalTime / result.count;

    return result;
  }

  /**
   * Generate test audit events
   */
  private generateEvents(count: number): AuditEvent[] {
    const actions = [
      'user.login', 'user.logout', 'user.register', 'user.update',
      'resource.create', 'resource.read', 'resource.update', 'resource.delete',
      'api.request', 'api.response', 'system.start', 'system.stop'
    ];

    const actorTypes = ['user', 'system', 'service', 'admin'];
    const resourceTypes = ['document', 'user', 'api_endpoint', 'system'];
    const levels = ['low', 'medium', 'high', 'critical'] as const;

    return Array.from({ length: count }, () => {
      if (this.config.eventGenerator) {
        return this.config.eventGenerator();
      }

      const action = actions[Math.floor(Math.random() * actions.length)]!;
      const level = levels[Math.floor(Math.random() * levels.length)]!;
      const actorType = actorTypes[Math.floor(Math.random() * actorTypes.length)]!;
      const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]!;

      return {
        id: generateAuditId(),
        timestamp: new Date(),
        action,
        level,
        actor: {
          id: `${actorType}_${Math.floor(Math.random() * 1000)}`,
          type: actorType,
          name: `Test ${actorType}`,
          email: `test@example.com`,
        },
        resource: {
          id: `${resourceType}_${Math.floor(Math.random() * 1000)}`,
          type: resourceType,
          name: `Test ${resourceType}`,
        },
        context: createContext({
          userAgent: 'Benchmark/1.0',
          ipAddress: '127.0.0.1',
        }),
        metadata: {
          benchmark: true,
          iteration: Math.floor(Math.random() * count),
        },
        success: Math.random() > 0.1, // 90% success rate
        durationMs: Math.floor(Math.random() * 1000),
      };
    });
  }

  /**
   * Create batches from events
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Execute promises with controlled concurrency
   */
  private async executeConcurrent<T>(promises: Promise<T>[], concurrency: number): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < promises.length; i += concurrency) {
      const batch = promises.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }
    
    return results;
  }

  /**
   * Calculate percentile from latency array
   */
  private calculatePercentile(latencies: number[], percentile: number): number {
    if (latencies.length === 0) return 0;
    
    const sorted = [...latencies].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Create empty operation result
   */
  private createEmptyOperationResult(): BenchmarkOperationResult {
    return {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      latencies: [],
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }
}

/**
 * Print benchmark results in a formatted way
 */
export function printBenchmarkResults(results: BenchmarkResults): void {
  console.log('\n=== Audit Adapter Benchmark Results ===\n');
  
  console.log('📊 Overall Performance:');
  console.log(`  Total Time: ${results.totalTime.toLocaleString()}ms`);
  console.log(`  Events/Second: ${results.eventsPerSecond.toFixed(2)}`);
  console.log(`  Average Latency: ${results.averageLatency.toFixed(2)}ms`);
  console.log(`  95th Percentile: ${results.p95Latency.toFixed(2)}ms`);
  console.log(`  99th Percentile: ${results.p99Latency.toFixed(2)}ms`);
  
  console.log('\n💾 Memory Usage:');
  console.log(`  Heap Used: ${(results.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Heap Total: ${(results.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  External: ${(results.memoryUsage.external / 1024 / 1024).toFixed(2)}MB`);
  
  console.log('\n🔍 Health Check:');
  console.log(`  Status: ${results.health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  console.log(`  Response Time: ${results.health.responseTime}ms`);
  
  console.log('\n📝 Operation Details:');
  
  const printOperation = (name: string, op: BenchmarkOperationResult) => {
    const successRate = ((op.successCount / op.count) * 100).toFixed(1);
    console.log(`  ${name}:`);
    console.log(`    Count: ${op.count.toLocaleString()}`);
    console.log(`    Total Time: ${op.totalTime.toLocaleString()}ms`);
    console.log(`    Average Time: ${op.averageTime.toFixed(2)}ms`);
    console.log(`    Success Rate: ${successRate}%`);
    if (op.errorCount > 0) {
      console.log(`    Errors: ${op.errorCount} (${op.errors.slice(0, 3).join(', ')}${op.errors.length > 3 ? '...' : ''})`);
    }
  };

  printOperation('Individual Writes', results.operations.write);
  
  if (results.operations.batchWrite) {
    printOperation('Batch Writes', results.operations.batchWrite);
  }
  
  if (results.operations.read) {
    printOperation('Reads', results.operations.read);
  }
  
  if (results.operations.query) {
    printOperation('Queries', results.operations.query);
  }
  
  console.log('\n=== End Benchmark Results ===\n');
}

/**
 * Compare two benchmark results
 */
export function compareBenchmarkResults(
  baseline: BenchmarkResults,
  current: BenchmarkResults
): void {
  console.log('\n=== Benchmark Comparison ===\n');
  
  const calculateChange = (baseline: number, current: number): string => {
    const change = ((current - baseline) / baseline) * 100;
    const symbol = change > 0 ? '↗️' : change < 0 ? '↘️' : '→';
    const color = change > 0 ? '+' : '';
    return `${symbol} ${color}${change.toFixed(1)}%`;
  };
  
  console.log('📊 Performance Changes:');
  console.log(`  Events/Second: ${baseline.eventsPerSecond.toFixed(2)} → ${current.eventsPerSecond.toFixed(2)} ${calculateChange(baseline.eventsPerSecond, current.eventsPerSecond)}`);
  console.log(`  Average Latency: ${baseline.averageLatency.toFixed(2)}ms → ${current.averageLatency.toFixed(2)}ms ${calculateChange(baseline.averageLatency, current.averageLatency)}`);
  console.log(`  95th Percentile: ${baseline.p95Latency.toFixed(2)}ms → ${current.p95Latency.toFixed(2)}ms ${calculateChange(baseline.p95Latency, current.p95Latency)}`);
  console.log(`  Total Time: ${baseline.totalTime}ms → ${current.totalTime}ms ${calculateChange(baseline.totalTime, current.totalTime)}`);
  
  console.log('\n💾 Memory Changes:');
  console.log(`  Heap Used: ${(baseline.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB → ${(current.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB ${calculateChange(baseline.memoryUsage.heapUsed, current.memoryUsage.heapUsed)}`);
  
  console.log('\n=== End Comparison ===\n');
}
