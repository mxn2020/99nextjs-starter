import { SupabaseUser } from "../providers/supabase/types";

export interface User {
    id: string;
    email?: string;
    name?: string;
    avatar?: string;
    roles?: string[];
    permissions?: string[];
    metadata?: Record<string, any>;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}
export interface SignInOptions {
    email?: string;
    username?: string;
    password: string;
    remember?: boolean;
    redirectTo?: string;
}
export interface SignUpOptions {
    email: string;
    password: string;
    name?: string;
    username?: string;
    account_type?: 'personal' | 'team' | 'family' | 'enterprise';
    email_confirmed_at?: string;
    metadata?: Record<string, any>;
    redirectTo?: string;
}
export interface OAuthSignInOptions {
    provider: 'google' | 'github' | 'discord' | 'facebook' | 'twitter' | 'apple';
    redirectTo?: string;
    scopes?: string[];
}
export interface AuthSession {
    user: User;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
}
export interface AuthConfig {
    provider: AuthProviderType;
    options?: Record<string, any>;
    redirects?: {
        signIn: string;
        signUp: string;
        signOut: string;
        afterSignIn: string;
        afterSignUp: string;
    };
}
export type AuthProviderType =
    | 'supabase'
    | 'nextauth'
    | 'jwt'
    | 'basic'
    | 'better-auth'
    | 'clerk';

export interface AuthProviderInterface {
    signIn(options: SignInOptions): Promise<AuthResult>;
    signUp(options: SignUpOptions): Promise<AuthResult>;
    signOut(): Promise<void>;
    getUser(): Promise<User | null>;
    getSession(): Promise<AuthSession | null>;
    refreshToken?(): Promise<AuthResult>;
    signInWithOAuth?(options: OAuthSignInOptions): Promise<AuthResult>;
    resetPassword?(email: string): Promise<void>;
    updateUser?(updates: Partial<User>): Promise<User>;
    deleteUser?(): Promise<void>;
}
export interface AuthResult {
    user?: User | SupabaseUser;
    session?: AuthSession;
    error?: AuthErrorInterface;
    needsVerification?: boolean;
    redirectTo?: string;
}
export interface AuthErrorInterface {
    code: string;
    message: string;
    details?: any;
}
export interface AuthHookResult extends AuthState {
    signIn: (options: SignInOptions) => Promise<AuthResult>;
    signUp: (options: SignUpOptions) => Promise<AuthResult>;
    signOut: () => Promise<void>;
    signInWithOAuth?: (options: OAuthSignInOptions) => Promise<AuthResult>;
    resetPassword?: (email: string) => Promise<void>;
    updateUser?: (updates: Partial<User>) => Promise<User>;
    refreshToken?: () => Promise<AuthResult>;
}
export interface AuthGuardOptions {
    fallback?: React.ComponentType;
    loading?: React.ComponentType;
    requiredRole?: string | string[];
    requiredPermissions?: string | string[];
    redirectTo?: string;
}
export interface RoleBasedAccess {
    roles: string[];
    permissions: string[];
}
export interface JWTPayload {
    sub: string;
    email?: string;
    name?: string;
    roles?: string[];
    permissions?: string[];
    iat?: number;
    exp?: number;
}
export interface BasicAuthUser {
    username: string;
    password: string; // hashed
    name?: string;
    roles?: string[];
}
export interface AuthMiddlewareConfig {
    provider: AuthProviderType;
    protectedRoutes?: string[];
    publicRoutes?: string[];
    redirects?: {
        signIn?: string;
        signOut?: string;
        afterSignIn?: string;
        afterSignOut?: string;
    };
    roleChecks?: Record<string, string[]>;
    onboardingCheck?: {
        enabled: boolean;
        redirectTo: string;
        excludePaths?: string[];
    };
    redirectTo?: string;
    afterSignIn?: string;
    ignoredRoutes?: string[];
}
export interface AuthApiOptions {
    provider?: AuthProviderType;
    requireAuth?: boolean;
    requiredRole?: string | string[];
    requiredPermissions?: string | string[];
}
