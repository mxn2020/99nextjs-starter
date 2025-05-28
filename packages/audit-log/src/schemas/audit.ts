import { z } from 'zod';

export const auditEventActionSchema = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'login_failed',
  'password_change',
  'password_reset',
  'account_locked',
  'account_unlocked',
  'permission_granted',
  'permission_denied',
  'access_granted',
  'access_denied',
  'session_start',
  'session_end',
  'data_export',
  'data_import',
  'backup_created',
  'backup_restored',
  'system_start',
  'system_stop',
  'config_change',
  'custom',
  'register',
  'email_verify',
  'role_change',
  'permission_grant',
  'permission_revoke',
  'api_call',
  'file_upload',
  'file_download',
  'export',
  'import',
  'backup',
  'restore',
  'maintenance',
  'other'
]);

export const auditLevelSchema = z.enum(['low', 'medium', 'high', 'critical', 'debug', 'info', 'warn', 'error']);

export const auditResourceSchema = z.enum([
  'user',
  'role', 
  'permission',
  'system',
  'data',
  'session',
  'api',
  'file',
  'custom',
  'post',
  'comment',
  'setting',
  'other'
]);

export const auditContextSchema = z.object({
  requestId: z.string().optional(),
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  location: z.string().optional(),
  endpoint: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.number().int().min(100).max(599).optional(),
  duration: z.number().min(0).optional(),
  deviceId: z.string().optional(),
  browserInfo: z.string().optional(),
  referrer: z.string().url().optional(),
  correlation: z.object({
    traceId: z.string().optional(),
    spanId: z.string().optional(),
    parentSpanId: z.string().optional(),
  }).optional(),
  custom: z.record(z.any()).optional(),
}).strict();

export const auditMetadataSchema = z.object({
  version: z.string().optional(),
  schema: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  environment: z.enum(['development', 'staging', 'production']).optional(),
  service: z.string().optional(),
  component: z.string().optional(),
  batch: z.object({
    id: z.string(),
    size: z.number().int().positive(),
    index: z.number().int().min(0),
  }).optional(),
}).strict();

export const auditEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.date(),
  action: auditEventActionSchema,
  resource: auditResourceSchema,
  resourceId: z.string().optional(),
  level: auditLevelSchema,
  actorId: z.string().optional(),
  actorType: z.enum(['user', 'system', 'service', 'api', 'admin', 'anonymous']).optional(),
  targetId: z.string().optional(),
  targetType: z.string().optional(),
  description: z.string().min(1),
  success: z.boolean(),
  context: auditContextSchema.optional(),
  oldValues: z.record(z.any()).optional(),
  newValues: z.record(z.any()).optional(),
  error: z.object({
    code: z.string().optional(),
    message: z.string().optional(),
    stack: z.string().optional(),
  }).optional(),
  metadata: auditMetadataSchema.optional(),
}).strict();

export const auditFilterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  actions: z.array(auditEventActionSchema).optional(),
  resources: z.array(auditResourceSchema).optional(),
  levels: z.array(auditLevelSchema).optional(),
  actorIds: z.array(z.string()).optional(),
  success: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['id', 'timestamp', 'action', 'resource', 'level', 'actorId', 'success']).default('timestamp'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
}).strict();

export const auditLoggerConfigSchema = z.object({
  level: auditLevelSchema.default('medium'),
  enabled: z.boolean().default(true),
  batchSize: z.number().int().positive().max(1000).default(100),
  flushInterval: z.number().int().positive().default(5000),
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryDelay: z.number().int().positive().default(1000),
  sanitize: z.object({
    enabled: z.boolean().default(true),
    fields: z.array(z.string()).default(['password', 'token', 'secret', 'key', 'authorization']),
    replacement: z.string().default('[REDACTED]'),
  }),
  filters: z.object({
    exclude: z.object({
      actions: z.array(auditEventActionSchema).optional(),
      resources: z.array(auditResourceSchema).optional(),
      actors: z.array(z.string()).optional(),
    }).optional(),
    include: z.object({
      actions: z.array(auditEventActionSchema).optional(),
      resources: z.array(auditResourceSchema).optional(),
      actors: z.array(z.string()).optional(),
    }).optional(),
  }).default({}),
  metadata: auditMetadataSchema.default({}),
}).strict();

export const adapterConfigSchema = z.object({
  connectionString: z.string().optional(),
  tableName: z.string().default('audit_logs'),
  collectionName: z.string().default('audit_logs'),
  filePath: z.string().optional(),
  options: z.record(z.any()).default({}),
}).strict();
