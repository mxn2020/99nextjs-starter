import type { AuthConfig } from '../../types';
export interface BasicAuthOptions extends Partial<AuthConfig> {
    users?: BasicAuthUser[];
    usersEnvVar?: string;
    storage?: 'localStorage' | 'sessionStorage' | 'memory';
    storageKey?: string;
    sessionTimeout?: number;
}
export interface BasicAuthUser {
    username: string;
    password: string; // hashed with bcrypt
    name?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    metadata?: Record<string, any>;
}
export interface BasicAuthSession {
    username: string;
    user: BasicAuthUser;
    loginTime: number;
    lastActivity: number;
}
