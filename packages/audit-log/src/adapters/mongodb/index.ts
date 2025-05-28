import { MongoDBAuditAdapter, type MongoDBAdapterConfig } from './adapter';

export { MongoDBAuditAdapter } from './adapter';
export type { MongoDBAdapterConfig } from './adapter';

// Factory function for easy setup
export function createMongoDBAdapter(config: MongoDBAdapterConfig) {
  return new MongoDBAuditAdapter(config);
}
