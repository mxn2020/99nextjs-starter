# AI SDK Integration Examples

This directory contains practical examples showing how to use the AI SDK Integration package in real applications.

## Examples Overview

### Basic Examples
- **[Text Generation](./basic-text-generation.tsx)**: Simple text generation with streaming support
- **[Image Generation](./basic-image-generation.tsx)**: Creating AI images with different providers
- **[Object Generation](./structured-objects.tsx)**: Type-safe object generation with Zod schemas

### Advanced Examples
- **[AI Chat Interface](./chat-interface.tsx)**: Complete chat UI with agent support
- **[Custom Agent](./custom-agent.tsx)**: Building and deploying custom AI agents
- **[Batch Processing](./batch-processing.ts)**: Handling multiple AI operations efficiently
- **[Usage Analytics](./usage-analytics.tsx)**: Monitoring and analyzing AI usage

### Integration Examples
- **[Next.js App Router](./nextjs-app-router/)**: Complete Next.js application example
- **[API Routes](./api-routes.ts)**: Using AI SDK with Next.js API routes
- **[Middleware Integration](./middleware-example.ts)**: Rate limiting and authentication
- **[Database Patterns](./database-patterns.ts)**: Advanced database usage patterns

### Production Examples
- **[Error Handling](./error-handling.tsx)**: Comprehensive error management
- **[Caching Strategies](./caching-example.ts)**: Performance optimization with caching
- **[Security Patterns](./security-example.ts)**: Input validation and content filtering
- **[Monitoring](./monitoring-setup.ts)**: Logging and observability

## Getting Started

1. **Choose an example** that matches your use case
2. **Copy the code** into your application
3. **Install dependencies** as shown in each example
4. **Configure environment variables** for your AI providers
5. **Customize** the example for your specific needs

## Example Structure

Each example includes:
- **Complete code** with TypeScript types
- **Installation instructions** for dependencies
- **Environment configuration** requirements
- **Usage documentation** and best practices
- **Error handling** patterns
- **Testing examples** where applicable

## Common Patterns

### Error Handling
All examples follow consistent error handling patterns:

```typescript
const result = await generateTextAction(params);

if (result.error) {
  // Handle error appropriately
  console.error('AI operation failed:', result.error);
  return;
}

// Use result.data safely
const { text, contentId } = result.data;
```

### Type Safety
Examples demonstrate proper TypeScript usage:

```typescript
import type { GenerateTextParams, GenerateTextResult } from '@99packages/ai-sdk-integration';

const params: GenerateTextParams = {
  prompt: 'Your prompt here',
  accountId: 'uuid-here',
  modelId: 'gpt-4o',
};
```

### Database Integration
Shows proper Supabase integration:

```typescript
import { createSupabaseServerClient } from '@99packages/database/supabase/server';

const supabase = createSupabaseServerClient();
// Client is ready to use with full type safety
```

## Contributing Examples

To add a new example:

1. Create a new file in the appropriate category
2. Follow the existing naming convention
3. Include comprehensive documentation
4. Add error handling and type safety
5. Update this README with the new example
6. Test the example thoroughly

## Support

If you need help with any example:
- Check the main [README](../README.md) for detailed API documentation
- Review the [Migration Guide](../MIGRATION.md) for setup help
- Look at similar examples for patterns
- Create an issue if you find problems or need new examples
