# Security Best Practices for Audit Logging

This document outlines security best practices when implementing audit logging with `@99packages/audit-log`, with special focus on Supabase deployments.

## 📋 Table of Contents

- [Overview](#overview)
- [Data Protection](#data-protection)
- [Access Control](#access-control)
- [Supabase Security](#supabase-security)
- [Compliance](#compliance)
- [Monitoring & Alerting](#monitoring--alerting)
- [Incident Response](#incident-response)
- [Security Checklist](#security-checklist)

## Overview

Audit logs contain sensitive information about user activities, system changes, and security events. Proper security implementation is crucial for maintaining data integrity, privacy, and regulatory compliance.

### Security Principles

1. **Least Privilege Access**: Grant minimal necessary permissions
2. **Defense in Depth**: Multiple layers of security controls
3. **Data Minimization**: Log only necessary information
4. **Immutability**: Ensure audit logs cannot be modified
5. **Encryption**: Protect data in transit and at rest

## Data Protection

### Sensitive Data Handling

```typescript
import { AuditLogger } from '@99packages/audit-log';

// Configure data sanitization
const auditLogger = new AuditLogger({
  adapter: 'postgresql',
  sanitization: {
    // Remove PII from logs
    sensitiveFields: ['password', 'ssn', 'creditCard', 'apiKey'],
    // Hash sensitive values instead of removing
    hashFields: ['email', 'phone'],
    // Custom sanitization function
    customSanitizer: (data: any) => {
      // Remove credit card numbers
      if (typeof data === 'string') {
        return data.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '[CREDIT_CARD_REDACTED]');
      }
      return data;
    }
  }
});

// Safe logging example
await auditLogger.log({
  action: 'user.profile.update',
  actorId: userId,
  resource: 'user_profile',
  resourceId: profileId,
  metadata: {
    // ❌ DON'T: Log sensitive data directly
    // password: newPassword,
    // creditCard: cardNumber,
    
    // ✅ DO: Log non-sensitive context
    fieldsUpdated: ['firstName', 'lastName', 'preferences'],
    updateSource: 'user_dashboard',
    ipAddress: sanitizeIp(request.ip)
  }
});
```

### Data Encryption

```typescript
// For highly sensitive environments
const auditLogger = new AuditLogger({
  adapter: 'postgresql',
  encryption: {
    enabled: true,
    algorithm: 'aes-256-gcm',
    keyRotation: {
      enabled: true,
      intervalDays: 90
    }
  }
});
```

### Data Retention

```typescript
// Configure automatic data retention
const auditLogger = new AuditLogger({
  adapter: 'postgresql',
  retention: {
    // Keep audit logs for 7 years (financial compliance)
    defaultRetentionDays: 2555,
    // Different retention by event type
    retentionPolicies: {
      'user.login': 365,           // 1 year for login events
      'admin.config.change': 2555, // 7 years for admin changes
      'data.export': 2555,         // 7 years for data exports
      'security.breach': -1        // Never delete security incidents
    }
  }
});
```

## Access Control

### Role-Based Access Control (RBAC)

```typescript
// Define audit log access roles
const auditRoles = {
  // Can only view their own audit logs
  USER: ['read:own'],
  
  // Can view audit logs for their department
  MANAGER: ['read:department'],
  
  // Can view all audit logs except admin actions
  SECURITY_ANALYST: ['read:all', 'export:filtered'],
  
  // Can view all audit logs including admin actions
  SECURITY_ADMIN: ['read:all', 'export:all', 'delete:expired'],
  
  // Full access including configuration
  SYSTEM_ADMIN: ['read:all', 'write:config', 'delete:all']
};

// Implement access control middleware
export function auditAccessControl(requiredPermissions: string[]) {
  return async (req: NextRequest, res: NextResponse) => {
    const user = await getCurrentUser(req);
    const userPermissions = auditRoles[user.role] || [];
    
    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    return NextResponse.next();
  };
}
```

### API Route Protection

```typescript
// app/api/audit/logs/route.ts
import { auditAccessControl } from '@/lib/audit-access-control';

export async function GET(request: NextRequest) {
  // Verify access permissions
  const accessResult = await auditAccessControl(['read:all'])(request);
  if (accessResult.status === 403) {
    return accessResult;
  }
  
  // Additional filtering based on user context
  const user = await getCurrentUser(request);
  const filters: any = {};
  
  if (user.role === 'MANAGER') {
    filters.organizationId = user.organizationId;
  } else if (user.role === 'USER') {
    filters.actorId = user.id;
  }
  
  const logs = await auditLogger.query(filters);
  return NextResponse.json(logs);
}
```

## Supabase Security

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own audit logs
CREATE POLICY "users_read_own_logs" ON audit_logs
  FOR SELECT USING (
    auth.uid()::text = actor_id OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Managers can read logs from their organization
CREATE POLICY "managers_read_org_logs" ON audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'admin') AND
    auth.jwt() ->> 'org_id' = organization_id
  );

-- Security admins can read all logs
CREATE POLICY "security_admins_read_all" ON audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'system_admin')
  );

-- Only system can insert audit logs (no direct user access)
CREATE POLICY "system_insert_only" ON audit_logs
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Prevent any updates or deletes (immutable logs)
CREATE POLICY "no_modifications" ON audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "no_deletions" ON audit_logs
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'system_admin' AND
    created_at < NOW() - INTERVAL '7 years'
  );
```

### Supabase Auth Integration

```typescript
// Secure Supabase client configuration
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for audit logging
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'audit' // Use separate schema for audit logs
    }
  }
);

// Configure audit logger with secure Supabase connection
const auditLogger = new AuditLogger({
  adapter: 'postgresql',
  connection: {
    client: supabaseAdmin,
    table: 'audit_logs',
    schema: 'audit'
  }
});
```

### Real-time Security Monitoring

```typescript
// Monitor critical security events in real-time
const securityMonitor = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Subscribe to critical security events
securityMonitor
  .channel('security-events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'audit',
    table: 'audit_logs',
    filter: 'severity=eq.critical'
  }, (payload) => {
    // Trigger immediate security alert
    handleSecurityAlert(payload.new);
  })
  .subscribe();

