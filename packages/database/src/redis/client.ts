import { createClient, RedisClientType } from 'redis';

export interface RedisConfig {
  url?: string;
  password?: string;
  database?: number;
}

export class RedisClient {
  private client: RedisClientType;
  
  constructor(config: RedisConfig = {}) {
    const url = config.url || process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url,
      password: config.password,
      database: config.database,
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  // Common operations
  async get(key: string): Promise<string | null> {
    await this.connect();
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.connect();
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.connect();
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    await this.connect();
    const result = await this.client.exists(key);
    return result === 1;
  }
}

let instance: RedisClient | null = null;

export function getRedisClient(config?: RedisConfig): RedisClient {
  if (!instance) {
    instance = new RedisClient(config);
  }
  return instance;
}