# Basic Next.js Audit Log Example

This example demonstrates the basic usage of `@99packages/audit-log` in a Next.js application using the file-based adapter for simplicity.

## Features Demonstrated

- ✅ File-based audit logging (no database required)
- ✅ Next.js middleware integration
- ✅ React components for viewing audit logs
- ✅ API routes with automatic audit logging
- ✅ Custom audit events
- ✅ Real-time audit dashboard

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## What This Example Shows

### 1. Automatic API Audit Logging
- All API requests are automatically logged via middleware
- Captures request/response details, timing, and user context
- Configurable audit levels based on route patterns

### 2. Manual Audit Events
- Custom audit events for business actions
- User registration, profile updates, data exports
- Resource-specific logging

### 3. Audit Dashboard
- Real-time view of audit events
- Filtering and search capabilities
- Event details and statistics

### 4. File-Based Storage
- Logs stored in `./audit-logs/` directory
- JSON Lines format for easy parsing
- Automatic file rotation and compression

## File Structure

```
basic-nextjs/
├── package.json
├── next.config.js
├── tsconfig.json
├── .env.example
├── middleware.ts          # Audit middleware setup
├── app/
│   ├── layout.tsx
│   ├── page.tsx          # Home page with examples
│   ├── audit/
│   │   └── page.tsx      # Audit dashboard
│   └── api/
│       ├── audit/
│       │   ├── events/
│       │   │   └── route.ts
│       │   └── stats/
│       │       └── route.ts
│       ├── users/
│       │   └── route.ts  # Example API with audit logging
│       └── profile/
│           └── route.ts  # Another example API
├── components/
│   ├── AuditDashboard.tsx
│   ├── ExampleActions.tsx
│   └── Navigation.tsx
└── lib/
    └── audit.ts          # Audit logger configuration
```

## Environment Variables

```env
# Audit Log Configuration
AUDIT_LOG_DIRECTORY=./audit-logs
AUDIT_LOG_LEVEL=medium
AUDIT_BATCH_SIZE=10
AUDIT_FLUSH_INTERVAL=5000

# Application
NEXT_PUBLIC_APP_NAME=Basic Audit Example
```

## API Endpoints

### Audit APIs
- `GET /api/audit/events` - Retrieve audit events with filtering
- `GET /api/audit/stats` - Get audit statistics and metrics

### Example APIs (with automatic audit logging)
- `GET /api/users` - List users
- `POST /api/users` - Create user (triggers audit event)
- `PUT /api/profile` - Update profile (triggers audit event)

## Usage Examples

### Viewing Audit Logs
1. Navigate to [/audit](http://localhost:3000/audit)
2. Use filters to search specific events
3. Click on events to see detailed information

### Triggering Audit Events
1. Use the example actions on the home page
2. Call the API endpoints directly
3. Watch the audit dashboard update in real-time

### Custom Audit Events
```typescript
import { auditLogger } from '@/lib/audit';

// Log a custom business event
await auditLogger.log({
  action: 'data.export',
  actor: {
    id: 'user123',
    type: 'user',
    name: 'John Doe'
  },
  resource: {
    id: 'customer-data',
    type: 'dataset'
  },
  metadata: {
    exportFormat: 'csv',
    recordCount: 1500
  }
});
```

## Next Steps

After exploring this basic example, consider:

1. **PostgreSQL Example** - For production-ready database storage
2. **Multi-tenant Example** - For SaaS applications
3. **High-Performance Example** - For high-traffic applications
4. **Security Monitoring Example** - For compliance and security

## Troubleshooting

### Common Issues

1. **Permission denied for audit-logs directory**
   ```bash
   mkdir -p ./audit-logs
   chmod 755 ./audit-logs
   ```

2. **Audit events not appearing**
   - Check the console for errors
   - Verify middleware is properly configured
   - Ensure audit log directory is writable

3. **Performance issues**
   - Increase `AUDIT_BATCH_SIZE` for higher throughput
   - Decrease `AUDIT_FLUSH_INTERVAL` for more responsive logging

## Learn More

- [Main Package Documentation](../../README.md)
- [File Adapter Documentation](../../src/adapters/file/README.md)
- [React Components Documentation](../../src/ui/README.md)
- [Next.js Middleware Documentation](../../src/middleware/README.md)
