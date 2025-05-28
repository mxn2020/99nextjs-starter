# Supabase Integration Guide for Audit Logging

This guide provides comprehensive instructions for integrating `@99packages/audit-log` with Supabase, the leading open-source Firebase alternative.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Setup](#quick-setup)
- [Database Schema](#database-schema)
- [Security Configuration](#security-configuration)
- [Real-time Features](#real-time-features)
- [Performance Optimization](#performance-optimization)
- [Multi-tenant Setup](#multi-tenant-setup)
- [Monitoring & Analytics](#monitoring--analytics)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

Supabase provides an excellent foundation for audit logging with:

- **PostgreSQL Database**: Native JSON support and powerful querying
- **Row Level Security (RLS)**: Fine-grained access control
- **Real-time Subscriptions**: Live audit log monitoring
- **Edge Functions**: Serverless audit processing
- **Built-in Auth**: Seamless user context tracking

### Why Supabase for Audit Logging?

✅ **Enterprise-Grade Security**: RLS, encryption, and compliance features  
✅ **Real-time Monitoring**: Instant notifications for critical events  
✅ **Scalable Performance**: Auto-scaling with read replicas  
✅ **Developer Experience**: Excellent tooling and documentation  
✅ **Cost Effective**: Transparent pricing with generous free tier  

## Quick Setup

### 1. Install Dependencies

```bash
npm install @99packages/audit-log @supabase/supabase-js
```

### 2. Environment Configuration

```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Custom schema for audit logs
AUDIT_SCHEMA=audit
AUDIT_TABLE=audit_logs
```

### 3. Basic Configuration

```typescript
// lib/audit-logger.ts
import { AuditLogger } from '@99packages/audit-log';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for audit logging (use service role)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Configure audit logger
export const auditLogger = new AuditLogger({
  adapter: 'postgresql',
  connection: {
    client: supabaseAdmin,
    table: 'audit_logs',
    schema: 'public' // or 'audit' for separate schema
  },
  performance: {
    batchSize: 100,
    flushInterval: 5000, // 5 seconds
    enableCompression: true
  }
});
```

### 4. Basic Usage

```typescript
// app/api/users/route.ts
import { auditLogger } from '@/lib/audit-logger';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getCurrentUser(request);
  const userData = await request.json();
  
  try {
    // Create user
    const newUser = await createUser(userData);
    
    // Log the action
    await auditLogger.log({
      action: 'user.create',
      actorId: user.id,
      actorType: 'user',
      resource: 'user',
      resourceId: newUser.id,
      metadata: {
        email: newUser.email,
        role: newUser.role,
        source: 'admin_panel'
      }
    });
    
    return Response.json(newUser);
  } catch (error) {
    // Log failed attempts too
    await auditLogger.log({
      action: 'user.create.failed',
      actorId: user.id,
      resource: 'user',
      severity: 'high',
      metadata: {
        error: error.message,
        attemptedEmail: userData.email
      }
    });
    
    throw error;
  }
}
```

## Database Schema

### 1. Create Audit Schema (Recommended)

```sql
-- Create dedicated schema for audit logs
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA audit TO authenticated;
GRANT USAGE ON SCHEMA audit TO service_role;
```

### 2. Create Audit Logs Table

```sql
-- Create audit_logs table in audit schema
CREATE TABLE audit.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Actor information
  actor_id TEXT,
  actor_type TEXT DEFAULT 'user',
  actor_metadata JSONB DEFAULT '{}',
  
  -- Action details
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  
  -- Organization/tenant isolation
  organization_id TEXT,
  
  -- Event context
  severity TEXT DEFAULT 'info' CHECK (severity IN ('low', 'info', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  
  -- Additional data
  metadata JSONB DEFAULT '{}',
  context JSONB DEFAULT '{}',
  
  -- Request information
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  session_id TEXT,
  
  -- System information
  source TEXT DEFAULT 'api',
  version TEXT,
  environment TEXT,
  
  -- Compliance and audit
  retention_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 3. Create Indexes for Performance

```sql
-- Primary indexes for common queries
CREATE INDEX idx_audit_logs_timestamp ON audit.audit_logs (timestamp DESC);
CREATE INDEX idx_audit_logs_actor_id ON audit.audit_logs (actor_id);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs (action);
CREATE INDEX idx_audit_logs_resource ON audit.audit_logs (resource, resource_id);
CREATE INDEX idx_audit_logs_organization ON audit.audit_logs (organization_id);

-- Composite indexes for complex queries
CREATE INDEX idx_audit_logs_actor_timestamp ON audit.audit_logs (actor_id, timestamp DESC);
CREATE INDEX idx_audit_logs_org_timestamp ON audit.audit_logs (organization_id, timestamp DESC);
CREATE INDEX idx_audit_logs_severity_timestamp ON audit.audit_logs (severity, timestamp DESC) 
  WHERE severity IN ('high', 'critical');

-- Partial indexes for performance
CREATE INDEX idx_audit_logs_failed_actions ON audit.audit_logs (action, timestamp DESC)
  WHERE status = 'failure';

-- JSONB indexes for metadata queries
CREATE INDEX idx_audit_logs_metadata_gin ON audit.audit_logs USING GIN (metadata);
CREATE INDEX idx_audit_logs_context_gin ON audit.audit_logs USING GIN (context);
```

### 4. Create Helper Functions

```sql
-- Function to get audit logs for a user
CREATE OR REPLACE FUNCTION audit.get_user_audit_logs(
  user_id TEXT,
  limit_count INTEGER DEFAULT 100,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  timestamp TIMESTAMPTZ,
  action TEXT,
  resource TEXT,
  resource_id TEXT,
  severity TEXT,
  status TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.timestamp,
    al.action,
    al.resource,
    al.resource_id,
    al.severity,
    al.status,
    al.metadata
  FROM audit.audit_logs al
  WHERE al.actor_id = user_id
  ORDER BY al.timestamp DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit statistics
CREATE OR REPLACE FUNCTION audit.get_audit_stats(
  org_id TEXT DEFAULT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'by_severity', jsonb_object_agg(severity, severity_count),
    'by_action', jsonb_object_agg(action_group, action_count),
    'by_status', jsonb_object_agg(status, status_count)
  ) INTO result
  FROM (
    SELECT 
      severity,
      COUNT(*) as severity_count,
      SPLIT_PART(action, '.', 1) as action_group,
      COUNT(*) OVER (PARTITION BY SPLIT_PART(action, '.', 1)) as action_count,
      status,
      COUNT(*) OVER (PARTITION BY status) as status_count
    FROM audit.audit_logs
    WHERE 
      timestamp BETWEEN start_date AND end_date
      AND (org_id IS NULL OR organization_id = org_id)
  ) stats;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Security Configuration

### 1. Enable Row Level Security

```sql
-- Enable RLS on audit_logs table
ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY;
```

### 2. Create Security Policies

```sql
-- Policy: Users can only read their own audit logs
CREATE POLICY "users_read_own_logs" ON audit.audit_logs
  FOR SELECT USING (
    auth.uid()::text = actor_id AND 
    auth.role() = 'authenticated'
  );

-- Policy: Organization admins can read org logs
CREATE POLICY "org_admins_read_org_logs" ON audit.audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('org_admin', 'admin') AND
    auth.jwt() ->> 'organization_id' = organization_id
  );

-- Policy: Security admins can read all logs
CREATE POLICY "security_admins_read_all" ON audit.audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'system_admin')
  );

-- Policy: Only service role can insert audit logs
CREATE POLICY "service_role_insert_only" ON audit.audit_logs
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Prevent modifications (immutable logs)
CREATE POLICY "immutable_audit_logs" ON audit.audit_logs
  FOR UPDATE USING (false);

-- Policy: Only system admin can delete expired logs
CREATE POLICY "system_admin_delete_expired" ON audit.audit_logs
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'system_admin' AND
    (retention_until IS NOT NULL AND retention_until < NOW())
  );
```

### 3. Custom Claims for Enhanced Security

```sql
-- Function to add custom claims to JWT
CREATE OR REPLACE FUNCTION auth.get_user_claims(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_claims JSONB;
BEGIN
  SELECT jsonb_build_object(
    'organization_id', p.organization_id,
    'role', p.role,
    'permissions', p.permissions
  ) INTO user_claims
  FROM user_profiles p
  WHERE p.user_id = $1;
  
  RETURN COALESCE(user_claims, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Real-time Features

### 1. Real-time Audit Log Monitoring

```typescript
// components/AuditLogMonitor.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@/hooks/useUser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function AuditLogMonitor() {
  const { user } = useUser();
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time audit events for the user
    const channel = supabase
      .channel('audit-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'audit',
        table: 'audit_logs',
        filter: `actor_id=eq.${user.id}`
      }, (payload) => {
        setRecentEvents(prev => [payload.new, ...prev.slice(0, 9)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Recent Activity</h3>
      {recentEvents.map((event: any) => (
        <div key={event.id} className="text-xs bg-gray-50 p-2 rounded">
          <span className="font-mono">{event.action}</span>
          <span className="text-gray-500 ml-2">
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### 2. Security Event Alerts

```typescript
// lib/security-monitor.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class SecurityMonitor {
  private channel: any;

  start() {
    this.channel = supabase
      .channel('security-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'audit',
        table: 'audit_logs',
        filter: 'severity=in.(high,critical)'
      }, (payload) => {
        this.handleSecurityEvent(payload.new);
      })
      .subscribe();
  }

  private async handleSecurityEvent(event: any) {
    // Immediate notification for critical events
    if (event.severity === 'critical') {
      await this.sendImmediateAlert(event);
    }

    // Log to external security system
    await this.logToSIEM(event);

    // Check for patterns/anomalies
    await this.analyzeEventPattern(event);
  }

  private async sendImmediateAlert(event: any) {
    // Send Slack notification
    await fetch(process.env.SLACK_SECURITY_WEBHOOK!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Critical Security Event: ${event.action}`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Actor', value: event.actor_id, short: true },
            { title: 'Resource', value: event.resource, short: true },
            { title: 'Time', value: event.timestamp, short: true }
          ]
        }]
      })
    });
  }

  stop() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
  }
}

// Start monitoring in your application
const securityMonitor = new SecurityMonitor();
securityMonitor.start();
```

### 3. Real-time Dashboard

```typescript
// components/AuditDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useOrganization } from '@/hooks/useOrganization';

export function AuditDashboard() {
  const { organization } = useOrganization();
  const [stats, setStats] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    // Load initial statistics
    loadAuditStats();

    // Subscribe to live events
    const channel = supabase
      .channel('org-audit-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'audit',
        table: 'audit_logs',
        filter: `organization_id=eq.${organization.id}`
      }, (payload) => {
        setLiveEvents(prev => [payload.new, ...prev.slice(0, 19)]);
        // Update stats
        updateStatsIncremental(payload.new);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [organization]);

  const loadAuditStats = async () => {
    const { data } = await supabase.rpc('get_audit_stats', {
      org_id: organization.id
    });
    setStats(data);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Statistics Cards */}
      <div className="lg:col-span-2">
        <AuditStatsCards stats={stats} />
      </div>
      
      {/* Live Events */}
      <div>
        <h3 className="text-lg font-medium mb-4">Live Events</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {liveEvents.map((event: any) => (
            <AuditEventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Performance Optimization

### 1. Connection Pooling

```typescript
// lib/supabase-pool.ts
import { createClient } from '@supabase/supabase-js';

class SupabasePool {
  private pool: any[] = [];
  private maxConnections = 10;

  getClient() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }

    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  releaseClient(client: any) {
    if (this.pool.length < this.maxConnections) {
      this.pool.push(client);
    }
  }
}

export const supabasePool = new SupabasePool();
```

### 2. Batching Configuration

```typescript
// lib/audit-logger-optimized.ts
import { AuditLogger } from '@99packages/audit-log';
import { supabasePool } from './supabase-pool';

export const auditLogger = new AuditLogger({
  adapter: 'postgresql',
  connection: {
    getClient: () => supabasePool.getClient(),
    releaseClient: (client) => supabasePool.releaseClient(client),
    table: 'audit_logs',
    schema: 'audit'
  },
  performance: {
    // Batch configuration
    batchSize: 250,           // Process 250 events at once
    flushInterval: 3000,      // Flush every 3 seconds
    maxBatchWait: 10000,      // Max wait time: 10 seconds
    
    // Compression
    enableCompression: true,
    compressionLevel: 6,
    
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    
    // Health monitoring
    enableHealthCheck: true,
    healthCheckInterval: 30000
  }
});
```

### 3. Data Archiving

```sql
-- Create archived logs table for old data
CREATE TABLE audit.audit_logs_archive (
  LIKE audit.audit_logs INCLUDING ALL
);

-- Function to archive old logs
CREATE OR REPLACE FUNCTION audit.archive_old_logs(
  archive_before_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 year'
)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move old logs to archive table
  WITH moved_logs AS (
    DELETE FROM audit.audit_logs
    WHERE timestamp < archive_before_date
    RETURNING *
  )
  INSERT INTO audit.audit_logs_archive
  SELECT * FROM moved_logs;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule archiving (using pg_cron extension)
SELECT cron.schedule('archive-audit-logs', '0 2 * * *', 'SELECT audit.archive_old_logs();');
```

## Multi-tenant Setup

### 1. Organization Isolation

```typescript
// lib/audit-logger-multitenant.ts
import { AuditLogger } from '@99packages/audit-log';
import { getCurrentOrganization } from '@/lib/organization';

export async function createTenantAuditLogger(request: Request) {
  const organization = await getCurrentOrganization(request);
  
  return new AuditLogger({
    adapter: 'postgresql',
    connection: {
      client: supabaseAdmin,
      table: 'audit_logs',
      schema: 'audit'
    },
    defaults: {
      organizationId: organization.id,
      context: {
        tenant: organization.slug,
        environment: process.env.NODE_ENV
      }
    },
    filters: {
      // Ensure all queries are tenant-scoped
      organizationId: organization.id
    }
  });
}

// Usage in API routes
export async function POST(request: Request) {
  const auditLogger = await createTenantAuditLogger(request);
  
  await auditLogger.log({
    action: 'user.create',
    // organizationId is automatically added
    actorId: user.id,
    resource: 'user',
    resourceId: newUser.id
  });
}
```

### 2. Tenant-specific RLS Policies

```sql
-- Enhanced RLS policy for multi-tenant
CREATE POLICY "tenant_isolation" ON audit.audit_logs
  FOR ALL USING (
    -- Users can only access their organization's logs
    organization_id = auth.jwt() ->> 'organization_id' OR
    -- Service role can access all
    auth.jwt() ->> 'role' = 'service_role' OR
    -- System admins can access all
    auth.jwt() ->> 'role' = 'system_admin'
  );

-- Tenant admin policy
CREATE POLICY "tenant_admin_access" ON audit.audit_logs
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'tenant_admin' AND
    organization_id = auth.jwt() ->> 'organization_id'
  );
```

## Monitoring & Analytics

### 1. Audit Analytics Dashboard

```typescript
// components/AuditAnalytics.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

export function AuditAnalytics() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    // Get audit statistics
    const { data: stats } = await supabase.rpc('get_audit_stats');
    
    // Get event trends
    const { data: trends } = await supabase
      .from('audit_logs')
      .select('timestamp, action, severity')
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .order('timestamp');

    setAnalytics({ stats, trends });
  };

  if (!analytics) return <div>Loading analytics...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Event trends over time */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Event Trends</h3>
        <Line data={formatTrendData(analytics.trends)} />
      </div>

      {/* Events by severity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Events by Severity</h3>
        <Doughnut data={formatSeverityData(analytics.stats)} />
      </div>

      {/* Top actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Top Actions</h3>
        <Bar data={formatActionData(analytics.stats)} />
      </div>

      {/* Security metrics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Security Metrics</h3>
        <SecurityMetrics stats={analytics.stats} />
      </div>
    </div>
  );
}
```

### 2. Custom Audit Reports

```sql
-- Function to generate compliance report
CREATE OR REPLACE FUNCTION audit.generate_compliance_report(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  organization_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  report_type TEXT,
  event_count BIGINT,
  critical_events BIGINT,
  failed_events BIGINT,
  unique_actors BIGINT,
  data_exports BIGINT,
  privilege_changes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'compliance_summary'::TEXT as report_type,
    COUNT(*) as event_count,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
    COUNT(*) FILTER (WHERE status = 'failure') as failed_events,
    COUNT(DISTINCT actor_id) as unique_actors,
    COUNT(*) FILTER (WHERE action LIKE '%export%') as data_exports,
    COUNT(*) FILTER (WHERE action LIKE '%privilege%' OR action LIKE '%role%') as privilege_changes
  FROM audit.audit_logs
  WHERE 
    timestamp BETWEEN start_date AND end_date
    AND (organization_id IS NULL OR audit_logs.organization_id = organization_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Troubleshooting

### Common Issues and Solutions

#### 1. RLS Policy Blocking Inserts

**Problem**: Audit logs not being created due to RLS policies.

**Solution**: Ensure you're using the service role key for audit logging:

```typescript
// ❌ Wrong: Using anon key
const supabase = createClient(url, anonKey);

// ✅ Correct: Using service role key
const supabaseAdmin = createClient(url, serviceRoleKey);
```

#### 2. High Memory Usage with Batching

**Problem**: Memory consumption grows with large batch sizes.

**Solution**: Adjust batch configuration:

```typescript
const auditLogger = new AuditLogger({
  performance: {
    batchSize: 50,        // Reduce batch size
    flushInterval: 2000,  // Flush more frequently
    maxBatchWait: 5000    // Reduce max wait time
  }
});
```

#### 3. Real-time Subscription Issues

**Problem**: Real-time updates not working.

**Solution**: Check subscription filters and permissions:

```typescript
// Ensure the filter matches your RLS policies
const channel = supabase
  .channel('audit-events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'audit',
    table: 'audit_logs',
    // Filter must be compatible with RLS
    filter: `organization_id=eq.${orgId}`
  }, handler)
  .subscribe();
```

#### 4. Performance Issues with Large Datasets

**Problem**: Slow queries on large audit tables.

**Solutions**:

1. **Partitioning by timestamp**:
```sql
-- Create partitioned table
CREATE TABLE audit.audit_logs_partitioned (
  LIKE audit.audit_logs INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE audit.audit_logs_2024_01 PARTITION OF audit.audit_logs_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

2. **Archive old data**:
```typescript
// Schedule regular archiving
const archiveOldLogs = async () => {
  const result = await supabase.rpc('archive_old_logs');
  console.log(`Archived ${result.data} logs`);
};
```

## Best Practices

### 1. Security Best Practices

```typescript
// ✅ DO: Use service role for audit operations
const auditClient = createClient(url, serviceRoleKey);

// ✅ DO: Sanitize sensitive data
await auditLogger.log({
  action: 'user.login',
  actorId: user.id,
  metadata: {
    // Don't log passwords or tokens
    loginMethod: 'email',
    success: true
  }
});

// ✅ DO: Set appropriate retention policies
const auditLogger = new AuditLogger({
  retention: {
    defaultRetentionDays: 2555, // 7 years
    retentionPolicies: {
      'user.login': 365,    // 1 year for login events
      'admin.*': 2555       // 7 years for admin actions
    }
  }
});

// ❌ DON'T: Log sensitive information
await auditLogger.log({
  action: 'user.update',
  metadata: {
    password: newPassword,  // Never log passwords
    creditCard: cardNumber  // Never log PII
  }
});
```

### 2. Performance Best Practices

```typescript
// ✅ DO: Use batching for high-volume applications
const auditLogger = new AuditLogger({
  performance: {
    batchSize: 100,
    flushInterval: 5000,
    enableCompression: true
  }
});

// ✅ DO: Create appropriate indexes
// See database schema section for index examples

// ✅ DO: Use connection pooling
const pool = new SupabasePool();
const auditLogger = new AuditLogger({
  connection: {
    getClient: () => pool.getClient(),
    releaseClient: (client) => pool.releaseClient(client)
  }
});

// ❌ DON'T: Create too many real-time subscriptions
// Limit subscriptions and use proper cleanup
```

### 3. Compliance Best Practices

```typescript
// ✅ DO: Implement immutable logging
ALTER TABLE audit.audit_logs 
ADD CONSTRAINT no_updates_allowed 
CHECK (false) NOT VALID;

// ✅ DO: Use digital signatures for critical events
const auditLogger = new AuditLogger({
  compliance: {
    digitalSignatures: {
      enabled: true,
      algorithm: 'RS256',
      criticalActions: ['admin.*', 'privilege.*', 'delete.*']
    }
  }
});

// ✅ DO: Implement data anonymization for GDPR
const anonymizeUserData = async (userId: string) => {
  await auditLogger.anonymize({
    actorId: userId,
    replacements: {
      actorId: `[DELETED_USER_${Date.now()}]`,
      metadata: '[GDPR_DELETED]'
    }
  });
};
```

---

## Next Steps

1. **Explore Advanced Features**: Check out the [main README](../README.md) for React components and hooks
2. **Security Implementation**: Review the [Security Best Practices](security-best-practices.md) guide
3. **Examples**: Explore practical implementations in the [examples directory](../examples/)
4. **Contributing**: Help improve the package by contributing to our [GitHub repository](https://github.com/99packages/audit-log)

For additional support, join our [Discord community](https://discord.gg/99packages) or check our [documentation website](https://docs.99packages.com).
