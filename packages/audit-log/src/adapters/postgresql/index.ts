import { PostgreSQLAuditAdapter, type PostgreSQLAdapterConfig } from './adapter';

export { PostgreSQLAuditAdapter } from './adapter';
export type { PostgreSQLAdapterConfig } from './adapter';

// Factory function for easy setup
export function createPostgreSQLAdapter(config: PostgreSQLAdapterConfig) {
  return new PostgreSQLAuditAdapter(config);
}
