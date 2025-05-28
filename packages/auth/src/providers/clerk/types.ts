import type { AuthConfig } from '../../types';
export interface ClerkAuthOptions extends Partial<AuthConfig> {
    publishableKey?: string;
    secretKey?: string;
    afterSignInUrl?: string;
    afterSignUpUrl?: string;
    signInUrl?: string;
    signUpUrl?: string;
    appearance?: {
        theme?: any;
        variables?: Record<string, string>;
        elements?: Record<string, any>;
    };
    localization?: any;
    allowedRedirectOrigins?: string[];
    isSatellite?: boolean;
    domain?: string;
    signInFallbackRedirectUrl?: string;
    signUpFallbackRedirectUrl?: string;
}