async function handleSecurityAlert(auditLog: any) {
  // Send immediate notifications
  await Promise.all([
    sendSlackAlert(auditLog),
    sendEmailAlert(auditLog),
    logToSIEM(auditLog)
  ]);
}
```

## Compliance

### GDPR Compliance

```typescript
// GDPR-compliant audit logging
const auditLogger = new AuditLogger({
  adapter: 'postgresql',
  compliance: {
    gdpr: {
      enabled: true,
      // Right to be forgotten implementation
      dataSubjectDeletion: async (subjectId: string) => {
        // Anonymize instead of delete to maintain audit trail
        await auditLogger.anonymize({
          actorId: subjectId,
          replacements: {
            actorId: `[DELETED_USER_${Date.now()}]`,
            metadata: '[GDPR_DELETED]'
          }
        });
      },
      // Data export for subject access requests
      dataExport: async (subjectId: string) => {
        return await auditLogger.query({
          actorId: subjectId,
          format: 'json',
          includeMetadata: true
        });
      }
    }
  }
});
```

### SOX Compliance

```typescript
// Sarbanes-Oxley compliance features
const auditLogger = new AuditLogger({
  adapter: 'postgresql',
  compliance: {
    sox: {
      enabled: true,
      // Ensure immutability
      immutable: true,
      // Digital signatures for critical events
      digitalSignatures: {
        enabled: true,
        algorithm: 'RS256',
        keyRotationDays: 90
      },
      // Required retention period
      minimumRetentionYears: 7
    }
  }
});
```

## Monitoring & Alerting

### Critical Event Monitoring

```typescript
// Define critical security events
const criticalEvents = [
  'admin.user.privilege.escalation',
  'security.authentication.breach',
  'data.export.unauthorized',
  'system.configuration.change',
  'audit.log.tampering.attempt'
];

// Set up real-time monitoring
const monitor = new AuditMonitor({
  events: criticalEvents,
  alerting: {
    immediate: {
      slack: process.env.SECURITY_SLACK_WEBHOOK,
      email: ['security@company.com'],
      sms: ['+1234567890'] // For critical events
    },
    batch: {
      frequency: '5m',
      threshold: 10 // Alert if 10+ events in 5 minutes
    }
  }
});
```

### Anomaly Detection

```typescript
// Detect unusual patterns
const anomalyDetector = new AuditAnomalyDetector({
  patterns: [
    {
      name: 'unusual_login_times',
      description: 'Login outside normal hours',
      condition: (log) => {
        const hour = new Date(log.timestamp).getHours();
        return log.action === 'user.login' && (hour < 6 || hour > 22);
      }
    },
    {
      name: 'rapid_privilege_changes',
      description: 'Multiple privilege changes in short time',
      condition: (logs) => {
        const privilegeChanges = logs.filter(log => 
          log.action.includes('privilege') || log.action.includes('role')
        );
        return privilegeChanges.length > 5; // 5+ privilege changes
      },
      timeWindow: '1h'
    }
  ]
});
```

## Incident Response

### Audit Log Forensics

```typescript
// Forensic investigation tools
class AuditForensics {
  async investigateIncident(incidentId: string, timeWindow: { start: Date; end: Date }) {
    // Gather all related audit logs
    const logs = await auditLogger.query({
      timestamp: {
        gte: timeWindow.start,
        lte: timeWindow.end
      },
      orderBy: 'timestamp',
      include: ['metadata', 'context']
    });
    
    // Create forensic timeline
    const timeline = logs.map(log => ({
      timestamp: log.timestamp,
      actor: log.actorId,
      action: log.action,
      resource: `${log.resource}:${log.resourceId}`,
      impact: this.assessImpact(log),
      evidence: log.metadata
    }));
    
    // Generate forensic report
    return {
      incidentId,
      timeline,
      summary: this.generateSummary(timeline),
      recommendations: this.generateRecommendations(timeline)
    };
  }
  
