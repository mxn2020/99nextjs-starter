export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type TimestampFormat = 'iso' | 'locale' | 'unix' | 'pretty';
export type Transport = 'console' | 'file' | 'http' | 'custom';

export interface LogContext {
  [key: string]: unknown;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  service?: string;
  environment?: string;
  version?: string;
}

export interface LoggerOptions {
  name?: string;
  level?: LogLevel;
  timestampFormat?: TimestampFormat;
  context?: LogContext;
  transports?: Transport[];
  redact?: string[];
  prettyPrint?: boolean;
  useEmoji?: boolean;
  enabled?: boolean;
  serializers?: Record<string, (value: any) => any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  duration?: number;
}