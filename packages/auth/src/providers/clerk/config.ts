import type { ClerkAuthOptions } from './types';
export const clerkAuthConfig: ClerkAuthOptions = {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
    signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
    signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
    afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
    afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
    appearance: {
        theme: undefined, // Can be customized
        variables: {
            colorPrimary: '#000000',
        },
    },
    allowedRedirectOrigins: ['http://localhost:3000'],
    redirects: {
        signIn: '/sign-in',
        signUp: '/sign-up',
        signOut: '/',
        afterSignIn: '/dashboard',
        afterSignUp: '/dashboard',
    },
};