  private assessImpact(log: any): 'low' | 'medium' | 'high' | 'critical' {
    if (log.action.includes('delete') || log.action.includes('privilege')) {
      return 'high';
    }
    if (log.action.includes('admin') || log.action.includes('security')) {
      return 'medium';
    }
    return 'low';
  }
}
```

### Evidence Preservation

```typescript
// Preserve evidence for legal/compliance purposes
class EvidencePreservation {
  async preserveEvidence(criteria: any, legalHoldId: string) {
    // Create immutable copy of relevant logs
    const evidence = await auditLogger.query(criteria);
    
    // Hash and sign evidence
    const evidenceHash = await this.hashEvidence(evidence);
    const signature = await this.signEvidence(evidenceHash);
    
    // Store in tamper-proof location
    await this.storeEvidence({
      legalHoldId,
      evidence,
      hash: evidenceHash,
      signature,
      preservationDate: new Date(),
      criteria
    });
    
    return { legalHoldId, evidenceHash, signature };
  }
}
```

## Security Checklist

### Implementation Checklist

- [ ] **Database Security**
  - [ ] Enable Row Level Security (RLS) on audit tables
  - [ ] Configure appropriate RLS policies
  - [ ] Use service role for audit logging operations
  - [ ] Separate audit schema from application data
  - [ ] Enable database encryption at rest

- [ ] **Access Control**
  - [ ] Implement role-based access control (RBAC)
  - [ ] Protect audit API endpoints with authentication
  - [ ] Limit audit log access based on user roles
  - [ ] Regular access reviews and audits

- [ ] **Data Protection**
  - [ ] Configure sensitive data sanitization
  - [ ] Implement field-level encryption for sensitive data
  - [ ] Set up data retention policies
  - [ ] Enable automatic data anonymization for GDPR

- [ ] **Monitoring**
  - [ ] Set up real-time monitoring for critical events
  - [ ] Configure anomaly detection
  - [ ] Implement alerting for security incidents
  - [ ] Regular security log reviews

- [ ] **Compliance**
  - [ ] Document data retention policies
  - [ ] Implement audit log immutability
  - [ ] Set up compliance reporting
  - [ ] Regular compliance audits

### Production Deployment Checklist

- [ ] **Environment Security**
  - [ ] Use environment variables for sensitive configuration
  - [ ] Enable HTTPS/TLS for all communications
  - [ ] Configure proper CORS policies
  - [ ] Use secrets management (e.g., HashiCorp Vault)

- [ ] **Network Security**
  - [ ] Configure firewall rules
  - [ ] Use VPC/private networks where possible
  - [ ] Enable audit logging for network access
  - [ ] Regular network security assessments

- [ ] **Backup & Recovery**
  - [ ] Regular encrypted backups of audit logs
  - [ ] Test backup restoration procedures
  - [ ] Disaster recovery plan for audit systems
  - [ ] Geographic backup distribution

### Ongoing Security Maintenance

- [ ] **Regular Updates**
  - [ ] Keep audit logging package updated
  - [ ] Regular security patches for dependencies
  - [ ] Update encryption keys regularly
  - [ ] Review and update security policies

- [ ] **Security Assessments**
  - [ ] Quarterly security reviews
  - [ ] Annual penetration testing
  - [ ] Code security audits
  - [ ] Compliance assessments

- [ ] **Incident Response**
  - [ ] Documented incident response procedures
  - [ ] Regular incident response drills
  - [ ] Forensic investigation capabilities
  - [ ] Legal evidence preservation procedures

## Additional Resources

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [GDPR Compliance Guidelines](https://gdpr.eu/)
- [SOX Compliance Requirements](https://www.sox-online.com/)

---

For questions about security implementation or to report security vulnerabilities, please contact our security team at security@99packages.com.