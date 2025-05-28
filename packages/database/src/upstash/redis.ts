import { Redis } from '@upstash/redis';

export const upstashRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Helper functions
export const upstashRedisHelpers = {
  async getJSON<T>(key: string): Promise<T | null> {
    return await upstashRedis.get<T>(key);
  },

  async setJSON<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (ttl) {
      await upstashRedis.setex(key, ttl, JSON.stringify(value));
    } else {
      await upstashRedis.set(key, JSON.stringify(value));
    }
  },

  async increment(key: string, amount: number = 1): Promise<number> {
    return await upstashRedis.incrby(key, amount);
  },

  async expire(key: string, seconds: number): Promise<void> {
    await upstashRedis.expire(key, seconds);
  },

  async lpush(key: string, ...values: any[]): Promise<number> {
    return await upstashRedis.lpush(key, ...values);
  },

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await upstashRedis.lrange(key, start, stop);
  },
};