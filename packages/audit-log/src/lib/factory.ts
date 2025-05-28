import type { AuditAdapter, AuditLoggerConfig } from '../types';
import { AuditLogger } from './audit-logger';

/**
 * Create a configured audit logger instance
 */
export function createAuditLogger(
  adapter: AuditAdapter, 
  config: Partial<AuditLoggerConfig> = {}
): AuditLogger {
  return new AuditLogger(adapter, config);
}

/**
 * Create audit logger with environment-based configuration
 */
export function createAuditLoggerFromEnv(adapter: AuditAdapter): AuditLogger {
  const config: Partial<AuditLoggerConfig> = {
    enabled: process.env.AUDIT_ENABLED !== 'false',
    level: (process.env.AUDIT_LEVEL as any) || 'MEDIUM',
    batchSize: parseInt(process.env.AUDIT_BATCH_SIZE || '100'),
    flushInterval: parseInt(process.env.AUDIT_FLUSH_INTERVAL || '5000'),
    maxRetries: parseInt(process.env.AUDIT_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.AUDIT_RETRY_DELAY || '1000'),
    sanitize: {
      enabled: process.env.AUDIT_SANITIZE_ENABLED !== 'false',
      fields: process.env.AUDIT_SANITIZE_FIELDS?.split(',') || [''],
      replacement: process.env.AUDIT_SANITIZE_REPLACEMENT || '[REDACTED]',
    },
    metadata: {
      environment: (process.env.NODE_ENV as any) || 'development',
      service: process.env.SERVICE_NAME,
      version: process.env.SERVICE_VERSION,
    },
  };

  return createAuditLogger(adapter, config);
}
