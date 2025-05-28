import type { AuthConfig } from '../../types';
export interface BetterAuthOptions extends Partial<AuthConfig> {
    baseURL?: string;
    secret?: string;
    trustedOrigins?: string[];
    database?: {
        provider: 'sqlite' | 'mysql' | 'postgresql';
        url?: string;
    };
    emailAndPassword?: {
        enabled?: boolean;
        requireEmailVerification?: boolean;
        minPasswordLength?: number;
    };
    socialProviders?: {
        google?: {
            clientId: string;
            clientSecret: string;
        };
        github?: {
            clientId: string;
            clientSecret: string;
        };
        discord?: {
            clientId: string;
            clientSecret: string;
        };
    };
    session?: {
        expiresIn?: number;
        updateAge?: number;
    };
}
export interface BetterAuthUser {
    id: string;
    email: string;
    name?: string;
    image?: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: any;
}
export interface BetterAuthSession {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
}
