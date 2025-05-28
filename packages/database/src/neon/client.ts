import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

export interface NeonConfig {
  connectionString?: string;
}

export class NeonClient {
  private sql: ReturnType<typeof neon>;
  
  constructor(connectionString: string = process.env.NEON_DATABASE_URL!) {
    if (!connectionString) {
      throw new Error('Neon connection string is required');
    }
    this.sql = neon(connectionString);
  }

  getSql() {
    return this.sql;
  }

  getDrizzle() {
    return drizzle(this.sql);
  }

  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    try {
      const result = await this.sql(query, params);
      return result as T[];
    } catch (error) {
      console.error('Neon query error:', error);
      throw error;
    }
  }
}

let instance: NeonClient | null = null;

export function getNeonClient(connectionString?: string): NeonClient {
  if (!instance) {
    instance = new NeonClient(connectionString);
  }
  return instance;
}