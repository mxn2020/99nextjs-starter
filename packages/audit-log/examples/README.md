# Audit Log Package Examples

This directory contains comprehensive examples demonstrating how to use the `@99packages/audit-log` package in various scenarios, with a focus on real-world use cases and best practices.

## 📁 Available Examples

### 1. Basic Next.js App (`basic-nextjs/`)
A simple Next.js application demonstrating:
- ✅ File-based audit logging (no database required)
- ✅ Next.js App Router with middleware integration
- ✅ React components for viewing audit logs
- ✅ API routes with automatic audit logging
- ✅ TypeScript integration and type safety

**Perfect for**: Getting started, development, and testing

### 2. Supabase Integration (`supabase-integration/`)
A complete Supabase-powered audit logging example:
- ✅ PostgreSQL adapter with Supabase
- ✅ Row Level Security (RLS) policies
- ✅ Real-time audit log monitoring
- ✅ Supabase Auth integration
- ✅ Multi-tenant organization support
- ✅ Edge Functions for advanced processing

**Perfect for**: Production applications, real-time features, multi-tenant SaaS

### 3. E-commerce Audit System (`ecommerce-audit/`)
Comprehensive e-commerce audit logging:
- ✅ Order lifecycle tracking
- ✅ Inventory change monitoring
- ✅ Payment and refund auditing
- ✅ Customer data access logging
- ✅ Admin action monitoring
- ✅ Compliance and fraud detection

**Perfect for**: E-commerce platforms, financial compliance

### 4. Enterprise Security Dashboard (`security-dashboard/`)
Advanced security monitoring and compliance:
- ✅ Critical event monitoring
- ✅ Real-time security alerts
- ✅ Compliance reporting (GDPR, SOX, HIPAA)
- ✅ Anomaly detection
- ✅ Forensic investigation tools
- ✅ Executive security dashboards

**Perfect for**: Enterprise applications, regulated industries

### 5. Multi-Database Setup (`multi-database/`)
Demonstrates multiple database adapters:
- ✅ PostgreSQL for primary audit storage
- ✅ MongoDB for analytics and reporting
- ✅ SQLite for local development
- ✅ File-based for backup and archival
- ✅ Cross-database querying and synchronization

**Perfect for**: Complex architectures, hybrid cloud setups

### 6. High-Performance API (`high-performance/`)
Optimized for high-throughput scenarios:
- ✅ Batching and queuing configuration
- ✅ Connection pooling and optimization
- ✅ Performance monitoring and metrics
- ✅ Load testing and benchmarks
- ✅ Auto-scaling strategies
- ✅ Memory and CPU optimization

**Perfect for**: High-traffic applications, microservices

### 7. Microservices Architecture (`microservices/`)
Distributed audit logging across microservices:
- ✅ Service-to-service audit propagation
- ✅ Distributed tracing integration
- ✅ Event sourcing patterns
- ✅ Message queue integration
- ✅ Cross-service correlation
- ✅ Docker and Kubernetes deployment

**Perfect for**: Microservices, distributed systems

### 8. React Native Mobile App (`react-native/`)
Mobile application audit logging:
- ✅ Offline audit log storage
- ✅ Sync with cloud when online
- ✅ Mobile-specific events (location, device info)
- ✅ Performance optimization for mobile
- ✅ Battery and data usage optimization

**Perfect for**: Mobile applications, offline-first apps

## 🚀 Quick Start Guide

### Option 1: Start with Basic Example
```bash
cd basic-nextjs
pnpm install
cp .env.example .env.local
pnpm dev
```

### Option 2: Supabase-Powered Example
```bash
cd supabase-integration
pnpm install
cp .env.example .env.local
# Add your Supabase credentials to .env.local
pnpm dev
```

### Option 3: Full-Featured E-commerce
```bash
cd ecommerce-audit
pnpm install
cp .env.example .env.local
pnpm setup:db  # Sets up demo data
pnpm dev
```

## 📋 Running Any Example

1. **Navigate to the example directory:**
   ```bash
   cd [example-name]
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up database (if required):**
   ```bash
   pnpm setup:db  # For database-backed examples
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Example Structure

Each example follows a consistent structure:

```
example-name/
├── README.md              # Detailed example documentation
├── package.json           # Dependencies and scripts
├── .env.example          # Environment template
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS setup
├── tsconfig.json         # TypeScript configuration
├── app/                  # Next.js App Router
│   ├── api/             # API routes with audit logging
│   ├── audit/           # Audit dashboard pages
│   └── components/      # Reusable audit components
├── lib/                 # Shared utilities
│   ├── audit.ts         # Audit logger configuration
│   ├── supabase.ts      # Database client setup
│   └── utils.ts         # Helper functions
├── docs/                # Example-specific documentation
├── migrations/          # Database setup scripts
└── tests/              # Example tests
```

## 📊 Feature Comparison

| Feature | Basic | Supabase | E-commerce | Security | Multi-DB | Performance | Microservices |
|---------|-------|----------|------------|----------|----------|-------------|---------------|
| **File Adapter** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **PostgreSQL** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Real-time** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Multi-tenant** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **React Components** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Security Features** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Performance Optimization** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Compliance Tools** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |

## 🎯 Choose Your Example

### For Learning and Development
- **Start with**: `basic-nextjs`
- **Then try**: `supabase-integration`

### For Production Applications
- **SaaS Applications**: `supabase-integration`
- **E-commerce**: `ecommerce-audit`
- **Enterprise**: `security-dashboard`
- **High Traffic**: `high-performance`

### For Specific Architectures
- **Microservices**: `microservices`
- **Multi-database**: `multi-database`
- **Mobile Apps**: `react-native`

## 📚 Additional Resources

- **Main Documentation**: [../README.md](../README.md)
- **Supabase Guide**: [../docs/SUPABASE.md](../docs/SUPABASE.md)
- **Security Best Practices**: [../docs/security-best-practices.md](../docs/security-best-practices.md)
- **Migration Guide**: [../docs/MIGRATION.md](../docs/MIGRATION.md)
- **API Reference**: [API Documentation](https://docs.99packages.com/audit-log)

## 💬 Getting Help

- **Discord Community**: [Join our Discord](https://discord.gg/99packages)
- **GitHub Issues**: [Report issues or ask questions](https://github.com/99packages/audit-log/issues)
- **Documentation**: [Full documentation](https://docs.99packages.com)

## Quick Start

The fastest way to get started is with the basic Next.js example:

```bash
cd basic-nextjs
pnpm install
pnpm dev
```

This uses the file-based adapter, so no database setup is required.

## Environment Variables

Each example includes an `.env.example` file with all required environment variables. Common variables include:

- `DATABASE_URL` - Database connection string
- `AUDIT_LOG_LEVEL` - Default audit level (low, medium, high, critical)
- `AUDIT_BATCH_SIZE` - Batch size for performance optimization
- `AUDIT_RETENTION_DAYS` - How long to keep audit logs

## Contributing

When adding new examples:

1. Create a new directory with a descriptive name
2. Include a complete `package.json` with dependencies
3. Add a detailed `README.md` explaining the example
4. Include `.env.example` with required environment variables
5. Add clear comments in the code
6. Test the example thoroughly

## Support

If you have questions about these examples or need help with your specific use case, please:

1. Check the main package documentation
2. Review the example that's closest to your needs
3. Open an issue in the main repository
