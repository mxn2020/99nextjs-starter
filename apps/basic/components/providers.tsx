"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { SupabaseAuthProvider } from "@99packages/auth"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </SupabaseAuthProvider>
  )
}
