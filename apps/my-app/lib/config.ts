// src/lib/config.ts - Environment validation
function validateEnvVar(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

export const config = {
  supabase: {
    url: validateEnvVar('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: validateEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: validateEnvVar('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
    storageKey: process.env.SUPABASE_STORAGE_KEY || 'sb-99nextjs-auth-token-storage-key',
  },
  app: {
    url: validateEnvVar('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL),
  },
  oauth: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
} as const;

// Validate critical environment variables on startup
if (typeof window === 'undefined') {
  try {
    config.supabase.url;
    config.supabase.anonKey;
    config.app.url;
    console.log('✅ Environment variables validated successfully');
    console.log(`📦 Using storage key: ${config.supabase.storageKey}`);
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}