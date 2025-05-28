import type { JWTAuthOptions } from './types';
export const jwtAuthConfig: JWTAuthOptions = {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    storage: 'localStorage',
    storageKey: 'auth-token',
    refreshStorageKey: 'refresh-token',
    redirects: {
        signIn: '/auth/signin',
        signUp: '/auth/signup',
        signOut: '/',
        afterSignIn: '/dashboard',
        afterSignUp: '/dashboard',
    },
};
