# API Reference

Complete API reference for `@99packages/audit-log` with TypeScript types, examples, and best practices.

## 📋 Table of Contents

- [Core Classes](#core-classes)
- [Configuration](#configuration)
- [Methods](#methods)
- [Types & Interfaces](#types--interfaces)
- [React Components](#react-components)
- [React Hooks](#react-hooks)
- [Middleware](#middleware)
- [Database Adapters](#database-adapters)
- [Utilities](#utilities)

## Core Classes

### AuditLogger

The main class for audit logging operations.

```typescript
import { AuditLogger } from '@99packages/audit-log';

const auditLogger = new AuditLogger(config: AuditLoggerConfig);
```

#### Constructor

```typescript
constructor(config: AuditLoggerConfig)
```

**Parameters:**
- `config` - Configuration object for the audit logger

**Example:**
```typescript
const auditLogger = new AuditLogger({
  adapter: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'audit_db',
    username: 'audit_user',
    password: 'secure_password'
  },
  performance: {
    batchSize: 100,
    flushInterval: 5000
  }
});
```

### AuditQuery

Query builder for searching audit logs.

```typescript
import { AuditQuery } from '@99packages/audit-log';

const query = new AuditQuery(auditLogger);
```

## Configuration

### AuditLoggerConfig

Main configuration interface for the audit logger.

```typescript
interface AuditLoggerConfig {
  adapter: AdapterType;
  connection: ConnectionConfig;
  performance?: PerformanceConfig;
  security?: SecurityConfig;
  compliance?: ComplianceConfig;
  defaults?: DefaultValues;
  sanitization?: SanitizationConfig;
  retention?: RetentionConfig;
}
```

#### AdapterType

```typescript
type AdapterType = 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'file';
```

#### ConnectionConfig

Configuration varies by adapter:

**PostgreSQL / Supabase:**
```typescript
interface PostgreSQLConfig {
  // Direct connection
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean | SSLConfig;
  
  // OR Supabase client
  client?: SupabaseClient;
  
  // Table configuration
  table?: string;
  schema?: string;
}
```

**MongoDB:**
```typescript
interface MongoDBConfig {
  url: string;
  database?: string;
  collection?: string;
  options?: MongoClientOptions;
}
```

**File-based:**
```typescript
interface FileConfig {
  directory: string;
  filename?: string;
  maxFileSize?: string;
  rotateFiles?: boolean;
  compression?: boolean;
}
```

#### PerformanceConfig

```typescript
interface PerformanceConfig {
  batchSize?: number;           // Default: 50
  flushInterval?: number;       // Default: 5000ms
  maxBatchWait?: number;        // Default: 10000ms
  enableCompression?: boolean;  // Default: false
  compressionLevel?: number;    // Default: 6
  maxRetries?: number;          // Default: 3
  retryDelay?: number;          // Default: 1000ms
  backoffMultiplier?: number;   // Default: 2
  enableHealthCheck?: boolean;  // Default: true
  healthCheckInterval?: number; // Default: 30000ms
}
```

#### SecurityConfig

```typescript
interface SecurityConfig {
  encryption?: {
    enabled: boolean;
    algorithm?: string;         // Default: 'aes-256-gcm'
    keyRotation?: {
      enabled: boolean;
      intervalDays: number;
    };
  };
  accessControl?: {
    roles: Record<string, string[]>;
    defaultRole?: string;
  };
}
```

#### ComplianceConfig

```typescript
interface ComplianceConfig {
  gdpr?: {
    enabled: boolean;
    dataSubjectDeletion?: (subjectId: string) => Promise<void>;
    dataExport?: (subjectId: string) => Promise<any[]>;
  };
  sox?: {
    enabled: boolean;
    immutable?: boolean;
    digitalSignatures?: {
      enabled: boolean;
      algorithm?: string;
      keyRotationDays?: number;
    };
    minimumRetentionYears?: number;
  };
  hipaa?: {
    enabled: boolean;
    encryptPHI?: boolean;
    auditAccess?: boolean;
  };
}
```

#### SanitizationConfig

```typescript
interface SanitizationConfig {
  sensitiveFields?: string[];
  hashFields?: string[];
  customSanitizer?: (data: any) => any;
  preserveStructure?: boolean;
}
```

#### RetentionConfig

```typescript
interface RetentionConfig {
  defaultRetentionDays?: number;
  retentionPolicies?: Record<string, number>;
  autoArchive?: boolean;
  archiveLocation?: string;
}
```

## Methods

### log()

Log a single audit event.

```typescript
async log(event: AuditEvent): Promise<AuditLogEntry>
```

**Parameters:**
- `event` - The audit event to log

**Returns:**
- Promise resolving to the created audit log entry

**Example:**
```typescript
const entry = await auditLogger.log({
  action: 'user.login',
  actorId: 'user123',
  actorType: 'user',
  resource: 'authentication',
  metadata: {
    loginMethod: 'email',
    userAgent: request.headers['user-agent']
  },
  context: {
    ipAddress: '192.168.1.1',
    sessionId: 'sess_abc123'
  }
});
```

### logBatch()

Log multiple audit events in a single operation.

```typescript
async logBatch(events: AuditEvent[]): Promise<AuditLogEntry[]>
```

**Parameters:**
- `events` - Array of audit events to log

**Returns:**
- Promise resolving to array of created audit log entries

**Example:**
```typescript
const entries = await auditLogger.logBatch([
  {
    action: 'user.create',
    actorId: 'admin123',
    resource: 'user',
    resourceId: 'user456'
  },
  {
    action: 'user.role.assign',
    actorId: 'admin123',
    resource: 'user',
    resourceId: 'user456',
    metadata: { role: 'editor' }
  }
]);
```

### query()

Search and retrieve audit logs.

```typescript
async query(options: QueryOptions): Promise<AuditLogEntry[]>
```

**Parameters:**
- `options` - Query configuration

**Returns:**
- Promise resolving to matching audit log entries

**Example:**
```typescript
const logs = await auditLogger.query({
  filters: {
    actorId: 'user123',
    action: { startsWith: 'user.' },
    timestamp: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-01-31')
    }
  },
  orderBy: 'timestamp',
  orderDirection: 'desc',
  limit: 100,
  offset: 0
});
```

### count()

Count audit logs matching criteria.

```typescript
async count(options: CountOptions): Promise<number>
```

**Parameters:**
- `options` - Count query configuration

**Returns:**
- Promise resolving to count of matching entries

**Example:**
```typescript
const totalLogins = await auditLogger.count({
  filters: {
    action: 'user.login',
    status: 'success'
  }
});
```

### export()

Export audit logs in various formats.

```typescript
async export(options: ExportOptions): Promise<string | Buffer>
```

**Parameters:**
- `options` - Export configuration

**Returns:**
- Promise resolving to exported data

**Example:**
```typescript
const csvData = await auditLogger.export({
  format: 'csv',
  filters: {
    timestamp: {
      gte: new Date('2024-01-01')
    }
  },
  fields: ['timestamp', 'action', 'actorId', 'resource']
});
```

### anonymize()

Anonymize audit logs for GDPR compliance.

```typescript
async anonymize(options: AnonymizeOptions): Promise<number>
```

**Parameters:**
- `options` - Anonymization configuration

**Returns:**
- Promise resolving to number of affected records

**Example:**
```typescript
const anonymizedCount = await auditLogger.anonymize({
  actorId: 'user123',
  replacements: {
    actorId: '[DELETED_USER]',
    'metadata.email': '[REDACTED]'
  }
});
```

### health()

Check the health status of the audit logger.

```typescript
async health(): Promise<HealthStatus>
```

**Returns:**
- Promise resolving to health status

**Example:**
```typescript
const status = await auditLogger.health();
console.log('Health:', status.status); // 'healthy' | 'degraded' | 'unhealthy'
console.log('Latency:', status.latency);
console.log('Queue size:', status.queueSize);
```

### flush()

Force flush any pending audit logs.

```typescript
async flush(): Promise<void>
```

**Example:**
```typescript
await auditLogger.flush();
```

### close()

Close the audit logger and clean up resources.

```typescript
async close(): Promise<void>
```

**Example:**
```typescript
await auditLogger.close();
```

## Types & Interfaces

### AuditEvent

The event data structure for logging.

```typescript
interface AuditEvent {
  action: string;
  actorId?: string;
  actorType?: string;
  actorMetadata?: Record<string, any>;
  resource: string;
  resourceId?: string;
  organizationId?: string;
  severity?: 'low' | 'info' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'failure' | 'pending';
  metadata?: Record<string, any>;
  context?: Record<string, any>;
  timestamp?: Date;
  source?: string;
  version?: string;
  environment?: string;
  retentionUntil?: Date;
}
```

### AuditLogEntry

The stored audit log entry structure.

```typescript
interface AuditLogEntry extends AuditEvent {
  id: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### QueryOptions

Configuration for querying audit logs.

```typescript
interface QueryOptions {
  filters?: QueryFilters;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  include?: string[];
}
```

### QueryFilters

Filter criteria for queries.

```typescript
interface QueryFilters {
  [key: string]: any | {
    eq?: any;           // Equal
    ne?: any;           // Not equal
    gt?: any;           // Greater than
    gte?: any;          // Greater than or equal
    lt?: any;           // Less than
    lte?: any;          // Less than or equal
    in?: any[];         // In array
    notIn?: any[];      // Not in array
    contains?: string;  // Contains string
    startsWith?: string;// Starts with string
    endsWith?: string;  // Ends with string
    isNull?: boolean;   // Is null
    isNotNull?: boolean;// Is not null
  };
}
```

### HealthStatus

Health check result structure.

```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  latency: number;
  queueSize: number;
  errors: string[];
  metrics: {
    totalEvents: number;
    eventsPerSecond: number;
    errorRate: number;
  };
}
```

## React Components

### AuditTable

Display audit logs in a table format.

```typescript
interface AuditTableProps {
  auditLogger: AuditLogger;
  filters?: QueryFilters;
  columns?: string[];
  pageSize?: number;
  className?: string;
  onRowClick?: (entry: AuditLogEntry) => void;
}

function AuditTable(props: AuditTableProps): JSX.Element
```

**Example:**
```typescript
<AuditTable
  auditLogger={auditLogger}
  filters={{ actorId: 'user123' }}
  columns={['timestamp', 'action', 'resource', 'status']}
  pageSize={25}
  onRowClick={(entry) => showDetails(entry)}
/>
```

### AuditDashboard

Comprehensive dashboard for audit logs.

```typescript
interface AuditDashboardProps {
  auditLogger: AuditLogger;
  organizationId?: string;
  showFilters?: boolean;
  showStats?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

function AuditDashboard(props: AuditDashboardProps): JSX.Element
```

**Example:**
```typescript
<AuditDashboard
  auditLogger={auditLogger}
  organizationId={org.id}
  showFilters={true}
  showStats={true}
  autoRefresh={true}
  refreshInterval={30000}
/>
```

### AuditFilters

Filter component for audit logs.

```typescript
interface AuditFiltersProps {
  onFiltersChange: (filters: QueryFilters) => void;
  initialFilters?: QueryFilters;
  availableActions?: string[];
  availableActors?: string[];
  className?: string;
}

function AuditFilters(props: AuditFiltersProps): JSX.Element
```

**Example:**
```typescript
<AuditFilters
  onFiltersChange={setFilters}
  initialFilters={{ severity: 'high' }}
  availableActions={['user.login', 'user.logout', 'user.update']}
/>
```

### AuditEventDetails

Show detailed view of a single audit event.

```typescript
interface AuditEventDetailsProps {
  entry: AuditLogEntry;
  showMetadata?: boolean;
  showContext?: boolean;
  className?: string;
}

function AuditEventDetails(props: AuditEventDetailsProps): JSX.Element
```

**Example:**
```typescript
<AuditEventDetails
  entry={selectedEntry}
  showMetadata={true}
  showContext={true}
/>
```

## React Hooks

### useAuditEvents

Hook for querying and managing audit events.

```typescript
interface UseAuditEventsOptions {
  auditLogger: AuditLogger;
  filters?: QueryFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
  pageSize?: number;
}

interface UseAuditEventsResult {
  events: AuditLogEntry[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  refresh: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  setFilters: (filters: QueryFilters) => void;
}

function useAuditEvents(options: UseAuditEventsOptions): UseAuditEventsResult
```

**Example:**
```typescript
const {
  events,
  loading,
  error,
  totalCount,
  refresh,
  setFilters
} = useAuditEvents({
  auditLogger,
  filters: { actorId: user.id },
  autoRefresh: true,
  refreshInterval: 30000
});
```

### useAuditStats

Hook for audit statistics and metrics.

```typescript
interface UseAuditStatsOptions {
  auditLogger: AuditLogger;
  timeRange?: {
    start: Date;
    end: Date;
  };
  organizationId?: string;
  autoRefresh?: boolean;
}

interface UseAuditStatsResult {
  stats: AuditStats | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

function useAuditStats(options: UseAuditStatsOptions): UseAuditStatsResult
```

**Example:**
```typescript
const { stats, loading, error } = useAuditStats({
  auditLogger,
  timeRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  autoRefresh: true
});
```

### useAuditLogger

Hook for creating and managing an audit logger instance.

```typescript
interface UseAuditLoggerOptions {
  config: AuditLoggerConfig;
  autoFlush?: boolean;
}

interface UseAuditLoggerResult {
  auditLogger: AuditLogger;
  log: (event: AuditEvent) => Promise<void>;
  health: HealthStatus | null;
  error: Error | null;
}

function useAuditLogger(options: UseAuditLoggerOptions): UseAuditLoggerResult
```

**Example:**
```typescript
const { auditLogger, log, health } = useAuditLogger({
  config: {
    adapter: 'postgresql',
    connection: { client: supabase }
  },
  autoFlush: true
});

// Log an event
await log({
  action: 'user.profile.update',
  actorId: user.id,
  resource: 'user',
  resourceId: user.id
});
```

### useRealtimeAuditEvents

Hook for real-time audit event subscriptions.

```typescript
interface UseRealtimeAuditEventsOptions {
  auditLogger: AuditLogger;
  filters?: QueryFilters;
  onEvent?: (event: AuditLogEntry) => void;
  maxEvents?: number;
}

interface UseRealtimeAuditEventsResult {
  recentEvents: AuditLogEntry[];
  isConnected: boolean;
  error: Error | null;
  clearEvents: () => void;
}

function useRealtimeAuditEvents(options: UseRealtimeAuditEventsOptions): UseRealtimeAuditEventsResult
```

**Example:**
```typescript
const { recentEvents, isConnected } = useRealtimeAuditEvents({
  auditLogger,
  filters: { severity: 'critical' },
  onEvent: (event) => {
    if (event.severity === 'critical') {
      showAlert(event);
    }
  },
  maxEvents: 50
});
```

## Middleware

### auditMiddleware

Next.js middleware for automatic audit logging.

```typescript
interface AuditMiddlewareOptions {
  auditLogger: AuditLogger;
  includeRequest?: boolean;
  includeResponse?: boolean;
  excludePaths?: string[];
  extractActor?: (request: NextRequest) => Promise<Actor>;
  customEventMapper?: (request: NextRequest, response: NextResponse) => AuditEvent;
}

function auditMiddleware(options: AuditMiddlewareOptions): NextMiddleware
```

**Example:**
```typescript
// middleware.ts
import { auditMiddleware } from '@99packages/audit-log';
import { auditLogger } from '@/lib/audit';

export default auditMiddleware({
  auditLogger,
  includeRequest: true,
  includeResponse: false,
  excludePaths: ['/api/health', '/api/metrics'],
  extractActor: async (request) => {
    const token = request.headers.get('authorization');
    const user = await validateToken(token);
    return {
      id: user.id,
      type: 'user',
      metadata: { role: user.role }
    };
  }
});
```

### withAudit

HOC for wrapping API routes with audit logging.

```typescript
interface WithAuditOptions {
  action?: string;
  resource?: string;
  extractResourceId?: (request: NextRequest, response: NextResponse) => string;
  onSuccess?: (event: AuditEvent) => void;
  onError?: (error: Error, event: AuditEvent) => void;
}

function withAudit(handler: NextApiHandler, options: WithAuditOptions): NextApiHandler
```

**Example:**
```typescript
// app/api/users/route.ts
import { withAudit } from '@99packages/audit-log';

const handler = async (request: NextRequest) => {
  const userData = await request.json();
  const user = await createUser(userData);
  return NextResponse.json(user);
};

export const POST = withAudit(handler, {
  action: 'user.create',
  resource: 'user',
  extractResourceId: (req, res) => res.json().id
});
```

## Database Adapters

### PostgreSQLAdapter

```typescript
class PostgreSQLAdapter implements AuditAdapter {
  constructor(config: PostgreSQLConfig);
  
  async connect(): Promise<void>;
  async disconnect(): Promise<void>;
  async log(event: AuditEvent): Promise<AuditLogEntry>;
  async logBatch(events: AuditEvent[]): Promise<AuditLogEntry[]>;
  async query(options: QueryOptions): Promise<AuditLogEntry[]>;
  async count(options: CountOptions): Promise<number>;
  async health(): Promise<HealthStatus>;
}
```

### MongoDBAdapter

```typescript
class MongoDBAdapter implements AuditAdapter {
  constructor(config: MongoDBConfig);
  
  async connect(): Promise<void>;
  async disconnect(): Promise<void>;
  async log(event: AuditEvent): Promise<AuditLogEntry>;
  async logBatch(events: AuditEvent[]): Promise<AuditLogEntry[]>;
  async query(options: QueryOptions): Promise<AuditLogEntry[]>;
  async count(options: CountOptions): Promise<number>;
  async health(): Promise<HealthStatus>;
}
```

### FileAdapter

```typescript
class FileAdapter implements AuditAdapter {
  constructor(config: FileConfig);
  
  async connect(): Promise<void>;
  async disconnect(): Promise<void>;
  async log(event: AuditEvent): Promise<AuditLogEntry>;
  async logBatch(events: AuditEvent[]): Promise<AuditLogEntry[]>;
  async query(options: QueryOptions): Promise<AuditLogEntry[]>;
  async count(options: CountOptions): Promise<number>;
  async health(): Promise<HealthStatus>;
}
```

## Utilities

### sanitizeData()

Sanitize sensitive data from audit events.

```typescript
function sanitizeData(
  data: any,
  options: SanitizationOptions
): any
```

**Example:**
```typescript
const sanitized = sanitizeData(userData, {
  sensitiveFields: ['password', 'ssn'],
  hashFields: ['email'],
  preserveStructure: true
});
```

### validateEvent()

Validate audit event structure.

```typescript
function validateEvent(event: AuditEvent): ValidationResult
```

**Example:**
```typescript
const validation = validateEvent({
  action: 'user.login',
  actorId: 'user123',
  resource: 'authentication'
});

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### formatAuditEvent()

Format audit events for display.

```typescript
function formatAuditEvent(
  event: AuditLogEntry,
  options?: FormatOptions
): FormattedEvent
```

**Example:**
```typescript
const formatted = formatAuditEvent(event, {
  includeMetadata: true,
  dateFormat: 'relative',
  highlightSeverity: true
});
```

### exportToCSV()

Export audit logs to CSV format.

```typescript
function exportToCSV(
  events: AuditLogEntry[],
  columns?: string[]
): string
```

**Example:**
```typescript
const csvData = exportToCSV(events, [
  'timestamp',
  'action',
  'actorId',
  'resource',
  'status'
]);
```

### createAuditReport()

Generate audit reports.

```typescript
function createAuditReport(
  events: AuditLogEntry[],
  options: ReportOptions
): AuditReport
```

**Example:**
```typescript
const report = createAuditReport(events, {
  groupBy: 'action',
  includeCharts: true,
  timeRange: 'last_30_days',
  format: 'pdf'
});
```

---

## Error Handling

All methods can throw the following error types:

### AuditLoggerError

Base error class for audit logger errors.

```typescript
class AuditLoggerError extends Error {
  code: string;
  context?: any;
}
```

### ConnectionError

Database connection errors.

```typescript
class ConnectionError extends AuditLoggerError {
  code: 'CONNECTION_FAILED' | 'CONNECTION_TIMEOUT' | 'CONNECTION_LOST';
}
```

### ValidationError

Data validation errors.

```typescript
class ValidationError extends AuditLoggerError {
  code: 'INVALID_EVENT' | 'MISSING_REQUIRED_FIELD' | 'INVALID_FORMAT';
  field?: string;
}
```

### PermissionError

Access control errors.

```typescript
class PermissionError extends AuditLoggerError {
  code: 'ACCESS_DENIED' | 'INSUFFICIENT_PERMISSIONS' | 'UNAUTHORIZED';
  requiredPermission?: string;
}
```

**Example Error Handling:**
```typescript
try {
  await auditLogger.log(event);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid event:', error.field, error.message);
  } else if (error instanceof ConnectionError) {
    console.error('Database connection failed:', error.message);
    // Maybe retry or use fallback
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## Migration from v1.x

For users upgrading from v1.x, see the [Migration Guide](./MIGRATION.md) for detailed instructions.

## Contributing

See our [Contributing Guide](https://github.com/99packages/audit-log/blob/main/CONTRIBUTING.md) for information on how to contribute to this project.

## Support

- **Documentation**: [https://docs.99packages.com](https://docs.99packages.com)
- **Discord**: [https://discord.gg/99packages](https://discord.gg/99packages)
- **GitHub Issues**: [https://github.com/99packages/audit-log/issues](https://github.com/99packages/audit-log/issues)
