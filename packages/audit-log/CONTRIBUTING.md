# Contributing Guide

Thank you for your interest in contributing to `@99packages/audit-log`! This guide will help you get started with development, testing, and submitting contributions.

## 📋 Table of Contents

- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Project Structure](#-project-structure)
- [Development Workflow](#-development-workflow)
- [Testing](#-testing)
- [Code Style](#-code-style)
- [Submitting Changes](#-submitting-changes)
- [Release Process](#-release-process)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: Latest version (recommended package manager)
- **Git**: For version control
- **TypeScript**: Knowledge of TypeScript is essential
- **Database**: Access to PostgreSQL, MySQL, MongoDB, or SQLite for testing

### Quick Start

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/99nextjs-starter-2.git
   cd 99nextjs-starter-2/packages/audit-log
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Build the Package**
   ```bash
   pnpm build
   ```

4. **Run Tests**
   ```bash
   pnpm test
   ```

## 🛠️ Development Setup

### Environment Configuration

Create a `.env.local` file in the audit-log package directory:

```bash
# Supabase (for testing PostgreSQL adapter)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# PostgreSQL (alternative to Supabase)
DATABASE_URL=postgresql://user:password@localhost:5432/audit_test

# MongoDB (for testing MongoDB adapter)
MONGODB_URI=mongodb://localhost:27017/audit_test

# MySQL (for testing MySQL adapter)
MYSQL_URI=mysql://user:password@localhost:3306/audit_test

# SQLite (for testing SQLite adapter)
SQLITE_PATH=./test.db
```

### Database Setup

#### PostgreSQL/Supabase
```sql
-- Create test database and table
CREATE DATABASE audit_test;
\\c audit_test;

-- Run the migration script
\\i ./migrations/postgresql/001_create_audit_logs.sql
```

#### MongoDB
```bash
# Start MongoDB locally
mongod --dbpath ./data/db

# Create test database (auto-created on first use)
```

#### MySQL
```sql
-- Create test database
CREATE DATABASE audit_test;
USE audit_test;

-- Run the migration script
SOURCE ./migrations/mysql/001_create_audit_logs.sql;
```

### IDE Setup

#### VS Code (Recommended)

Install recommended extensions:
- TypeScript and JavaScript Language Features
- Prettier - Code formatter
- ESLint
- Jest Runner
- GitLens

#### Settings

Add to your `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 📁 Project Structure

```
packages/audit-log/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── types/                   # TypeScript type definitions
│   │   ├── audit.ts            # Core audit types
│   │   └── adapters.ts         # Adapter interfaces
│   ├── schemas/                 # Zod validation schemas
│   │   └── audit.ts            # Event validation
│   ├── lib/                     # Core library code
│   │   ├── logger.ts           # Main AuditLogger class
│   │   ├── query.ts            # Query builder
│   │   └── health.ts           # Health monitoring
│   ├── adapters/               # Database adapters
│   │   ├── postgresql/         # PostgreSQL/Supabase adapter
│   │   ├── mysql/              # MySQL adapter
│   │   ├── mongodb/            # MongoDB adapter
│   │   ├── sqlite/             # SQLite adapter
│   │   └── file/               # File-based adapter
│   ├── ui/                     # React components
│   │   ├── components/         # UI components
│   │   ├── hooks/              # Component-specific hooks
│   │   └── types.ts            # UI type definitions
│   ├── hooks/                  # React hooks
│   │   ├── useAuditEvents.ts   # Event management hook
│   │   ├── useAuditStats.ts    # Statistics hook
│   │   └── useAuditLogger.ts   # Logger hook
│   ├── middleware/             # Next.js middleware
│   │   └── index.ts            # Audit middleware
│   ├── utils/                  # Utility functions
│   │   ├── helpers.ts          # General helpers
│   │   ├── sanitize.ts         # Data sanitization
│   │   └── validation.ts       # Additional validation
│   ├── benchmark/              # Performance testing
│   │   └── index.ts            # Benchmark utilities
│   └── __tests__/              # Test files
│       ├── unit/               # Unit tests
│       ├── integration/        # Integration tests
│       └── e2e/                # End-to-end tests
├── docs/                       # Documentation
├── examples/                   # Example implementations
├── migrations/                 # Database migrations
└── scripts/                    # Build and utility scripts
```

## 🔄 Development Workflow

### 1. Creating a New Feature

```bash
# Create a new branch
git checkout -b feature/new-feature-name

# Make your changes
# ... develop feature ...

# Run tests
pnpm test

# Build to check for compilation errors
pnpm build

# Commit changes
git add .
git commit -m "feat: add new feature description"
```

### 2. Adding a New Database Adapter

```typescript
// 1. Create adapter directory
mkdir src/adapters/newdb

// 2. Implement adapter interface
// src/adapters/newdb/adapter.ts
import type { AuditAdapter, AuditEvent, AuditFilter } from '../../types/audit.js';

export class NewDBAdapter implements AuditAdapter {
  async log(event: AuditEvent): Promise<void> {
    // Implementation
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    // Implementation
  }

  async getHealth(): Promise<HealthStatus> {
    // Implementation
  }

  async close(): Promise<void> {
    // Implementation
  }
}

// 3. Add tests
// src/__tests__/unit/adapters/newdb.test.ts

// 4. Add to exports
// src/adapters/index.ts
export { NewDBAdapter } from './newdb/adapter.js';

// 5. Update documentation
// Update README.md and create adapter-specific docs
```

### 3. Adding React Components

```tsx
// 1. Create component file
// src/ui/components/NewComponent.tsx
import React from 'react';
import type { AuditEvent } from '../../types/audit.js';

interface NewComponentProps {
  events: AuditEvent[];
  onEventSelect?: (event: AuditEvent) => void;
}

export const NewComponent: React.FC<NewComponentProps> = ({
  events,
  onEventSelect
}) => {
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
};

// 2. Add to exports
// src/ui/index.ts
export { NewComponent } from './components/NewComponent.js';

// 3. Create tests
// src/__tests__/unit/ui/NewComponent.test.tsx

// 4. Add Storybook story (if applicable)
// src/ui/stories/NewComponent.stories.tsx
```

### 4. Working with React Hooks

```typescript
// 1. Create hook file
// src/hooks/useNewHook.ts
import { useState, useEffect } from 'react';
import type { AuditLogger } from '../lib/logger.js';

export const useNewHook = (logger: AuditLogger) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hook implementation

  return { data, loading, error };
};

// 2. Add to exports
// src/hooks/index.ts
export { useNewHook } from './useNewHook.js';

// 3. Create tests
// src/__tests__/unit/hooks/useNewHook.test.ts
```

## 🧪 Testing

### Test Structure

We use **Jest** for testing with the following categories:

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test adapter integrations and component interactions
- **E2E Tests**: Test complete workflows

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/__tests__/unit/logger.test.ts

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage

# Run integration tests (requires database setup)
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

### Writing Tests

#### Unit Test Example

```typescript
// src/__tests__/unit/logger.test.ts
import { createAuditLogger } from '../../lib/logger.js';
import { FileAdapter } from '../../adapters/file/adapter.js';

describe('AuditLogger', () => {
  let logger: AuditLogger;
  let adapter: FileAdapter;

  beforeEach(() => {
    adapter = new FileAdapter({ directory: './test-logs' });
    logger = createAuditLogger({ adapter });
  });

  afterEach(async () => {
    await logger.close();
    // Cleanup test files
  });

  it('should log an audit event', async () => {
    const event = {
      actor: { type: 'user', id: 'test-user' },
      action: 'create',
      resource: { type: 'post', id: 'post-123' }
    };

    await expect(logger.log(event)).resolves.not.toThrow();
  });

  it('should query audit events', async () => {
    // Setup test data
    await logger.log(/* test event */);

    const events = await logger.query()
      .where('action', '=', 'create')
      .limit(10)
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('create');
  });
});
```

#### Integration Test Example

```typescript
// src/__tests__/integration/postgresql.test.ts
import { createClient } from '@supabase/supabase-js';
import { PostgreSQLAdapter } from '../../adapters/postgresql/adapter.js';

describe('PostgreSQL Adapter Integration', () => {
  let adapter: PostgreSQLAdapter;
  let supabase: any;

  beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    adapter = new PostgreSQLAdapter({ client: supabase });
    
    // Setup test data
    await supabase.from('audit_logs').delete().neq('id', 0);
  });

  afterAll(async () => {
    await adapter.close();
  });

  it('should connect to PostgreSQL', async () => {
    const health = await adapter.getHealth();
    expect(health.healthy).toBe(true);
  });

  it('should insert and retrieve events', async () => {
    const event = {
      actor: { type: 'user', id: 'test-user' },
      action: 'create',
      resource: { type: 'post', id: 'post-123' },
      timestamp: new Date(),
      context: {},
      metadata: {}
    };

    await adapter.log(event);

    const events = await adapter.query({
      where: { action: 'create' },
      limit: 10
    });

    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('create');
  });
});
```

### Test Configuration

#### Jest Config

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
};
```

#### Test Setup

```typescript
// src/__tests__/setup.ts
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  // Setup global test state
});

afterAll(() => {
  // Cleanup global test state
});
```

## 🎨 Code Style

### TypeScript Standards

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use explicit return types for public functions
- Avoid `any` type, use `unknown` if necessary

```typescript
// ✅ Good
interface AuditEventData {
  readonly id: string;
  readonly timestamp: Date;
  readonly action: string;
}

function processEvent(event: AuditEventData): Promise<void> {
  // Implementation
}

// ❌ Avoid
function processEvent(event: any) {
  // Implementation
}
```

### Naming Conventions

- **Files**: kebab-case (`audit-logger.ts`)
- **Classes**: PascalCase (`AuditLogger`)
- **Functions/Variables**: camelCase (`createLogger`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_BATCH_SIZE`)
- **Types/Interfaces**: PascalCase (`AuditEvent`)

### Code Organization

```typescript
// File structure order:
// 1. Imports (external libraries first, then internal)
// 2. Types and interfaces
// 3. Constants
// 4. Main implementation
// 5. Exports

import { z } from 'zod';
import type { AuditAdapter } from '../types/audit.js';

interface LoggerOptions {
  adapter: AuditAdapter;
  enableBatching?: boolean;
}

const DEFAULT_BATCH_SIZE = 100;

export class AuditLogger {
  // Implementation
}

export { AuditLogger };
```

### ESLint Configuration

```javascript
// eslint.config.js
module.exports = {
  extends: [
    '@99packages/eslint-config/base',
    '@99packages/eslint-config/typescript'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    'prefer-const': 'error'
  }
};
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

## 📤 Submitting Changes

### Pull Request Process

1. **Prepare Your Changes**
   ```bash
   # Ensure all tests pass
   pnpm test
   
   # Check linting
   pnpm lint
   
   # Build successfully
   pnpm build
   
   # Update documentation if needed
   pnpm docs:build
   ```

2. **Commit Message Format**
   
   Use [Conventional Commits](https://conventionalcommits.org/):
   
   ```
   type(scope): description
   
   [optional body]
   
   [optional footer]
   ```
   
   Examples:
   ```
   feat(adapters): add Redis adapter support
   fix(postgresql): resolve connection pooling issue
   docs(api): update AuditLogger documentation
   test(hooks): add tests for useAuditEvents hook
   refactor(types): improve type safety for audit events
   ```

3. **Create Pull Request**
   
   - Use a clear, descriptive title
   - Reference any related issues
   - Include a detailed description of changes
   - Add screenshots for UI changes
   - Ensure CI checks pass

### Pull Request Template

```markdown
## Description
Brief description of the changes and why they're needed.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Documentation updated (if applicable)
- [ ] No new warnings or errors introduced
- [ ] Breaking changes documented
```

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Workflow

1. **Version Bump**
   ```bash
   # Update version in package.json
   pnpm version patch|minor|major
   ```

2. **Generate Changelog**
   ```bash
   # Update CHANGELOG.md with new changes
   pnpm changelog
   ```

3. **Create Release**
   ```bash
   # Tag and push
   git push --follow-tags
   
   # Publish to npm (automated via CI)
   pnpm publish
   ```

### Release Notes Template

```markdown
## [1.2.0] - 2024-01-15

### Added
- New Redis adapter for caching audit events
- Real-time audit event streaming with WebSockets
- Advanced filtering options in AuditTable component

### Changed
- Improved PostgreSQL adapter performance by 40%
- Updated React hooks to use concurrent features
- Enhanced TypeScript types for better developer experience

### Fixed
- Fixed memory leak in batch processing
- Resolved React hydration issues with server-side rendering
- Fixed timezone handling in audit timestamps

### Breaking Changes
- `AuditAdapter.query()` now returns a Promise instead of sync result
- Removed deprecated `enableLegacyMode` option
```

---

## 🤝 Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Follow the code of conduct
- Share knowledge and best practices
- Provide constructive feedback

Thank you for contributing to `@99packages/audit-log`! Your contributions help make this package better for everyone.
