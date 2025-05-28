import type { AuthConfig } from '../../types';
export interface JWTAuthOptions extends Partial<AuthConfig> {
    jwtSecret?: string;
    jwtExpiresIn?: string;
    refreshExpiresIn?: string;
    apiUrl?: string;
    storage?: 'localStorage' | 'sessionStorage' | 'cookie';
    storageKey?: string;
    refreshStorageKey?: string;
}
export interface JWTTokenPayload {
    sub: string;
    email?: string;
    name?: string;
    roles?: string[];
    permissions?: string[];
    iat?: number;
    exp?: number;
}
export interface JWTAuthResponse {
    user: any;
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
}
