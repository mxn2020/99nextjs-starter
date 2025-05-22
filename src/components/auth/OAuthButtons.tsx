
"use client";

import { loginWithOAuth } from '@/server/auth.actions';
import { Button } from '@/components/ui/button';
// Assuming you have icons for GitHub and Google
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { toast } from 'sonner';

export default function OAuthButtons({ redirectTo, isSignUp = false }: { redirectTo?: string, isSignUp?: boolean }) {
    const handleOAuth = async (provider: 'github' | 'google') => {
        const result = await loginWithOAuth(provider, redirectTo); // Server action handles redirect
        if (result?.error) {
            toast.error(`OAuth Error: ${ result.error }`);
        }
    };

    const buttonText = isSignUp ? "Sign up with" : "Continue with";

    return (
        <div className="space-y-3">
            <Button
                variant="outline"
                className="w-full"
                onClick={() => handleOAuth('github')}
            >
                <FaGithub className="mr-2 h-5 w-5" /> {buttonText} GitHub
            </Button>
            <Button
                variant="outline"
                className="w-full"
                onClick={() => handleOAuth('google')}
            >
                <FaGoogle className="mr-2 h-5 w-5" /> {buttonText} Google
            </Button>
        </div>
    );
}
