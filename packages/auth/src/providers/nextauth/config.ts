import type { NextAuthOptions } from './types';
export const nextAuthConfig: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        {
            id: 'google',
            name: 'Google',
            type: 'oauth',
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: 'openid email profile',
                },
            },
        },
        {
            id: 'github',
            name: 'GitHub',
            type: 'oauth',
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
        {
            id: 'discord',
            name: 'Discord',
            type: 'oauth',
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
        },
        {
            id: 'credentials',
            name: 'Credentials',
            type: 'credentials',
            options: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
        },
    ],
    pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            return true; // Allow sign in
        },
        async redirect({ url, baseUrl }) {
            return url.startsWith(baseUrl) ? url : baseUrl;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub!;
                session.user.roles = token.roles as string[] || [];
                session.user.permissions = token.permissions as string[] || [];
            }
            return session;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.roles = user.roles || [];
                token.permissions = user.permissions || [];
            }
            return token;
        },
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    redirects: {
        signIn: '/auth/signin',
        signUp: '/auth/signup',
        signOut: '/',
        afterSignIn: '/dashboard',
        afterSignUp: '/dashboard',
    },
};
