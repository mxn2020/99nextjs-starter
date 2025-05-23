
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getBaseUrl() {
    if (typeof window !== 'undefined') return ''; // browser should use relative url
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    // Assume https for Vercel deployments if not specified
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3099'; // default for local development
}

// Add other utility functions as needed
// e.g., date formatting, string manipulation etc.
