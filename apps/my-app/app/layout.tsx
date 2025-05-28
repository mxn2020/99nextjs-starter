
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "@99packages/ui/globals.css"
import './fog-effects.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthUserProvider } from '@/hooks/useUser'; // Import AuthUserProvider
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '99NextJS-Starter',
  description: 'Full-stack monorepo template with NextJS and Supabase Authentication.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthUserProvider> {/* Wrap with AuthUserProvider */}
            {children}
            <Toaster richColors />
          </AuthUserProvider>
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
    