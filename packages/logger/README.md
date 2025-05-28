# @99packages/logger

A comprehensive, production-ready logging and error handling package built specifically for Next.js applications. Features advanced logging capabilities, structured error handling, type-safe API handlers, and React error boundaries.

## Features

- 🚀 **High-Performance Logging** - Built on Pino with minimal overhead
- 🎨 **Beautiful Console Output** - Emoji support and colorized logs
- 🔧 **Flexible Configuration** - Multiple transports, custom formatters
- 🛡️ **Type-Safe Error Handling** - Hierarchical error classes with full TypeScript support
- 📡 **Smart API Handlers** - Request validation, authentication, and automatic error responses
- ⚡ **React Error Boundaries** - Client-side error catching and recovery
- 🔒 **Security-First** - Automatic PII redaction and sensitive data masking
- 📊 **Performance Monitoring** - Built-in timing utilities and request metrics
- 🏗️ **Monorepo-Friendly** - Designed for scalable application architectures

## Installation

```bash
npm install @99packages/logger
# or
pnpm add @99packages/logger
# or
yarn add @99packages/logger
```

### Dependencies

The package uses these peer dependencies (automatically installed in Next.js projects):

```bash
# Required for React error boundaries
npm install react

# Required for API handlers
npm install next
```

## Quick Start

### Basic Logging

```typescript
import { logger } from '@99packages/logger';

// Simple logging with emoji support
logger.info('🚀 Application started');
logger.debug('User data', { userId: 123, action: 'login' });
logger.error('Database connection failed', new Error('Connection timeout'));

// With performance timing
const timer = logger.time('database-query');
await performDatabaseQuery();
timer(); // Logs: "⏱️ database-query completed in 125ms"
```

### API Route with Validation

```typescript
import { createApiHandler } from '@99packages/logger/handlers';
import { z } from 'zod';

export const POST = createApiHandler({
  method: 'POST',
  auth: true,
  schema: {
    body: z.object({
      email: z.string().email(),
      name: z.string().min(2),
    }),
  },
}, async (request, context) => {
  // context.body is fully typed and validated
  const user = await createUser(context.body);
  
  return {
    success: true,
    data: user,
  };
});
```

### Error Boundary Setup

```typescript
import { ErrorBoundary } from '@99packages/logger/boundaries';

export default function Layout({ children }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={reset}>Try again</button>
        </div>
      )}
      onError={(error) => {
        // Send to error tracking service
        console.error('Boundary caught:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Core Components

### 1. Advanced Logger

#### Configuration

```typescript
import { createLogger } from '@99packages/logger';

const logger = createLogger({
  name: 'my-app',
  level: 'info',
  useEmoji: true,
  prettyPrint: process.env.NODE_ENV !== 'production',
  context: {
    service: 'auth-service',
    version: '1.2.0',
    environment: process.env.NODE_ENV,
  },
  redact: ['password', 'token', 'secret'], // Auto-redact sensitive fields
});
```

#### Logging Methods

```typescript
// Basic logging levels
logger.trace('Very detailed debug info');
logger.debug('Debug information', { details: 'extra context' });
logger.info('General information');
logger.warn('Warning message');
logger.error('Error occurred', new Error('Something went wrong'));
logger.fatal('Critical system error');

// Contextual logging
logger.setContext({ userId: 123, sessionId: 'abc-xyz' });
logger.info('User action performed'); // Includes context automatically

// Child loggers (inherit parent context)
const requestLogger = logger.child({
  requestId: 'req-456',
  endpoint: '/api/users'
});
requestLogger.info('Request started');
```

#### Performance Monitoring

```typescript
// Simple timing
const timer = logger.time('operation-name');
await performOperation();
timer(); // Logs completion time

// Advanced performance monitoring
import { measurePerformance } from '@99packages/logger/utils';

const result = await measurePerformance(
  () => expensiveOperation(),
  'expensive-operation'
);
```

### 2. Error Handling System

#### HTTP Errors

```typescript
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError
} from '@99packages/logger/errors';

// Throw structured errors
throw new NotFoundError('User not found', {
  context: { userId: 123 },
  code: 'USER_NOT_FOUND'
});

// With additional metadata
throw new BadRequestError('Invalid email format', {
  context: { 
    email: 'invalid-email',
    field: 'email'
  },
  details: {
    validationRules: ['must be valid email format']
  }
});
```

#### Validation Errors

```typescript
import { ValidationException } from '@99packages/logger/errors';

throw new ValidationException([
  { field: 'email', message: 'Invalid email format', code: 'INVALID_EMAIL' },
  { field: 'password', message: 'Must be at least 8 characters', code: 'WEAK_PASSWORD' }
]);
```

#### Database Errors

```typescript
import { 
  DatabaseError,
  ConnectionError,
  QueryError,
  TransactionError
} from '@99packages/logger/errors';

throw new ConnectionError('Failed to connect to database', {
  context: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    attempts: 3
  }
});
```

#### Custom Base Errors

```typescript
import { BaseError } from '@99packages/logger/errors';

class PaymentError extends BaseError {
  constructor(message: string, paymentId: string) {
    super(message, {
      code: 'PAYMENT_FAILED',
      context: { paymentId },
      statusCode: 402
    });
  }
}
```

### 3. API Handlers

#### Complete API Handler Example

```typescript
import { createApiHandler } from '@99packages/logger/handlers';
import { z } from 'zod';

