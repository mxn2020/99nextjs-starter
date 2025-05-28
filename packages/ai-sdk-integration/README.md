# AI SDK Integration

A comprehensive, production-ready AI integration package for Next.js applications with Supabase backend. This package provides a unified interface to multiple AI providers through the Vercel AI SDK, with built-in database persistence, usage tracking, and session management.

## 🌟 Features

### AI Capabilities
- **Text Generation**: Streaming and non-streaming text generation with conversation history
- **Image Generation**: AI-powered image creation with URL management and storage
- **Structured Object Generation**: Type-safe object generation from Zod schemas
- **AI Agent Framework**: Conversational agents with tool integration and session management

### Integration & Architecture
- **Vercel AI SDK Integration**: Unified interface to OpenAI, Anthropic, Google, and other providers
- **Supabase Backend**: Complete database schema with Row Level Security (RLS)
- **Server Actions First**: All AI operations run securely on the server
- **TypeScript Support**: Full type safety with comprehensive type definitions
- **Usage Tracking**: Built-in logging and analytics for AI operations

### Developer Experience
- **React Hooks**: Client-side hooks for seamless UI integration
- **Error Handling**: Comprehensive error management and logging
- **Flexible Configuration**: Environment-based or programmatic configuration
- **Database Integration**: Uses the `@99packages/database` package for Supabase clients

## 📋 Prerequisites

- **Supabase Project**: With user management structure (`auth.users`, `public.users`, `public.accounts`)
- **AI Provider Keys**: Environment variables for chosen providers (e.g., `OPENAI_API_KEY`)
- **Database Package**: The `@99packages/database` package must be available in your monorepo
- **Next.js 14+**: With App Router support

## 🚀 Quick Start

### 1. Installation

In your monorepo, the package is already available. Install the peer dependencies:

```bash
pnpm add ai @ai-sdk/openai @ai-sdk/anthropic zod
```

### 2. Database Setup

Run the provided Supabase migrations:

```bash
# Copy migrations to your Supabase project
cp packages/ai-sdk-integration/supabase/migrations/* supabase/migrations/
supabase db push
```

### 3. Environment Configuration

```bash
# .env.local
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
# Add other provider keys as needed
```

### 4. Basic Usage

#### Server Actions

```typescript
// app/ai-demo/actions.ts
import { generateTextAction, generateImageAction } from '@99packages/ai-sdk-integration';

export async function handleTextGeneration(prompt: string, accountId: string) {
  return await generateTextAction({
    prompt,
    accountId,
    modelId: 'gpt-4o'
  });
}

export async function handleImageGeneration(prompt: string, accountId: string) {
  return await generateImageAction({
    prompt,
    accountId,
    modelId: 'dall-e-3',
    size: '1024x1024'
  });
}
```

#### Client Components

```typescript
// app/ai-demo/components/ChatDemo.tsx
'use client';

import { useAIAssistant } from '@99packages/ai-sdk-integration';
import { useState } from 'react';

export function ChatDemo({ agentId, accountId }: { agentId: string; accountId: string }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const { isLoading, error, sendMessage } = useAIAssistant({
    agentId,
    accountId,
    onMessage: (message) => setMessages(prev => [...prev, message])
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 p-2 border rounded"
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </form>
      
      {error && <div className="text-red-500">Error: {error}</div>}
    </div>
  );
}
```
    "use server";
    const prompt = formData.get('prompt') as string;
    const accountId = formData.get('accountId') as string; // Ensure you pass this
    // In a real app, accountId might come from session or context
    if (!prompt || !accountId) return { error: "Prompt and Account ID are required" };

    const result = await generateTextAction({ prompt, accountId, modelId: 'gpt-4o' });
    // Handle result (stream or data)
    console.log(result);
    return result;
  };

  // ...
}
```

### Client Hooks

Use client hooks within your client components to interact with AI features.

```typescript
// Example: app/some-feature/components/ChatComponent.tsx
'use client';
import { useAIAssistant } from '@your-org/ai-sdk-integration/client/hooks/useAIAssistant';
import { createSupabaseBrowserClient } from '@your-org/supabase-clients'; // Example import

