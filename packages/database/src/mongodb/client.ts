import { MongoClient, Db, Collection, MongoClientOptions } from 'mongodb';

export interface MongoDBConfig {
  uri?: string;
  dbName?: string;
  options?: MongoClientOptions;
}

export class MongoDBClient {
  private client: MongoClient;
  private db?: Db;
  private isConnected: boolean = false;

  constructor(
    uri: string = process.env.MONGODB_URI!,
    private dbName: string = 'default',
    options?: MongoClientOptions
  ) {
    if (!uri) {
      throw new Error('MongoDB URI is required');
    }
    this.client = new MongoClient(uri, options);
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollection<T = any>(name: string): Collection<T> {
    return this.getDb().collection<T>(name);
  }
}

let instance: MongoDBClient | null = null;

export async function getMongoClient(
  uri?: string,
  dbName?: string
): Promise<MongoDBClient> {
  if (!instance) {
    instance = new MongoDBClient(uri, dbName);
    await instance.connect();
  }
  return instance;
}