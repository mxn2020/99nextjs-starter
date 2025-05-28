export type AuditEventAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'account_locked'
  | 'account_unlocked'
  | 'permission_granted'
  | 'permission_denied'
  | 'access_granted'
  | 'access_denied'
  | 'session_start'
  | 'session_end'
  | 'data_export'
  | 'data_import'
  | 'backup_created'
  | 'backup_restored'
  | 'system_start'
  | 'system_stop'
  | 'config_change'
  | 'custom'
  | 'register'
  | 'email_verify'
  | 'role_change'
  | 'permission_grant'
  | 'permission_revoke'
  | 'api_call'
  | 'file_upload'
  | 'file_download'
  | 'export'
  | 'import'
  | 'backup'
  | 'restore'
  | 'maintenance'
  | 'other';

export type AuditLevel = 'low' | 'medium' | 'high' | 'critical' | 'debug' | 'info' | 'warn' | 'error';

export type AuditResource = 'user' | 'role' | 'permission' | 'system' | 'data' | 'session' | 'api' | 'file' | 'custom' 
  | 'post' | 'comment' | 'setting' | 'other';

// Type aliases for UI components
export type AuditAction = AuditEventAction;
export type ActorType = 'user' | 'system' | 'service' | 'admin' | 'anonymous' | 'api';
export type ResourceType = AuditResource;

export interface AuditContext {
  requestId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  deviceId?: string;
  browserInfo?: string;
  referrer?: string;
  correlation?: {
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
  };
  custom?: Record<string, any>;
}

export interface AuditMetadata {
  version?: string;
  schema?: string;
  tags?: string[];
  category?: string;
  environment?: 'development' | 'staging' | 'production';
  service?: string;
  component?: string;
  batch?: {
    id: string;
    size: number;
    index: number;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  action: AuditEventAction;
  resource: AuditResource;
  resourceId?: string;
  level: AuditLevel;
  actorId?: string;
  actorType?: ActorType;
  targetId?: string;
  targetType?: string;
  description: string;
  success: boolean;
  context?: AuditContext;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  error?: {
    code?: string;
    message?: string;
    stack?: string;
  };
  metadata?: AuditMetadata;
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  actions?: AuditEventAction[];
  resources?: AuditResource[];
  levels?: AuditLevel[];
  actorIds?: string[];
  success?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: keyof AuditEvent;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AuditEventFilter extends AuditFilter {
  actorId?: string;
  resourceId?: string;
  targetId?: string;
  actorType?: ActorType;
  targetType?: string;
  resourceType?: ResourceType;
  hasError?: boolean;
  // Single-value filters for convenience
  action?: AuditAction;
  level?: AuditLevel;
  correlationId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

export interface AuditStats {
  totalEvents: number;
  eventsByAction: Record<AuditEventAction, number>;
  eventsByResource: Record<AuditResource, number>;
  eventsByLevel: Record<AuditLevel, number>;
  successRate: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface AuditAdapter {
  log(event: AuditEvent): Promise<void>;
  logBatch(events: AuditEvent[]): Promise<void>;
  query(filter: AuditEventFilter): Promise<PaginatedResult<AuditEvent>>;
  count(filter: Omit<AuditEventFilter, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>): Promise<number>;
  getStats(filter?: Pick<AuditEventFilter, 'startDate' | 'endDate'>): Promise<AuditStats>;
  purge(olderThan: Date): Promise<number>;
  healthCheck(): Promise<boolean>;
  close(): Promise<void>;
}

export interface AuditLoggerConfig {
  level: AuditLevel;
  enabled: boolean;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;
  sanitize: {
    enabled: boolean;
    fields: string[];
    replacement: string;
  };
  filters: {
    exclude?: {
      actions?: AuditEventAction[];
      resources?: AuditResource[];
      actors?: string[];
    };
    include?: {
      actions?: AuditEventAction[];
      resources?: AuditResource[];
      actors?: string[];
    };
  };
  metadata: AuditMetadata;
}

export interface AdapterConfig {
  connectionString?: string;
  tableName?: string;
  collectionName?: string;
  filePath?: string;
  options?: Record<string, any>;
}
