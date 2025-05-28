import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import DiscordProvider from 'next-auth/providers/discord';
import CredentialsProvider from 'next-auth/providers/credentials';
import { nextAuthConfig } from './config';
import type { NextAuthOptions } from 'next-auth';
// TODO: This needs to be customized based on your specific requirements
const authOptions: NextAuthOptions = {
    secret: nextAuthConfig.secret,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                // TODO: Implement credential validation logic
                // This could integrate with your user database
                if (credentials?.email && credentials?.password) {
                    // Validate credentials against your database
                    const user = {
                        id: '1',
                        email: credentials.email,
                        name: 'User',
                    };
                    return user;
                }
                return null;
            },
        }),
    ],
    pages: nextAuthConfig.pages,
    callbacks: nextAuthConfig.callbacks,
    session: nextAuthConfig.session,
};
export const createNextAuthHandler = () => NextAuth(authOptions);
export const nextAuthHandler = createNextAuthHandler();