export function ChatComponent({ agentId, accountId }: { agentId: string, accountId: string }) {
  const supabase = createSupabaseBrowserClient(); // Or however you get your client
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useAIAssistant({
    agentId,
    accountId,
    // You'll need to pass a function that calls your server action for running the agent
    // This is because useChat/useCompletion directly call an API route or server action
    // For a more robust solution, this hook could internally use `useActionState` or similar
    // or you can adapt this to be more like Vercel's `useChat` that takes an `api` endpoint.
    // For now, let's assume `handleSubmit` would internally call a server action.
    // This part needs refinement based on how Vercel's useChat expects to call the backend.
    // A common pattern is to have an API route.
  });

  // ... render chat UI ...
}
```

*TODO: Refine `useAIAssistant` and other client hooks to better integrate with Next.js Server Actions or recommend an API route pattern for use with Vercel AI SDK's `useChat`/`useCompletion`.*

## 📚 API Reference

### Server Actions

#### Text Generation

```typescript
generateTextAction(params: GenerateTextParams): Promise<ActionResponse<GenerateTextResult>>
streamTextAction(params: GenerateTextParams): Promise<ActionResponse<{ stream: ReadableStream }>>
```

**Parameters:**
- `prompt: string` - The text prompt for generation
- `accountId: string` - UUID of the account for tracking
- `modelId?: string` - AI model identifier (e.g., 'gpt-4o', 'claude-3-opus')
- `history?: Array<{ role: 'user' | 'assistant', content: string }>` - Conversation history

#### Image Generation

```typescript
generateImageAction(params: GenerateImageParams): Promise<ActionResponse<GenerateImageResult>>
```

**Parameters:**
- `prompt: string` - Description of the image to generate
- `accountId: string` - UUID of the account for tracking
- `modelId?: string` - Image model identifier (e.g., 'dall-e-3')
- `size?: string` - Image dimensions ('1024x1024', '1792x1024', etc.)
- `n?: number` - Number of images to generate (1-4)

#### Object Generation

```typescript
generateObjectAction<T extends ZodSchema>(
  params: GenerateObjectParams<T>
): Promise<ActionResponse<GenerateObjectResult<z.infer<T>>>>
```

**Parameters:**
- `prompt: string` - Instructions for object generation
- `schema: T` - Zod schema defining the expected structure
- `accountId: string` - UUID of the account for tracking
- `modelId?: string` - AI model identifier

#### Agent Operations

```typescript
runAgentAction(params: AgentRunParams): Promise<ActionResponse<AgentRunResult>>
createAgentSessionAction(params: CreateAgentSessionParams): Promise<ActionResponse<{ sessionId: string }>>
```

### Client Hooks

#### useAIAssistant

```typescript
const {
  messages,
  input,
  isLoading,
  error,
  sendMessage,
  handleInputChange,
  clearMessages
} = useAIAssistant({
  agentId: string,
  accountId: string,
  sessionId?: string,
  onMessage?: (message: AIAgentMessage) => void,
  onError?: (error: string) => void
});
```

## 🗄️ Database Schema

The package includes comprehensive database migrations for Supabase:

### Core Tables

- **`ai_prompts`**: Stores user prompts with account linking
- **`ai_generated_contents`**: Stores AI-generated content (text, images, objects)
- **`ai_usage_logs`**: Tracks API usage and costs
- **`ai_agents`**: Agent configurations and personalities
- **`ai_agent_sessions`**: Conversation session management
- **`ai_agent_messages`**: Individual messages in agent conversations

### Key Features

- **Row Level Security (RLS)**: Account-based access control
- **UUID Primary Keys**: Using `gen_random_uuid()` for performance
- **JSONB Storage**: Flexible metadata and structured content storage
- **Audit Trails**: Comprehensive logging with timestamps
- **Foreign Key Constraints**: Data integrity and cascading deletes

## 🔧 Advanced Configuration

### Custom AI Providers

```typescript
// lib/ai-config.ts
import { OpenAI } from '@ai-sdk/openai';
import { Anthropic } from '@ai-sdk/anthropic';

