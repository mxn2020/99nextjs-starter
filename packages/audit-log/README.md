# @99packages/audit-log

A comprehensive audit logging package for Next.js applications with first-class **Supabase** support. Built with TypeScript for enterprise-grade audit logging, security compliance, and real-time monitoring.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
  - [Supabase Setup](#supabase-setup)
  - [Basic Usage](#basic-usage)
- [Supabase Integration](#-supabase-integration)
- [Database Adapters](#-database-adapters)
- [React Components](#-react-components)
- [Next.js Middleware](#-nextjs-middleware)
- [React Hooks](#-react-hooks)
- [Configuration](#-configuration)
- [Security & Compliance](#-security--compliance)
- [Performance](#-performance)
- [Examples](#-examples)
- [Documentation](#-documentation)
- [Migration Guide](#-migration-guide)
- [API Reference](#-api-reference)

## 🚀 Features

### Core Features
- 🗄️ **Multiple Database Adapters**: PostgreSQL (Supabase), MySQL, MongoDB, SQLite, File-based
- ⚡ **High Performance**: Batching, queuing, async operations with retry logic
- 🔒 **Security First**: Data sanitization, PII protection, configurable audit levels
- 🎨 **React UI Components**: Pre-built components for viewing and filtering audit logs
- 🔗 **Next.js Integration**: Middleware for automatic audit logging
- 🪝 **React Hooks**: Easy integration with React applications
- 📊 **Analytics**: Built-in statistics and health monitoring
- 🛡️ **Type Safe**: Full TypeScript support with Zod validation
- 🔄 **Real-time**: Live updates and monitoring capabilities

### Supabase-Specific Features
- 🎯 **Native Supabase Integration**: Optimized PostgreSQL adapter for Supabase
- 🔐 **Row Level Security (RLS)**: Built-in support for Supabase RLS policies
- 📡 **Real-time Subscriptions**: Live audit log updates using Supabase Realtime
- 🔑 **Auth Integration**: Seamless integration with Supabase Auth
- 🏢 **Multi-tenant Support**: Organization-level audit log isolation
- 📈 **Edge Functions**: Compatible with Supabase Edge Functions
- 🔄 **Auto-migrations**: Automatic database schema setup and updates

## 📦 Installation

```bash
# Install the audit log package
npm install @99packages/audit-log

# For Supabase integration
npm install @supabase/supabase-js @supabase/ssr

# For other databases (optional)
npm install pg @types/pg              # PostgreSQL
npm install mysql2                    # MySQL  
npm install mongodb                   # MongoDB
npm install better-sqlite3 @types/better-sqlite3  # SQLite
```

## 🚀 Quick Start

### Supabase Setup

1. **Create the audit logs table in your Supabase project:**

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  actor_id UUID,
  actor_type VARCHAR(50),
  target_id VARCHAR(255),
  target_type VARCHAR(255),
  description TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  context JSONB,
  old_values JSONB,
  new_values JSONB,
  error JSONB,
  metadata JSONB,
  organization_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_timestamp ON audit_logs(organization_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_timestamp ON audit_logs(actor_id, timestamp);
```

2. **Set up Row Level Security (RLS) policies:**

```sql
-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see audit logs for their organization
CREATE POLICY "Users can view audit logs for their organization" ON audit_logs
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy: Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Policy: Admins can view all audit logs in their organization
CREATE POLICY "Admins can view all organization audit logs" ON audit_logs
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    ) AND (
      SELECT role FROM profiles 
      WHERE id = auth.uid()
    ) = 'admin'
  );
```

### Basic Usage

```typescript
import { createSupabaseAuditLogger } from '@99packages/audit-log/adapters/postgresql';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for audit logging
);

// Create audit logger
const auditLogger = createSupabaseAuditLogger({
  supabaseClient: supabase,
  tableName: 'audit_logs',
  organizationId: 'org_123', // Optional: for multi-tenant setups
});

// Log an audit event
await auditLogger.log({
  action: 'user.login',
  resource: 'authentication',
  level: 'info',
  actorId: 'user_123',
  actorType: 'user',
  description: 'User successfully logged in',
  success: true,
  context: {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    sessionId: 'session_456'
  },
  metadata: {
    loginMethod: 'email',
    environment: 'production'
  }
});
```

## 🎯 Supabase Integration

### Environment Variables

```env
# Required for Supabase integration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: For organization-level isolation
AUDIT_ORGANIZATION_ID=your_org_id
AUDIT_TABLE_NAME=audit_logs
AUDIT_ENABLE_RLS=true
```

### Advanced Supabase Configuration

```typescript
import { createSupabaseAuditLogger } from '@99packages/audit-log/adapters/postgresql';
import { createClient } from '@supabase/supabase-js';

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  options: {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-application-name': 'audit-logger'
      }
    }
  }
};

const auditLogger = createSupabaseAuditLogger({
  ...supabaseConfig,
  tableName: 'audit_logs',
  
  // Multi-tenant configuration
  organizationId: 'org_123',
  enableRLS: true,
  
  // Performance optimization
  batchSize: 100,
  flushInterval: 5000,
  maxRetries: 3,
  
  // Security settings
  sanitize: {
    enabled: true,
    fields: ['password', 'token', 'secret', 'key'],
    replacement: '[REDACTED]'
  },
  
  // Real-time configuration
  realtime: {
    enabled: true,
    channel: 'audit-logs',
    events: ['INSERT']
  }
});
```

### Real-time Audit Log Monitoring

```typescript
import { useSupabaseAuditLogs } from '@99packages/audit-log/hooks';

function AuditLogMonitor() {
  const { 
    logs, 
    loading, 
    error, 
    stats,
    subscribe,
    unsubscribe 
  } = useSupabaseAuditLogs({
    organizationId: 'org_123',
    realtime: true,
    filters: {
      level: 'error',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    }
  });

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading audit logs...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Real-time Audit Logs ({stats.totalEvents})</h2>
      {logs.map(log => (
        <div key={log.id}>
          <strong>{log.action}</strong> - {log.description}
          <small>{log.timestamp.toISOString()}</small>
        </div>
      ))}
    </div>
  );
}
```

## 🗄️ Database Adapters

### Supabase Adapter (Recommended)

Optimized for Supabase with built-in support for RLS, real-time subscriptions, and Edge Functions.

```typescript
import { createSupabaseAuditLogger } from '@99packages/audit-log/adapters/postgresql';

const logger = createSupabaseAuditLogger({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  tableName: 'audit_logs',
  
  // Organization isolation
  organizationId: 'org_123',
  enableRLS: true,
  
  // Real-time features
  realtime: {
    enabled: true,
    channel: 'audit-logs'
  },
  
  // Performance settings
  batchSize: 50,
  autoFlush: true,
  flushInterval: 3000,
  
  // Edge Functions compatibility
  edgeRuntime: true
});

// Query with organization filtering
const events = await logger.query({
  organizationId: 'org_123',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  actions: ['user.login', 'user.logout'],
  limit: 100
});

// Real-time statistics
const stats = await logger.getStats({
  organizationId: 'org_123',
  period: 'last_30_days',
  groupBy: ['action', 'level']
});
```

### PostgreSQL Adapter

For standard PostgreSQL databases with full feature support.

```typescript
import { createPostgreSQLAuditLogger } from '@99packages/audit-log/adapters/postgresql';

const logger = createPostgreSQLAuditLogger({
  connectionString: 'postgresql://localhost:5432/mydb',
  pool: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },
  autoMigrate: true,
  tablePrefix: 'audit_',
});

// Advanced querying with full-text search
const events = await logger.query({
  actions: ['user.login', 'user.logout'],
  actorIds: ['user123'],
  search: 'failed login attempt',
  dateRange: {
    from: new Date('2024-01-01'),
    to: new Date('2024-12-31')
  },
  limit: 100,
  offset: 0
});
```

### MySQL Adapter

Optimized for MySQL/MariaDB with full-text search and JSON support.

```typescript
import { createMySQLAuditLogger } from '@99packages/audit-log/adapters/mysql';

const logger = createMySQLAuditLogger({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'myapp',
  pool: {
    connectionLimit: 20,
    acquireTimeout: 60000,
    timeout: 60000,
  }
});

// Full-text search capabilities
const events = await logger.query({
  search: 'user login failed',
  searchMode: 'fulltext',
  limit: 50
});
```

### MongoDB Adapter

Perfect for document-based storage with flexible schemas and aggregation.

```typescript
import { createMongoAuditLogger } from '@99packages/audit-log/adapters/mongodb';

const logger = createMongoAuditLogger({
  connectionString: 'mongodb://localhost:27017',
  databaseName: 'myapp',
  collectionName: 'audit_logs',
  options: {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5000,
  }
});

// Complex aggregation queries
const trends = await logger.aggregate([
  { $match: { 'actor.type': 'user' } },
  { $group: { _id: '$action', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

### SQLite Adapter

Ideal for development, testing, or lightweight production environments.

```typescript
import { createSQLiteAuditLogger } from '@99packages/audit-log/adapters/sqlite';

const logger = createSQLiteAuditLogger({
  database: './data/audit.db',
  options: {
    verbose: console.log // Enable SQL logging in development
  },
  // Enable WAL mode for better concurrency
  pragmas: {
    journal_mode: 'WAL',
    synchronous: 'NORMAL',
    cache_size: -64000, // 64MB cache
  }
});

// Full-text search using FTS5
const events = await logger.query({
  search: 'user login failed',
  searchFields: ['action', 'description', 'context']
});
```

## 🎨 React Components

### AuditTable Component

Pre-built table component for displaying audit logs with sorting, filtering, and pagination.

```typescript
import { AuditTable } from '@99packages/audit-log/ui';

function AuditLogPage() {
  return (
    <AuditTable
      // Data source configuration
      adapter={auditLogger}
      organizationId="org_123"
      
      // UI configuration
      pageSize={50}
      sortable={true}
      filterable={true}
      searchable={true}
      
      // Column configuration
      columns={[
        'timestamp',
        'action',
        'actor',
        'resource',
        'level',
        'success',
        'description'
      ]}
      
      // Real-time updates
      realtime={true}
      
      // Custom renderers
      renderAction={(action) => (
        <span className={`action-${action.split('.')[0]}`}>
          {action}
        </span>
      )}
      
      renderLevel={(level) => (
        <span className={`level-${level}`}>
          {level.toUpperCase()}
        </span>
      )}
      
      // Event handlers
      onRowClick={(event) => console.log('Selected:', event)}
      onFilterChange={(filters) => console.log('Filters:', filters)}
    />
  );
}
```

### AuditDashboard Component

Comprehensive dashboard with statistics, charts, and recent activity.

```typescript
import { AuditDashboard } from '@99packages/audit-log/ui';

function AuditDashboardPage() {
  return (
    <AuditDashboard
      adapter={auditLogger}
      organizationId="org_123"
      
      // Time range
      timeRange="last_30_days"
      
      // Dashboard sections
      sections={[
        'overview',
        'activity-chart',
        'top-actions',
        'recent-errors',
        'user-activity'
      ]}
      
      // Real-time updates
      refreshInterval={30000} // 30 seconds
      
      // Styling
      theme="light"
      className="audit-dashboard"
    />
  );
}
```

### AuditFilters Component

Advanced filtering component with date pickers, multi-select, and search.

```typescript
import { AuditFilters } from '@99packages/audit-log/ui';

function AuditFiltersExample() {
  const [filters, setFilters] = useState({});

  return (
    <AuditFilters
      // Available filter options
      options={{
        actions: ['user.login', 'user.logout', 'user.update'],
        resources: ['user', 'document', 'settings'],
        levels: ['debug', 'info', 'warn', 'error'],
        actors: [], // Auto-populated from database
      }}
      
      // Current filter state
      value={filters}
      onChange={setFilters}
      
      // UI configuration
      showDateRange={true}
      showSearch={true}
      showAdvanced={true}
      
      // Layout
      layout="horizontal" // or "vertical"
      
      // Custom components
      renderDatePicker={(props) => <CustomDatePicker {...props} />}
      renderSelect={(props) => <CustomSelect {...props} />}
    />
  );
}
```

## 🔗 Next.js Middleware

Automatic audit logging for API routes and page requests.

### Basic Middleware Setup

```typescript
// middleware.ts
import { createAuditMiddleware } from '@99packages/audit-log/middleware';
import { createSupabaseAuditLogger } from '@99packages/audit-log/adapters/postgresql';

const auditLogger = createSupabaseAuditLogger({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
});

export const middleware = createAuditMiddleware({
  adapter: auditLogger,
  
  // Configure what to audit
  audit: {
    // API routes
    api: {
      enabled: true,
      includeBody: false, // For security
      includeHeaders: ['user-agent', 'x-forwarded-for'],
      excludePaths: ['/api/health', '/api/metrics']
    },
    
    // Page requests
    pages: {
      enabled: true,
      trackViews: true,
      excludePaths: ['/favicon.ico', '/_next/*']
    },
    
    // Authentication events
    auth: {
      enabled: true,
      trackLogins: true,
      trackLogouts: true,
      trackRegistrations: true
    }
  },
  
  // Organization context
  getOrganizationId: async (request) => {
    // Extract organization from JWT, headers, etc.
    return 'org_123';
  },
  
  // User context
  getUserContext: async (request) => {
    // Extract user info from session, JWT, etc.
    return {
      id: 'user_123',
      type: 'user',
      email: 'user@example.com'
    };
  }
});

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
```

### Advanced Middleware Configuration

```typescript
import { createAuditMiddleware } from '@99packages/audit-log/middleware';

export const middleware = createAuditMiddleware({
  adapter: auditLogger,
  
  // Custom event generation
  generateEvent: async (request, response, context) => {
    const isAPIRoute = request.nextUrl.pathname.startsWith('/api');
    
    if (isAPIRoute) {
      return {
        action: `api.${request.method?.toLowerCase()}`,
        resource: 'api',
        resourceId: request.nextUrl.pathname,
        level: response.status >= 400 ? 'error' : 'info',
        description: `${request.method} ${request.nextUrl.pathname}`,
        success: response.status < 400,
        context: {
          method: request.method,
          path: request.nextUrl.pathname,
          statusCode: response.status,
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      };
    }
    
    return null; // Skip non-API routes
  },
  
  // Conditional auditing
  shouldAudit: async (request) => {
    // Skip health checks and static assets
    if (request.nextUrl.pathname.includes('/health')) return false;
    if (request.nextUrl.pathname.startsWith('/_next')) return false;
    
    // Only audit authenticated requests
    const authHeader = request.headers.get('authorization');
    return !!authHeader;
  },
  
  // Error handling
  onError: (error, request) => {
    console.error('Audit middleware error:', error);
    // Don't block the request on audit failures
  }
});
```

## 🪝 React Hooks

### useAuditEvents Hook

```typescript
import { useAuditEvents } from '@99packages/audit-log/hooks';

function AuditLogComponent() {
  const {
    events,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    stats
  } = useAuditEvents({
    adapter: auditLogger,
    organizationId: 'org_123',
    
    // Initial filters
    filters: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      levels: ['error', 'warn'],
      limit: 50
    },
    
    // Real-time updates
    realtime: true,
    
    // Auto-refresh interval
    refreshInterval: 30000, // 30 seconds
    
    // Polling options
    polling: {
      enabled: true,
      interval: 5000
    }
  });

  if (loading && events.length === 0) {
    return <div>Loading audit events...</div>;
  }

  if (error) {
    return <div>Error loading audit events: {error.message}</div>;
  }

  return (
    <div>
      <h2>Audit Events ({stats.totalEvents})</h2>
      
      <button onClick={refresh}>Refresh</button>
      
      {events.map(event => (
        <div key={event.id} className="audit-event">
          <strong>{event.action}</strong>
          <span className={`level-${event.level}`}>{event.level}</span>
          <p>{event.description}</p>
          <small>{event.timestamp.toISOString()}</small>
        </div>
      ))}
      
      {hasMore && (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  );
}
```

### useAuditLogger Hook

```typescript
import { useAuditLogger } from '@99packages/audit-log/hooks';

function UserProfileComponent() {
  const { log, logBatch } = useAuditLogger({
    adapter: auditLogger,
    defaultContext: {
      organizationId: 'org_123',
      component: 'UserProfile'
    }
  });

  const handleProfileUpdate = async (userData) => {
    try {
      // Update user profile
      await updateUserProfile(userData);
      
      // Log successful update
      await log({
        action: 'user.profile.update',
        resource: 'user',
        resourceId: userData.id,
        level: 'info',
        description: `User ${userData.email} updated their profile`,
        success: true,
        newValues: userData
      });
      
    } catch (error) {
      // Log failed update
      await log({
        action: 'user.profile.update',
        resource: 'user',
        resourceId: userData.id,
        level: 'error',
        description: `Failed to update profile for ${userData.email}`,
        success: false,
        error: {
          message: error.message,
          code: error.code
        }
      });
      
      throw error;
    }
  };

  // Batch logging for multiple operations
  const handleBulkUserUpdate = async (users) => {
    const events = users.map(user => ({
      action: 'user.bulk.update',
      resource: 'user',
      resourceId: user.id,
      level: 'info',
      description: `Bulk update for user ${user.email}`,
      success: true
    }));
    
    await logBatch(events);
  };

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
}
```

### useAuditStats Hook

```typescript
import { useAuditStats } from '@99packages/audit-log/hooks';

function AuditStatsComponent() {
  const {
    stats,
    loading,
    error,
    refresh
  } = useAuditStats({
    adapter: auditLogger,
    organizationId: 'org_123',
    
    // Time range for statistics
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    },
    
    // Grouping options
    groupBy: ['action', 'level', 'resource'],
    
    // Auto-refresh
    refreshInterval: 60000 // 1 minute
  });

  if (loading) return <div>Loading statistics...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="audit-stats">
      <h2>Audit Statistics</h2>
      
      <div className="stats-overview">
        <div className="stat">
          <h3>Total Events</h3>
          <span>{stats.totalEvents}</span>
        </div>
        
        <div className="stat">
          <h3>Success Rate</h3>
          <span>{stats.successRate}%</span>
        </div>
        
        <div className="stat">
          <h3>Error Rate</h3>
          <span>{100 - stats.successRate}%</span>
        </div>
      </div>
      
      <div className="stats-breakdown">
        <h3>Events by Action</h3>
        {Object.entries(stats.eventsByAction).map(([action, count]) => (
          <div key={action}>
            <span>{action}</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
      
      <div className="stats-breakdown">
        <h3>Events by Level</h3>
        {Object.entries(stats.eventsByLevel).map(([level, count]) => (
          <div key={level} className={`level-${level}`}>
            <span>{level}</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
      
      <button onClick={refresh}>Refresh Stats</button>
    </div>
  );
}
```

## ⚙️ Configuration

### Environment-based Configuration

```typescript
// config/audit.ts
import { AuditLoggerConfig } from '@99packages/audit-log/types';

export const auditConfig: AuditLoggerConfig = {
  // Audit level filtering
  level: process.env.AUDIT_LEVEL as 'debug' | 'info' | 'warn' | 'error' || 'info',
  
  // Enable/disable auditing
  enabled: process.env.NODE_ENV !== 'test',
  
  // Batch processing
  batchSize: parseInt(process.env.AUDIT_BATCH_SIZE || '50'),
  flushInterval: parseInt(process.env.AUDIT_FLUSH_INTERVAL || '5000'),
  
  // Retry configuration
  maxRetries: parseInt(process.env.AUDIT_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.AUDIT_RETRY_DELAY || '1000'),
  
  // Data sanitization
  sanitize: {
    enabled: process.env.AUDIT_SANITIZE_ENABLED === 'true',
    fields: process.env.AUDIT_SANITIZE_FIELDS?.split(',') || [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'session'
    ],
    replacement: process.env.AUDIT_SANITIZE_REPLACEMENT || '[REDACTED]'
  },
  
  // Filtering rules
  filters: {
    exclude: {
      actions: process.env.AUDIT_EXCLUDE_ACTIONS?.split(','),
      resources: process.env.AUDIT_EXCLUDE_RESOURCES?.split(','),
      actors: process.env.AUDIT_EXCLUDE_ACTORS?.split(',')
    },
    include: {
      actions: process.env.AUDIT_INCLUDE_ACTIONS?.split(','),
      resources: process.env.AUDIT_INCLUDE_RESOURCES?.split(','),
      actors: process.env.AUDIT_INCLUDE_ACTORS?.split(',')
    }
  },
  
  // Metadata
  metadata: {
    environment: process.env.NODE_ENV || 'development',
    service: process.env.SERVICE_NAME || 'web',
    version: process.env.APP_VERSION || '1.0.0',
    component: 'audit-logger'
  }
};
```

### Multi-environment Setup

```typescript
// config/audit-environments.ts
const baseConfig = {
  batchSize: 50,
  maxRetries: 3,
  sanitize: {
    enabled: true,
    fields: ['password', 'token', 'secret'],
    replacement: '[REDACTED]'
  }
};

export const auditConfigs = {
  development: {
    ...baseConfig,
    level: 'debug',
    enabled: true,
    adapter: 'sqlite',
    config: {
      database: './dev-audit.db'
    }
  },
  
  staging: {
    ...baseConfig,
    level: 'info',
    enabled: true,
    adapter: 'supabase',
    config: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      tableName: 'audit_logs_staging'
    }
  },
  
  production: {
    ...baseConfig,
    level: 'info',
    enabled: true,
    batchSize: 100,
    flushInterval: 3000,
    adapter: 'supabase',
    config: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      tableName: 'audit_logs',
      enableRLS: true,
      realtime: {
        enabled: true,
        channel: 'audit-logs'
      }
    }
  }
};

export const getAuditConfig = () => {
  const env = process.env.NODE_ENV as keyof typeof auditConfigs;
  return auditConfigs[env] || auditConfigs.development;
};
```

## 🔒 Security & Compliance

### Data Sanitization

```typescript
import { createAuditLogger } from '@99packages/audit-log';

const auditLogger = createAuditLogger(adapter, {
  // Automatic PII detection and redaction
  sanitize: {
    enabled: true,
    
    // Fields to always redact
    fields: [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'session',
      'ssn',
      'creditCard',
      'bankAccount'
    ],
    
    // Custom redaction patterns
    patterns: [
      {
        pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        replacement: '[CREDIT_CARD_REDACTED]'
      },
      {
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        replacement: '[SSN_REDACTED]'
      },
      {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[EMAIL_REDACTED]'
      }
    ],
    
    // Custom sanitization function
    customSanitizer: (data) => {
      // Implement custom logic
      return sanitizeCustomData(data);
    }
  }
});
```

### GDPR Compliance

```typescript
import { createGDPRAuditLogger } from '@99packages/audit-log/compliance';

const gdprAuditLogger = createGDPRAuditLogger({
  adapter: supabaseAdapter,
  
  // Data retention policies
  retention: {
    defaultPeriod: '7 years',
    byDataType: {
      'user.login': '2 years',
      'user.data.access': '1 year',
      'user.data.export': '1 year',
      'user.data.deletion': 'permanent'
    }
  },
  
  // Automatic data subject request handling
  dataSubjectRequests: {
    enabled: true,
    
    // Automatic data export
    handleExportRequest: async (subjectId) => {
      const events = await gdprAuditLogger.query({
        actorId: subjectId,
        startDate: new Date('2018-05-25') // GDPR effective date
      });
      
      return {
        format: 'json',
        data: events,
        metadata: {
          exportDate: new Date().toISOString(),
          dataController: 'Your Company Name',
          legalBasis: 'Article 20 - Right to data portability'
        }
      };
    },
    
    // Automatic data deletion
    handleDeletionRequest: async (subjectId) => {
      const deletedCount = await gdprAuditLogger.purgeByActor(subjectId);
      
      // Log the deletion for compliance
      await gdprAuditLogger.log({
        action: 'user.data.deletion',
        resource: 'user',
        resourceId: subjectId,
        level: 'info',
        description: `GDPR data deletion request completed for user ${subjectId}`,
        metadata: {
          deletedRecords: deletedCount,
          legalBasis: 'Article 17 - Right to erasure',
          requestDate: new Date().toISOString()
        }
      });
      
      return { deletedRecords: deletedCount };
    }
  }
});
```

### Access Control

```typescript
// Row Level Security policies for Supabase
const rlsPolicies = `
-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own audit logs
CREATE POLICY "users_own_audit_logs" ON audit_logs
  FOR SELECT USING (actor_id = auth.uid());

-- Organization members can view audit logs for their organization
CREATE POLICY "org_members_audit_logs" ON audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Audit admins can view all audit logs in their organization
CREATE POLICY "audit_admins_full_access" ON audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'audit_admin'
      AND ur.organization_id = audit_logs.organization_id
    )
  );

-- Service role can insert audit logs
CREATE POLICY "service_role_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);
`;

// Application-level access control
import { createAuditLogger } from '@99packages/audit-log';

const auditLogger = createAuditLogger(adapter, {
  // Access control configuration
  accessControl: {
    enabled: true,
    
    // Define access levels
    levels: {
      'read': ['user', 'admin', 'audit_admin'],
      'write': ['system', 'audit_admin'],
      'delete': ['audit_admin'],
      'export': ['admin', 'audit_admin']
    },
    
    // Custom authorization function
    authorize: async (operation, user, context) => {
      // Check user roles and permissions
      const userRoles = await getUserRoles(user.id, context.organizationId);
      const requiredRoles = accessControl.levels[operation];
      
      return userRoles.some(role => requiredRoles.includes(role));
    }
  }
});
```

## ⚡ Performance

### Batching and Queuing

```typescript
import { createAuditLogger } from '@99packages/audit-log';

const highPerformanceLogger = createAuditLogger(adapter, {
  // Batch processing configuration
  batching: {
    enabled: true,
    batchSize: 100,          // Process 100 events at once
    maxWaitTime: 5000,       // Maximum 5 seconds wait
    flushInterval: 2000,     // Flush every 2 seconds
    
    // Priority-based batching
    priority: {
      high: { batchSize: 10, maxWaitTime: 1000 },    // Critical events
      medium: { batchSize: 50, maxWaitTime: 3000 },   // Important events
      low: { batchSize: 200, maxWaitTime: 10000 }     // Routine events
    }
  },
  
  // Queue management
  queue: {
    maxSize: 10000,          // Maximum queue size
    overflow: 'drop-oldest', // Strategy when queue is full
    
    // Persistent queue (survives application restarts)
    persistent: {
      enabled: true,
      storage: 'file',       // or 'redis', 'memory'
      path: './audit-queue'
    }
  },
  
  // Memory optimization
  memory: {
    maxBufferSize: 50 * 1024 * 1024, // 50MB buffer
    compression: 'gzip',              // Compress events in memory
    gcInterval: 60000                 // Garbage collection interval
  }
});

// High-throughput logging
async function logManyEvents() {
  const events = Array.from({ length: 1000 }, (_, i) => ({
    action: 'bulk.operation',
    resource: 'document',
    resourceId: `doc_${i}`,
    level: 'info',
    description: `Bulk operation ${i}`,
    priority: i < 100 ? 'high' : 'low' // First 100 are high priority
  }));
  
  // All events are automatically batched
  await Promise.all(events.map(event => highPerformanceLogger.log(event)));
}
```

### Indexing Strategy

```sql
-- Supabase optimized indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_org_timestamp 
  ON audit_logs(organization_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_actor_timestamp 
  ON audit_logs(actor_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_timestamp 
  ON audit_logs(action, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource_timestamp 
  ON audit_logs(resource, resource_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_level_timestamp 
  ON audit_logs(level, timestamp DESC) 
  WHERE level IN ('error', 'warn');

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_errors 
  ON audit_logs(organization_id, timestamp DESC) 
  WHERE success = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_actions 
  ON audit_logs(actor_id, action, timestamp DESC) 
  WHERE actor_type = 'user';

-- GIN index for JSONB context searching
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_context_gin 
  ON audit_logs USING GIN(context);

-- Full-text search index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_description_fts 
  ON audit_logs USING GIN(to_tsvector('english', description));
```

### Monitoring and Health Checks

```typescript
import { useAuditHealth } from '@99packages/audit-log/hooks';

function AuditHealthMonitor() {
  const {
    health,
    performance,
    alerts
  } = useAuditHealth({
    adapter: auditLogger,
    
    // Health check configuration
    checks: {
      connectivity: { timeout: 5000 },
      performance: { 
        slowQueryThreshold: 1000,
        highMemoryThreshold: 100 * 1024 * 1024 // 100MB
      },
      queue: {
        maxSize: 1000,
        ageThreshold: 60000 // 1 minute
      }
    },
    
    // Monitoring interval
    interval: 30000, // 30 seconds
    
    // Alert thresholds
    alerting: {
      errorRate: 0.05,      // 5% error rate
      latency: 2000,        // 2 seconds
      queueDepth: 500,      // 500 pending events
      memoryUsage: 0.8      // 80% memory usage
    }
  });

  return (
    <div className="audit-health-monitor">
      <h2>Audit System Health</h2>
      
      <div className="health-status">
        <span className={`status ${health.status}`}>
          {health.status.toUpperCase()}
        </span>
        <span>Last Check: {health.lastCheck.toISOString()}</span>
      </div>
      
      <div className="performance-metrics">
        <h3>Performance</h3>
        <div>Average Latency: {performance.averageLatency}ms</div>
        <div>Throughput: {performance.eventsPerSecond} events/sec</div>
        <div>Queue Depth: {performance.queueDepth}</div>
        <div>Memory Usage: {performance.memoryUsage}MB</div>
      </div>
      
      {alerts.length > 0 && (
        <div className="alerts">
          <h3>Active Alerts</h3>
          {alerts.map(alert => (
            <div key={alert.id} className={`alert ${alert.severity}`}>
              <strong>{alert.title}</strong>
              <p>{alert.description}</p>
              <small>{alert.timestamp.toISOString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 📚 Examples

### Complete Supabase Integration Example

```typescript
// lib/audit.ts
import { createSupabaseAuditLogger } from '@99packages/audit-log/adapters/postgresql';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create audit logger
export const auditLogger = createSupabaseAuditLogger({
  supabaseClient: supabase,
  tableName: 'audit_logs',
  
  // Multi-tenant configuration
  defaultOrganizationId: process.env.DEFAULT_ORG_ID,
  enableRLS: true,
  
  // Performance optimization
  batchSize: 50,
  flushInterval: 3000,
  
  // Security configuration
  sanitize: {
    enabled: true,
    fields: ['password', 'token', 'secret', 'creditCard'],
    replacement: '[REDACTED]'
  },
  
  // Real-time features
  realtime: {
    enabled: true,
    channel: 'audit-logs'
  }
});

// Helper function to get organization context
export async function getAuditContext(request: Request) {
  // Extract user and organization from JWT or session
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const { data: { user } } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  
  if (!user) return null;
  
  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  
  return {
    userId: user.id,
    userEmail: user.email,
    organizationId: profile?.organization_id
  };
}
```

```typescript
// app/api/users/[id]/route.ts - API Route with Audit Logging
import { NextRequest, NextResponse } from 'next/server';
import { auditLogger, getAuditContext } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await getAuditContext(request);
  
  try {
    // Fetch user data
    const user = await getUserById(params.id);
    
    // Log successful access
    await auditLogger.log({
      action: 'user.read',
      resource: 'user',
      resourceId: params.id,
      level: 'info',
      actorId: context?.userId,
      actorType: 'user',
      description: `User ${context?.userEmail} accessed user profile ${params.id}`,
      success: true,
      context: {
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        method: 'GET',
        path: request.nextUrl.pathname
      },
      metadata: {
        organizationId: context?.organizationId,
        environment: process.env.NODE_ENV
      }
    });
    
    return NextResponse.json(user);
    
  } catch (error) {
    // Log failed access
    await auditLogger.log({
      action: 'user.read',
      resource: 'user',
      resourceId: params.id,
      level: 'error',
      actorId: context?.userId,
      actorType: 'user',
      description: `Failed to access user profile ${params.id}`,
      success: false,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      context: {
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });
    
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await getAuditContext(request);
  const updateData = await request.json();
  
  try {
    // Get current user data for change tracking
    const currentUser = await getUserById(params.id);
    
    // Update user
    const updatedUser = await updateUser(params.id, updateData);
    
    // Log successful update with change tracking
    await auditLogger.log({
      action: 'user.update',
      resource: 'user',
      resourceId: params.id,
      level: 'info',
      actorId: context?.userId,
      actorType: 'user',
      description: `User ${context?.userEmail} updated user profile ${params.id}`,
      success: true,
      oldValues: currentUser,
      newValues: updatedUser,
      context: {
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        changedFields: Object.keys(updateData)
      },
      metadata: {
        organizationId: context?.organizationId,
        updateType: 'profile_update'
      }
    });
    
    return NextResponse.json(updatedUser);
    
  } catch (error) {
    // Log failed update
    await auditLogger.log({
      action: 'user.update',
      resource: 'user',
      resourceId: params.id,
      level: 'error',
      actorId: context?.userId,
      actorType: 'user',
      description: `Failed to update user profile ${params.id}`,
      success: false,
      error: {
        message: error.message,
        code: error.code || 'UPDATE_FAILED'
      }
    });
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
```

```typescript
// components/AuditLogViewer.tsx - React Component
import { useState, useEffect } from 'react';
import { AuditTable, AuditFilters, AuditDashboard } from '@99packages/audit-log/ui';
import { useAuditEvents, useAuditStats } from '@99packages/audit-log/hooks';
import { auditLogger } from '@/lib/audit';

interface AuditLogViewerProps {
  organizationId: string;
  userRole: 'user' | 'admin' | 'audit_admin';
}

export function AuditLogViewer({ organizationId, userRole }: AuditLogViewerProps) {
  const [filters, setFilters] = useState({
    organizationId,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    limit: 100
  });

  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    hasMore,
    loadMore,
    refresh
  } = useAuditEvents({
    adapter: auditLogger,
    filters,
    realtime: userRole === 'audit_admin', // Only admins get real-time updates
    refreshInterval: userRole === 'audit_admin' ? 30000 : undefined
  });

  const {
    stats,
    loading: statsLoading
  } = useAuditStats({
    adapter: auditLogger,
    organizationId,
    timeRange: {
      start: filters.startDate,
      end: new Date()
    },
    refreshInterval: 60000 // Refresh every minute
  });

  // Role-based feature access
  const canExportLogs = ['admin', 'audit_admin'].includes(userRole);
  const canViewAllActions = ['audit_admin'].includes(userRole);
  const canViewSensitiveData = userRole === 'audit_admin';

  const handleExportLogs = async () => {
    if (!canExportLogs) return;
    
    try {
      const allEvents = await auditLogger.query({
        ...filters,
        limit: 10000 // Export limit
      });
      
      const csv = convertToCSV(allEvents);
      downloadCSV(csv, `audit-logs-${organizationId}-${new Date().toISOString()}.csv`);
      
      // Log the export action
      await auditLogger.log({
        action: 'audit.export',
        resource: 'audit_logs',
        level: 'info',
        description: `Audit logs exported for organization ${organizationId}`,
        metadata: {
          exportedRecords: allEvents.length,
          exportFormat: 'csv'
        }
      });
      
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  if (eventsLoading && events.length === 0) {
    return <div>Loading audit logs...</div>;
  }

  if (eventsError) {
    return <div>Error loading audit logs: {eventsError.message}</div>;
  }

  return (
    <div className="audit-log-viewer">
      <div className="audit-header">
        <h1>Audit Logs</h1>
        
        <div className="audit-actions">
          <button onClick={refresh}>Refresh</button>
          {canExportLogs && (
            <button onClick={handleExportLogs}>Export CSV</button>
          )}
        </div>
      </div>

      {/* Dashboard - only for admins */}
      {userRole === 'audit_admin' && !statsLoading && stats && (
        <AuditDashboard
          stats={stats}
          organizationId={organizationId}
          timeRange="last_7_days"
          className="mb-6"
        />
      )}

      {/* Filters */}
      <AuditFilters
        value={filters}
        onChange={setFilters}
        options={{
          actions: canViewAllActions ? undefined : [
            'user.login',
            'user.logout',
            'user.profile.update'
          ],
          showSensitiveActions: canViewSensitiveData
        }}
        className="mb-4"
      />

      {/* Audit Table */}
      <AuditTable
        events={events}
        loading={eventsLoading}
        columns={[
          'timestamp',
          'action',
          'actor',
          'resource',
          'level',
          'success',
          ...(canViewSensitiveData ? ['context', 'metadata'] : [])
        ]}
        onRowClick={(event) => {
          if (canViewSensitiveData) {
            // Show detailed event modal
            showEventDetails(event);
          }
        }}
        renderLevel={(level) => (
          <span className={`audit-level audit-level-${level}`}>
            {level.toUpperCase()}
          </span>
        )}
        renderSuccess={(success) => (
          <span className={`audit-success ${success ? 'success' : 'failure'}`}>
            {success ? '✓' : '✗'}
          </span>
        )}
      />

      {/* Load More */}
      {hasMore && (
        <div className="load-more">
          <button onClick={loadMore}>Load More Events</button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function convertToCSV(events: any[]): string {
  // Implementation for CSV conversion
  // ...
}

function downloadCSV(csv: string, filename: string): void {
  // Implementation for CSV download
  // ...
}

function showEventDetails(event: any): void {
  // Implementation for event details modal
  // ...
}
```

```typescript
// middleware.ts - Automatic Audit Logging
import { createAuditMiddleware } from '@99packages/audit-log/middleware';
import { auditLogger, getAuditContext } from '@/lib/audit';

export const middleware = createAuditMiddleware({
  adapter: auditLogger,
  
  // Configure what to audit
  audit: {
    api: {
      enabled: true,
      includeBody: false, // Don't log request bodies for security
      includeResponseBody: false,
      excludePaths: [
        '/api/health',
        '/api/metrics',
        '/api/_analytics'
      ]
    },
    
    auth: {
      enabled: true,
      trackLogins: true,
      trackLogouts: true,
      trackFailedAttempts: true
    }
  },
  
  // Extract user context
  getUserContext: async (request) => {
    return await getAuditContext(request);
  },
  
  // Custom event generation
  generateEvent: async (request, response, context) => {
    const isAPI = request.nextUrl.pathname.startsWith('/api');
    const method = request.method;
    const path = request.nextUrl.pathname;
    const statusCode = response.status;
    
    if (!isAPI) return null; // Only audit API calls
    
    // Determine action based on method and path
    let action = `api.${method?.toLowerCase()}`;
    if (path.includes('/auth/')) {
      action = path.includes('/login') ? 'auth.login' : 
               path.includes('/logout') ? 'auth.logout' : 
               path.includes('/register') ? 'auth.register' : action;
    }
    
    return {
      action,
      resource: 'api',
      resourceId: path,
      level: statusCode >= 400 ? 'error' : 'info',
      actorId: context?.userId,
      actorType: context?.userId ? 'user' : 'anonymous',
      description: `${method} ${path} - ${statusCode}`,
      success: statusCode < 400,
      context: {
        method,
        path,
        statusCode,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        duration: Date.now() - (request as any).startTime
      },
      metadata: {
        organizationId: context?.organizationId,
        environment: process.env.NODE_ENV
      }
    };
  },
  
  // Error handling
  onError: (error, request) => {
    console.error('Audit middleware error:', error);
    // Don't block requests due to audit failures
  }
});

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
```

## 📚 Documentation

Comprehensive documentation is available to help you implement and optimize audit logging in your application:

### Core Documentation

- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation with TypeScript interfaces and examples
- **[Supabase Integration Guide](./docs/SUPABASE.md)** - Detailed Supabase setup, configuration, and optimization
- **[Security Best Practices](./docs/security-best-practices.md)** - Security guidelines, compliance, and data protection
- **[Performance & Benchmarking](./docs/PERFORMANCE.md)** - Performance optimization, benchmarking tools, and monitoring
- **[Troubleshooting Guide](./docs/TROUBLESHOOTING.md)** - Common issues, debugging, and solutions

### Migration & Development

- **[Migration Guide](./docs/MIGRATION.md)** - Migrate from other logging solutions and databases
- **[Contributing Guide](./CONTRIBUTING.md)** - Development setup, testing, and contribution guidelines
- **[Changelog](./CHANGELOG.md)** - Version history, breaking changes, and migration notes

### Examples & Tutorials

- **[Examples Overview](./examples/README.md)** - 8 comprehensive example implementations
- **[Basic Next.js Example](./examples/basic-nextjs/)** - Simple file-based audit logging
- **[Supabase Integration Example](./examples/supabase-integration/)** - Full Supabase implementation
- **[E-commerce Audit System](./examples/ecommerce-audit/)** - Order and inventory tracking
- **[Security Dashboard](./examples/security-dashboard/)** - Real-time security monitoring

### Quick Reference

#### Essential Links
```typescript
// Core imports
import { createAuditLogger, PostgreSQLAdapter } from '@99packages/audit-log';
import { AuditTable, AuditDashboard } from '@99packages/audit-log/ui';
import { useAuditEvents, useAuditStats } from '@99packages/audit-log/hooks';

// Quick setup
const logger = createAuditLogger({
  adapter: new PostgreSQLAdapter({ client: supabase })
});
```

#### Database Schemas
- **PostgreSQL/Supabase**: See [migrations/postgresql/](./migrations/postgresql/)
- **MySQL**: See [migrations/mysql/](./migrations/mysql/)
- **MongoDB**: See [migrations/mongodb/](./migrations/mongodb/)
- **SQLite**: See [migrations/sqlite/](./migrations/sqlite/)

#### React Components
```tsx
// Basic usage
<AuditTable events={events} />
<AuditDashboard logger={logger} />

// With hooks
const { events, loading } = useAuditEvents(logger);
const stats = useAuditStats(logger);
```

#### Performance Benchmarks
- **File Adapter**: 5,000 events/sec, 2ms latency
- **PostgreSQL**: 15,000 events/sec (batched), 20ms latency
- **MongoDB**: 18,000 events/sec (batched), 15ms latency

For detailed performance optimization, see the [Performance Guide](./docs/PERFORMANCE.md).

## 🔄 Migration Guide

### From Custom Logging Solutions

```typescript
// Before: Custom logging
const customLogger = {
  log: (message: string, data: any) => {
    console.log(`[${new Date().toISOString()}] ${message}`, data);
    // Maybe save to file or database
  }
};

customLogger.log('User login', { userId: '123', success: true });

// After: Structured audit logging
import { createSupabaseAuditLogger } from '@99packages/audit-log';

const auditLogger = createSupabaseAuditLogger({
  // Supabase configuration
});

await auditLogger.log({
  action: 'user.login',
  resource: 'authentication',
  actorId: '123',
  actorType: 'user',
  level: 'info',
  description: 'User successfully logged in',
  success: true,
  context: {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
});
```

### From Winston/Pino Loggers

```typescript
// Migration utility
import { migrateFromWinston } from '@99packages/audit-log/migration';

const migrationConfig = {
  source: {
    type: 'winston',
    logFiles: ['./logs/app.log', './logs/audit.log'],
    format: 'json'
  },
  target: {
    adapter: 'supabase',
    config: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  },
  mapping: {
    // Map Winston fields to audit log fields
    timestamp: 'timestamp',
    level: 'level',
    message: 'description',
    userId: 'actorId',
    action: 'action',
    // Custom transformation
    transform: (logEntry) => ({
      action: inferActionFromMessage(logEntry.message),
      resource: inferResourceFromContext(logEntry.meta),
      success: logEntry.level !== 'error'
    })
  }
};

await migrateFromWinston(migrationConfig);
```

## 📖 API Reference

### Core Types

```typescript
interface AuditEvent {
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
  error?: AuditError;
  metadata?: AuditMetadata;
}

interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  actions?: AuditEventAction[];
  resources?: AuditResource[];
  levels?: AuditLevel[];
  actorIds?: string[];
  organizationId?: string;
  success?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: keyof AuditEvent;
  sortOrder?: 'ASC' | 'DESC';
}

interface AuditStats {
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
```

### Adapter Interface

```typescript
interface AuditAdapter {
  log(event: AuditEvent): Promise<void>;
  logBatch(events: AuditEvent[]): Promise<void>;
  query(filter: AuditFilter): Promise<PaginatedResult<AuditEvent>>;
  count(filter: Omit<AuditFilter, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>): Promise<number>;
  getStats(filter?: Pick<AuditFilter, 'startDate' | 'endDate' | 'organizationId'>): Promise<AuditStats>;
  purge(olderThan: Date): Promise<number>;
  healthCheck(): Promise<boolean>;
  close(): Promise<void>;
}
```

### Hook Types

```typescript
interface UseAuditEventsOptions {
  adapter: AuditAdapter;
  filters?: AuditFilter;
  realtime?: boolean;
  refreshInterval?: number;
  polling?: {
    enabled: boolean;
    interval: number;
  };
}

interface UseAuditEventsReturn {
  events: AuditEvent[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  stats: AuditStats;
}
```

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📞 Support

- 📚 **Documentation**: [Full Documentation](./docs/)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-org/99packages/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-org/99packages/discussions)
- 📧 **Email**: support@99packages.dev

---

**Built with ❤️ by the 99packages team**
