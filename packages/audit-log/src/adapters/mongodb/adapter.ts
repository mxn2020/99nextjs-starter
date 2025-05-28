import type { MongoClient, Db, Collection } from 'mongodb';
import type { 
  AuditAdapter, 
  AuditEvent, 
  AuditFilter, 
  AuditStats, 
  AdapterConfig 
} from '../../types';
import { auditFilterSchema } from '../../schemas';
import { retry } from '../../utils';

export interface MongoDBAdapterConfig extends AdapterConfig {
  client?: MongoClient;
  connectionString?: string;
  databaseName?: string;
  collectionName?: string;
}

export class MongoDBAuditAdapter implements AuditAdapter {
  private client: MongoClient;
  private db: Db;
  private collection: Collection<AuditEvent>;
  private config: Required<Pick<MongoDBAdapterConfig, 'databaseName' | 'collectionName'>>;
  private isInitialized = false;

  constructor(config: MongoDBAdapterConfig) {
    if (!config.client && !config.connectionString) {
      throw new Error('Either client or connectionString must be provided');
    }

    this.client = config.client || this.createClient(config.connectionString!);
    this.config = {
      databaseName: config.databaseName || 'audit',
      collectionName: config.collectionName || 'audit_logs',
    };

    this.db = this.client.db(this.config.databaseName);
    this.collection = this.db.collection(this.config.collectionName);
  }

  private createClient(connectionString: string): MongoClient {
    const { MongoClient } = require('mongodb');
    return new MongoClient(connectionString);
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.client.connect();
    await this.createIndexes();
    this.isInitialized = true;
  }

  private async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndexes([
        { key: { timestamp: -1 } },
        { key: { action: 1 } },
        { key: { resource: 1 } },
        { key: { actorId: 1 } },
        { key: { level: 1 } },
        { key: { success: 1 } },
        { key: { 'metadata.environment': 1 } },
        { key: { description: 'text' } }, // Text search index
      ]);
    } catch (error) {
      // Indexes might already exist
      console.warn('Could not create indexes:', error);
    }
  }

  async log(event: AuditEvent): Promise<void> {
    await this.initialize();
    await retry(() => this.collection.insertOne(event));
  }

  async logBatch(events: AuditEvent[]): Promise<void> {
    if (events.length === 0) return;
    
    await this.initialize();
    await retry(() => this.collection.insertMany(events));
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    await this.initialize();
    
    const validatedFilter = auditFilterSchema.parse(filter);
    const mongoFilter = this.buildMongoFilter(validatedFilter);
    
    const sortField = this.mapSortField(validatedFilter.sortBy);
    const sortOrder = validatedFilter.sortOrder === 'ASC' ? 1 : -1;

    const cursor = this.collection
      .find(mongoFilter)
      .sort({ [sortField]: sortOrder })
      .skip(validatedFilter.offset)
      .limit(validatedFilter.limit);

    return await cursor.toArray();
  }

  async count(filter: Omit<AuditFilter, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>): Promise<number> {
    await this.initialize();
    
    const mongoFilter = this.buildMongoFilter(filter);
    return await this.collection.countDocuments(mongoFilter);
  }

  async getStats(filter: { startDate?: Date; endDate?: Date } = {}): Promise<AuditStats> {
    await this.initialize();
    
    const mongoFilter = this.buildMongoFilter(filter);

    const pipeline = [
      { $match: mongoFilter },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byAction: [
            { $group: { _id: '$action', count: { $sum: 1 } } }
          ],
          byResource: [
            { $group: { _id: '$resource', count: { $sum: 1 } } }
          ],
          byLevel: [
            { $group: { _id: '$level', count: { $sum: 1 } } }
          ],
          bySuccess: [
            { $group: { _id: '$success', count: { $sum: 1 } } }
          ],
          timeRange: [
            {
              $group: {
                _id: null,
                start: { $min: '$timestamp' },
                end: { $max: '$timestamp' }
              }
            }
          ]
        }
      }
    ];

    const [result] = await this.collection.aggregate(pipeline).toArray();

    const totalEvents = result.total[0]?.count || 0;
    
    const eventsByAction = result.byAction.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const eventsByResource = result.byResource.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const eventsByLevel = result.byLevel.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const successCount = result.bySuccess.find((item: any) => item._id === true)?.count || 0;
    const successRate = totalEvents > 0 ? (successCount / totalEvents) * 100 : 0;

    const timeRange = {
      start: result.timeRange[0]?.start || new Date(),
      end: result.timeRange[0]?.end || new Date(),
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
    
    const result = await this.collection.deleteMany({
      timestamp: { $lt: olderThan }
    });
    
    return result.deletedCount || 0;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.admin().ping();
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  private buildMongoFilter(filter: any): any {
    const mongoFilter: any = {};

    if (filter.startDate || filter.endDate) {
      mongoFilter.timestamp = {};
      if (filter.startDate) {
        mongoFilter.timestamp.$gte = filter.startDate;
      }
      if (filter.endDate) {
        mongoFilter.timestamp.$lte = filter.endDate;
      }
    }

    if (filter.actions?.length) {
      mongoFilter.action = { $in: filter.actions };
    }

    if (filter.resources?.length) {
      mongoFilter.resource = { $in: filter.resources };
    }

    if (filter.levels?.length) {
      mongoFilter.level = { $in: filter.levels };
    }

    if (filter.actorIds?.length) {
      mongoFilter.actorId = { $in: filter.actorIds };
    }

    if (typeof filter.success === 'boolean') {
      mongoFilter.success = filter.success;
    }

    if (filter.search) {
      mongoFilter.$or = [
        { description: { $regex: filter.search, $options: 'i' } },
        { actorId: { $regex: filter.search, $options: 'i' } },
        { resourceId: { $regex: filter.search, $options: 'i' } },
      ];
    }

    return mongoFilter;
  }

  private mapSortField(sortBy: string): string {
    // Map any field name differences if needed
    switch (sortBy) {
      default:
        return sortBy;
    }
  }
}
