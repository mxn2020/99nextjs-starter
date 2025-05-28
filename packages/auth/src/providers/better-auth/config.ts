import type { BetterAuthOptions } from './types';
export const betterAuthConfig: BetterAuthOptions = {
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') || ['http://localhost:3000'],
    database: {
        provider: 'postgresql',
        url: process.env.DATABASE_URL,
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 8,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        },
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID || '',
            clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    redirects: {
        signIn: '/auth/signin',
        signUp: '/auth/signup',
        signOut: '/',
        afterSignIn: '/dashboard',
        afterSignUp: '/dashboard',
    },
};