export const PUT = createApiHandler({
  method: 'PUT',
  auth: async (request) => {
    // Custom auth logic
    const token = request.headers.get('authorization');
    return validateToken(token);
  },
  schema: {
    body: z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }),
    query: z.object({
      userId: z.string().uuid(),
    }),
  },
  rateLimit: {
    requests: 10,
    window: 60000, // 1 minute
  },
}, async (request, context) => {
  // Fully typed context
  const { body, query, user, requestId } = context;
  
  const updatedUser = await updateUser(query.userId, body);
  
  return {
    success: true,
    data: updatedUser,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
});
```

#### Async Wrapper for Non-API Functions

```typescript
import { asyncWrapper } from '@99packages/logger/handlers';

const safeUserCreation = asyncWrapper(async (userData: UserData) => {
  // Any errors thrown here will be properly logged and re-thrown
  return await createUser(userData);
});
```

### 4. React Error Boundaries

#### Basic Error Boundary

```typescript
import { ErrorBoundary } from '@99packages/logger/boundaries';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

#### Custom Fallback UI

```typescript
<ErrorBoundary
  fallback={(error, reset) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 mt-2">{error.message}</p>
        <button 
          onClick={reset}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Try Again
        </button>
      </div>
    </div>
  )}
  onError={(error, errorInfo) => {
    // Send to error tracking
    sendToErrorTracking(error, errorInfo);
  }}
>
  <MyApp />
</ErrorBoundary>
```

## Advanced Configuration

### Multiple Transports

```typescript
import { createLogger } from '@99packages/logger';

const logger = createLogger({
  name: 'production-app',
  level: 'info',
  transports: [
    {
      type: 'console',
      options: { colorize: true }
    },
    {
      type: 'file',
      options: { 
        path: './logs/app.log',
        level: 'warn' // Only log warnings and errors to file
      }
    },
    {
      type: 'http',
      options: {
        url: 'https://logs.example.com/ingest',
        headers: {
          'Authorization': 'Bearer token'
        }
      }
    }
  ]
});
```

### Environment-Based Configuration

```typescript
const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

const logger = createLogger({
  name: process.env.SERVICE_NAME || 'app',
  level: (process.env.LOG_LEVEL as LogLevel) || (isDev ? 'debug' : 'info'),
  prettyPrint: isDev,
  useEmoji: isDev,
  enabled: !isTest, // Disable logging in tests
  context: {
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
    service: process.env.SERVICE_NAME,
  },
});
```

## Best Practices

### 1. Structured Logging

Always include relevant context:

```typescript
// ❌ Poor logging
logger.info('User updated');

// ✅ Better logging
logger.info('User profile updated', {
  userId: user.id,
  changedFields: ['email', 'name'],
  requestId: context.requestId,
});
```

### 2. Error Context

Provide actionable context in errors:

```typescript
// ❌ Poor error handling
throw new Error('Update failed');

// ✅ Better error handling
throw new DatabaseError('Failed to update user profile', {
  context: {
    userId: user.id,
    operation: 'UPDATE',
    table: 'users',
    query: updateQuery,
  },
  details: {
    retryable: true,
    suggestedAction: 'Check database connection and retry',
  },
});
```

### 3. Security

Never log sensitive information:

```typescript
// ❌ Security risk
logger.info('User login', { 
  email: user.email, 
  password: user.password // Never log passwords!
});

// ✅ Secure logging
logger.info('User login attempt', {
  userId: user.id,
  email: redactEmail(user.email), // user@***.com
  timestamp: new Date().toISOString(),
});
```

## Environment Variables

Configure the logger using environment variables:

```env
# Basic configuration
LOG_LEVEL=info
LOG_EMOJI=true
LOG_ENABLED=true

# Service information
SERVICE_NAME=my-app
APP_VERSION=1.0.0

# Transport configuration
LOG_FILE_PATH=./logs/app.log
LOG_HTTP_URL=https://logs.example.com/ingest
LOG_HTTP_TOKEN=your-api-token
```

## API Reference

### Logger Methods

- `trace(message, ...args)` - Trace level logging
- `debug(message, ...args)` - Debug level logging
- `info(message, ...args)` - Info level logging
- `warn(message, ...args)` - Warning level logging
- `error(message, error?, context?)` - Error level logging
- `fatal(message, ...args)` - Fatal level logging
- `setContext(context)` - Set global context
- `child(context)` - Create child logger with additional context
- `time(label)` - Start performance timer

### Error Classes

#### HTTP Errors
- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `TooManyRequestsError` (429)
- `InternalServerError` (500)

#### Database Errors
- `DatabaseError` - Base database error
- `ConnectionError` - Connection failures
- `QueryError` - Query execution errors
- `TransactionError` - Transaction failures

#### Validation Errors
- `ValidationException` - Schema validation errors

### Utilities

- `measurePerformance(fn, label)` - Performance monitoring
- `createErrorResponse(error, includeStack?)` - Error response formatting
- `redactSensitiveData(data, fields?)` - Data sanitization
- `parseStackTrace(error)` - Stack trace parsing

## Integration Examples

### Next.js Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@99packages/logger';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  logger.setContext({ requestId });
  logger.info('Request started', {
    method: request.method,
    url: request.url,
  });

  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  
  const duration = Date.now() - start;
  logger.info('Request completed', { duration });

  return response;
}
```

### Database Integration

```typescript
import { logger } from '@99packages/logger';
import { DatabaseError } from '@99packages/logger/errors';

class DatabaseService {
  async query<T>(sql: string, params: any[]): Promise<T> {
    const timer = logger.time('db-query');
    
    try {
      const result = await this.db.query(sql, params);
      timer();
      return result;
    } catch (error) {
      timer();
      throw new DatabaseError('Query execution failed', {
        context: { sql: sql.substring(0, 100), params: params.length },
        cause: error as Error,
      });
    }
  }
}
```

This comprehensive logger and error handling package provides everything you need for production-ready logging, error handling, and monitoring in Next.js applications. The package is fully typed, tree-shakeable, and designed specifically for modern web applications with support for both server and client environments.