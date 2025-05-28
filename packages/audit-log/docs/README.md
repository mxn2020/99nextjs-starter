# Documentation Index

Welcome to the comprehensive documentation for `@99packages/audit-log`. This index provides an overview of all available documentation and guides to help you implement enterprise-grade audit logging.

## 🚀 Getting Started

Start here if you're new to the audit log package:

1. **[Main README](../README.md)** - Overview, installation, and quick start guide
2. **[Supabase Integration Guide](./SUPABASE.md)** - Complete Supabase setup and configuration
3. **[Examples Overview](../examples/README.md)** - Working code examples for different use cases

## 📚 Core Documentation

### API & Technical Reference
- **[API Reference](./API_REFERENCE.md)** - Complete API documentation with TypeScript interfaces
- **[Performance & Benchmarking](./PERFORMANCE.md)** - Performance optimization and benchmarking tools
- **[Security Best Practices](./security-best-practices.md)** - Security guidelines and compliance

### Implementation Guides
- **[Supabase Integration](./SUPABASE.md)** - Detailed Supabase setup, RLS policies, and real-time features
- **[Migration Guide](./MIGRATION.md)** - Migrate from other logging solutions and databases
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues, debugging, and solutions

## 🛠️ Development & Contribution

- **[Contributing Guide](../CONTRIBUTING.md)** - Development setup, testing, and contribution guidelines
- **[Changelog](../CHANGELOG.md)** - Version history, breaking changes, and migration notes

## 📖 Examples & Tutorials

### Basic Examples
- **[Basic Next.js](../examples/basic-nextjs/)** - Simple file-based audit logging
- **[Supabase Integration](../examples/supabase-integration/)** - Full Supabase implementation

### Advanced Examples
- **[E-commerce Audit](../examples/ecommerce-audit/)** - Order and inventory tracking
- **[Security Dashboard](../examples/security-dashboard/)** - Real-time security monitoring
- **[Multi-Database](../examples/multi-database/)** - Multiple database adapters
- **[High Performance](../examples/high-performance/)** - Optimized for high-volume applications

### Specialized Examples
- **[Microservices](../examples/microservices/)** - Distributed audit logging
- **[React Native](../examples/react-native/)** - Mobile application audit logging

## 🗄️ Database Documentation

