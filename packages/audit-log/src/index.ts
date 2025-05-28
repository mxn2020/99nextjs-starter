// Core exports
export * from './types';
export * from './schemas';
export * from './lib';
export * from './utils';

// Adapter exports
export * from './adapters';

// UI exports (React components)
export * from './ui';

// Middleware exports (Next.js)
export * from './middleware';

// Hooks exports (React)
export * from './hooks';

// Benchmark utilities
export * from './benchmark';

// Re-export commonly used items for convenience
export { createAuditLogger, AuditLogger, ResourceAuditLogger, ActorAuditLogger } from './lib';
export { PostgreSQLAdapter, MySQLAdapter, SQLiteAdapter, MongoDBAdapter, FileAdapter } from './adapters';
export { AuditTable, AuditFilters, AuditDashboard, AuditEventDetails } from './ui';
export { createAuditMiddleware, auditMiddlewares } from './middleware';
export { useAuditEvents, useAuditStats, useAuditLogger, useAuditHealth } from './hooks';
export { AuditBenchmark, printBenchmarkResults, compareBenchmarkResults } from './benchmark';
