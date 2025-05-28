import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */

// Content Security Policy
// Basic CSP, further refinement needed based on actual scripts, styles, and connections.
// const ContentSecurityPolicy = `
//   default-src 'self';
//   script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-insights.com *.supabase.co;
//   style-src 'self' 'unsafe-inline';
//   img-src * blob: data:;
//   media-src 'none';
//   connect-src *;
//   font-src 'self';
//   object-src 'none';
//   base-uri 'self';
//   form-action 'self';
//   frame-ancestors 'none';
//   upgrade-insecure-requests;
// `;
// Note: 'unsafe-eval' and 'unsafe-inline' should be avoided if possible.
// Supabase might require specific domains for connect-src (e.g., YOUR_PROJECT_ID.supabase.co).
// Vercel analytics/speed insights also require specific domains.

const nextConfig: NextConfig = {
  transpilePackages: [
    "@99packages/auth",
    "@99packages/audit-log",
    "@99packages/database",
    "@99packages/logger",
    "@99packages/ui"
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  eslint: {
    //ignoreDuringBuilds: true,
  },
  // reactStrictMode: true, // Already default in Next.js 13+
  // experimental: {
  //   serverActions: true, // Already default and stable in Next.js 14+
  // },
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
  //         },
  //         {
  //           key: 'X-Content-Type-Options',
  //           value: 'nosniff',
  //         },
  //         {
  //           key: 'X-Frame-Options',
  //           value: 'DENY',
  //         },
  //         {
  //           key: 'X-XSS-Protection',
  //           value: '1; mode=block',
  //         },
  //          {
  //           key: 'Referrer-Policy',
  //           value: 'strict-origin-when-cross-origin'
  //         },
  //         {
  //           key: 'Permissions-Policy',
  //           value: "camera=(), microphone=(), geolocation=(), payment=()" // Adjust as needed
  //         }
  //       ],
  //     },
  //   ];
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Allow images from your Supabase storage bucket
        // Add specific project ID if known: e.g., hostname: 'yourprojectid.supabase.co'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1', // Allow images from local Supabase instance
        port: '54391', // The port your local Supabase is running on
      },
      {
        protocol: 'https',
        hostname: '99nextjs-starter.vercel.app', // Allow images from this Vercel app
      },
      {
        protocol: 'http',
        hostname: '99nextjs-starter.coder-verse.io', // Allow images from this CoderVerse app
      },
      // Add other image sources if needed
    ],
  },
};

export default nextConfig;