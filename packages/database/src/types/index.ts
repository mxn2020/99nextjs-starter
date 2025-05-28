export interface DatabaseConfig {
  connectionString?: string;
  maxConnections?: number;
  ssl?: boolean;
}

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

export type DatabaseProvider = 
  | 'neon' 
  | 'mongodb' 
  | 'prisma' 
  | 'supabase' 
  | 'redis' 
  | 'upstash';