### Supported Databases
- **PostgreSQL/Supabase** - [Schema](../migrations/postgresql/) | [Adapter Documentation](./API_REFERENCE.md#postgresql-adapter)
- **MySQL/MariaDB** - [Schema](../migrations/mysql/) | [Adapter Documentation](./API_REFERENCE.md#mysql-adapter)
- **MongoDB** - [Schema](../migrations/mongodb/) | [Adapter Documentation](./API_REFERENCE.md#mongodb-adapter)
- **SQLite** - [Schema](../migrations/sqlite/) | [Adapter Documentation](./API_REFERENCE.md#sqlite-adapter)
- **File Storage** - [Configuration](./API_REFERENCE.md#file-adapter)

## 🎨 UI Component Documentation

### React Components
- **[AuditTable](./API_REFERENCE.md#audittable)** - Sortable, filterable audit log table
- **[AuditDashboard](./API_REFERENCE.md#auditdashboard)** - Real-time analytics dashboard
- **[AuditFilters](./API_REFERENCE.md#auditfilters)** - Advanced filtering interface
- **[AuditEventDetails](./API_REFERENCE.md#auditeventdetails)** - Detailed event viewer

### React Hooks
- **[useAuditEvents](./API_REFERENCE.md#useauditevents)** - Event fetching and real-time updates
- **[useAuditStats](./API_REFERENCE.md#useauditstats)** - Audit statistics and analytics
- **[useAuditLogger](./API_REFERENCE.md#useauditlogger)** - Logger instance management
- **[useRealtimeAuditEvents](./API_REFERENCE.md#userealtimeauditevents)** - Real-time subscriptions

## 🔧 Configuration & Setup

### Quick Configuration Examples

#### Supabase Setup
```typescript
import { createAuditLogger, PostgreSQLAdapter } from '@99packages/audit-log';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseKey);
const logger = createAuditLogger({
  adapter: new PostgreSQLAdapter({ client: supabase })
});
```

#### High-Performance Setup
```typescript
const logger = createAuditLogger({
  adapter: new PostgreSQLAdapter({
    client: supabase,
    batchSize: 200,
    flushInterval: 1000,
    enableCompression: true
  }),
  enableBatching: true,
  enableAsync: true
});
```

#### Development Setup
```typescript
const logger = createAuditLogger({
  adapter: new FileAdapter({ directory: './audit-logs' }),
  enableBatching: false, // Immediate writes for debugging
  debug: true
});
```

## 🔒 Security & Compliance

### Compliance Frameworks
- **[GDPR Compliance](./security-best-practices.md#gdpr-compliance)** - Data protection and privacy
- **[SOX Compliance](./security-best-practices.md#sox-compliance)** - Financial audit trails
- **[HIPAA Compliance](./security-best-practices.md#hipaa-compliance)** - Healthcare data protection

### Security Features
- **[Data Sanitization](./security-best-practices.md#data-protection)** - PII protection and redaction
- **[Row Level Security](./SUPABASE.md#security-configuration)** - Supabase RLS policies
- **[Access Control](./security-best-practices.md#access-control)** - Role-based permissions
- **[Monitoring & Alerts](./security-best-practices.md#monitoring--alerting)** - Security incident detection

## 📊 Performance & Monitoring

### Performance Optimization
- **[Benchmarking Tools](./PERFORMANCE.md#benchmarking-tools)** - Measure and compare performance
- **[Database Optimization](./PERFORMANCE.md#database-performance)** - Indexing and query optimization
- **[Memory Management](./PERFORMANCE.md#memory-management)** - Memory-efficient configurations
- **[Monitoring Setup](./PERFORMANCE.md#monitoring--metrics)** - Health checks and metrics

### Troubleshooting
- **[Common Issues](./TROUBLESHOOTING.md#common-issues)** - Frequently encountered problems
- **[Database Issues](./TROUBLESHOOTING.md#database-specific-issues)** - Database-specific troubleshooting
- **[Performance Issues](./TROUBLESHOOTING.md#performance-issues)** - Performance debugging
- **[Development Issues](./TROUBLESHOOTING.md#development-issues)** - Development environment problems

## 🔄 Migration & Updates

### Migration Scenarios
- **[From Custom Solutions](./MIGRATION.md#migrating-from-custom-audit-solutions)** - Migrate from existing audit systems
- **[From Logging Libraries](./MIGRATION.md#migrating-from-logging-libraries)** - Winston, Pino, Bunyan migration
- **[Database Migration](./MIGRATION.md#database-migration)** - Move between database systems
- **[Version Updates](../CHANGELOG.md)** - Upgrade between package versions

## 📞 Support & Community

### Getting Help
1. **Check Documentation** - Search this documentation first
2. **Review Examples** - Look at relevant example implementations
3. **GitHub Issues** - Report bugs or request features
4. **GitHub Discussions** - Ask questions and share knowledge

### Contributing
- **[Development Setup](../CONTRIBUTING.md#development-setup)** - Get started with development
- **[Testing Guide](../CONTRIBUTING.md#testing)** - Running and writing tests
- **[Code Style](../CONTRIBUTING.md#code-style)** - Coding standards and conventions
- **[Pull Request Process](../CONTRIBUTING.md#submitting-changes)** - Contributing changes

## 📈 Roadmap & Future Plans

See the [Changelog](../CHANGELOG.md#roadmap) for planned features and improvements.

---

## Quick Links

### Most Common Tasks
- [Set up with Supabase](./SUPABASE.md#quick-setup)
- [Add React components](./API_REFERENCE.md#react-components)
- [Configure performance](./PERFORMANCE.md#performance-optimization)
- [Troubleshoot issues](./TROUBLESHOOTING.md#quick-diagnostics)
- [Migrate existing logs](./MIGRATION.md#migration-strategies)

### Popular Examples
- [E-commerce audit system](../examples/ecommerce-audit/)
- [Real-time security dashboard](../examples/security-dashboard/)
- [Multi-tenant SaaS application](../examples/supabase-integration/)

---

**Need help?** Check our [Troubleshooting Guide](./TROUBLESHOOTING.md) or create an issue on GitHub.
