
// --- Server Actions ---
export * from './server/actions/text';
export * from './server/actions/image';
export * from './server/actions/object';
export * from './server/actions/agent';

// --- Client Hooks ---
// TODO: Implement client hooks (e.g., useAIAssistant)
// These hooks would typically use Vercel AI SDK's useChat/useCompletion or similar,
// and internally call the server actions or dedicated API routes.
// For now, this is a placeholder as UI components are out of scope for file generation,
// but the hooks are part of the package's offering.
export * from './client/hooks/useAIAssistant'; // Placeholder

// --- Types and Schemas ---
export * from './lib/types';
export * from './lib/zod-schemas';

// --- Utilities (if any are meant for public consumption) ---
// export * from './lib/utils/some-public-util';

// Note: Supabase client setup (server/browser) is expected to be provided by another package.
// This package uses functions like `createSupabaseServerClient()` which should be resolvable
// in the target monorepo (e.g., via path aliases or direct import from the supabase-clients package).