export const providers = {
  openai: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL, // For proxies
  }),
  anthropic: new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
};

export const models = {
  'gpt-4o': providers.openai.chat('gpt-4o'),
  'claude-3-opus': providers.anthropic.chat('claude-3-opus-20240229'),
} as const;
```

### Agent Configuration

```typescript
// Agent configuration in database
const agentConfig = {
  name: "Research Assistant",
  description: "Helps with research and analysis",
  system_prompt: "You are a helpful research assistant...",
  model_id: "gpt-4o",
  tools: ["web_search", "calculator"],
  settings: {
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 1.0
  }
};
```

### Custom Database Types

If your app has custom database schemas, you can extend the types:

```typescript
// types/database.ts
import type { Database as BaseDatabase } from '@99packages/database/types';

interface CustomTables {
  // Your custom tables
  custom_ai_workflows: {
    Row: { id: string; name: string; /* ... */ };
    Insert: { name: string; /* ... */ };
    Update: { name?: string; /* ... */ };
  };
}

export interface Database extends BaseDatabase {
  public: BaseDatabase['public'] & {
    Tables: BaseDatabase['public']['Tables'] & CustomTables;
  };
}

// Use with Supabase client
const supabase = createSupabaseServerClient<Database>();
```

## 🛠️ Development Guide

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Building the Package

```bash
# Build TypeScript
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Database Development

```bash
# Create new migration
supabase migration new add_ai_feature

# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset
```

## 🔍 Troubleshooting

### Common Issues

#### Missing AI Provider Keys
```bash
Error: OpenAI API key not found
```
**Solution**: Ensure `OPENAI_API_KEY` is set in your environment variables.

#### Database Connection Issues
```bash
Error: Failed to store prompt
```
**Solution**: Check Supabase connection and ensure migrations are applied.

#### Type Errors with Custom Database
```bash
Type 'unknown' is not assignable to type 'Database'
```
**Solution**: Ensure you're importing and using the correct Database type.

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
DEBUG=ai-sdk-integration:*

// Or in code
import { setDebugMode } from '@99packages/ai-sdk-integration/utils';
setDebugMode(true);
```

## 📈 Performance Optimization

### Caching Strategies

```typescript
// Redis caching for frequent prompts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache prompt results
const cacheKey = `ai:prompt:${hash(prompt)}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

const result = await generateTextAction(params);
await redis.setex(cacheKey, 3600, result); // Cache for 1 hour
```

### Database Indexing

Ensure proper indexes are in place:

```sql
-- Add to your migrations
CREATE INDEX IF NOT EXISTS idx_ai_prompts_account_id ON ai_prompts(account_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_contents_prompt_id ON ai_generated_contents(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_account_created ON ai_usage_logs(account_id, created_at);
```

## 🔐 Security Best Practices

### Input Validation

All inputs are validated using Zod schemas:

```typescript
const promptSchema = z.object({
  prompt: z.string().min(1).max(10000),
  accountId: z.string().uuid(),
  modelId: z.string().optional(),
});
```

### Rate Limiting

Implement rate limiting for AI operations:

```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

const { success } = await ratelimit.limit(accountId);
if (!success) {
  throw new Error('Rate limit exceeded');
}
```

### Content Filtering

Add content filtering for generated content:

```typescript
const result = await generateTextAction(params);

// Check for inappropriate content
const isAppropriate = await moderateContent(result.data.text);
if (!isAppropriate) {
  // Handle inappropriate content
  throw new Error('Generated content violates policy');
}
```

## 🤝 Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables
4. Run migrations: `supabase db push`
5. Start development: `pnpm dev`

### Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Use conventional commits
- Ensure RLS policies are properly configured

## 📄 License

This package is part of the monorepo and follows the same license terms.

## 🆘 Support

- **Documentation**: Check this README and inline code documentation
- **Issues**: Create issues in the monorepo repository
- **Discord**: Join the community Discord for real-time help
- **Examples**: See the `examples/` directory for implementation patterns

---

Built with ❤️ for the Next.js and Supabase ecosystem.
