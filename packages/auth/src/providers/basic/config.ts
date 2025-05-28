import bcrypt from 'bcryptjs';
import type { BasicAuthOptions, BasicAuthUser } from './types';
// Parse users from environment variable if provided
function parseUsersFromEnv(): BasicAuthUser[] {
    const usersEnv = process.env.BASIC_AUTH_USERS;
    if (!usersEnv) return [];
    try {
        // Format: username:hashedpassword,username2:hashedpassword2
        return usersEnv.split(',').map(userStr => {
            const [username, password] = userStr.split(':');

            if (!username || !password) {
                throw new Error('Invalid user format in BASIC_AUTH_USERS');
            }
            
            return {
                username: username.trim(),
                password: password.trim(),
                roles: ['user'],
            };
        });
    } catch {
        return [];
    }
}
export const basicAuthConfig: BasicAuthOptions = {
    users: parseUsersFromEnv(),
    usersEnvVar: 'BASIC_AUTH_USERS',
    storage: 'localStorage',
    storageKey: 'basic-auth-session',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    redirects: {
        signIn: '/auth/signin',
        signUp: '/auth/signup',
        signOut: '/',
        afterSignIn: '/dashboard',
        afterSignUp: '/dashboard',
    },
};
// Helper function to hash password for setup
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}
// Helper function to create a basic auth user
export async function createBasicAuthUser(
    username: string,
    password: string,
    options: Partial<BasicAuthUser> = {}
): Promise<BasicAuthUser> {
    return {
        username,
        password: await hashPassword(password),
        name: options.name,
        email: options.email,
        roles: options.roles || ['user'],
        permissions: options.permissions || [],
        metadata: options.metadata || {},
    };
}
