import type { AuthConfig } from '../../types';
export interface NextAuthOptions extends Partial<AuthConfig> {
    secret?: string;
    providers?: NextAuthProviderConfig[];
    pages?: {
        signIn?: string;
        signOut?: string;
        error?: string;
        verifyRequest?: string;
        newUser?: string;
    };
    callbacks?: {
        signIn?: (params: any) => boolean | Promise<boolean>;
        redirect?: (params: any) => string | Promise<string>;
        session?: (params: any) => any | Promise<any>;
        jwt?: (params: any) => any | Promise<any>;
    };
    session?: {
        strategy?: 'jwt' | 'database';
        maxAge?: number;
        updateAge?: number;
    };
    jwt?: {
        secret?: string;
        maxAge?: number;
        encode?: (params: any) => string | Promise<string>;
        decode?: (params: any) => any | Promise<any>;
    };
    database?: string;
    debug?: boolean;
}
export interface NextAuthProviderConfig {
    id: string;
    name: string;
    type: 'oauth' | 'email' | 'credentials';
    clientId?: string;
    clientSecret?: string;
    authorization?: string | Record<string, any>;
    token?: string | Record<string, any>;
    userinfo?: string | Record<string, any>;
    profile?: (profile: any) => any;
    options?: Record<string, any>;
}
