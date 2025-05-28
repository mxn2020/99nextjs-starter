import { Geist, Geist_Mono } from "next/font/google"

import "@99packages/ui/globals.css"
import { Providers } from "@/components/providers"
import { logger } from "@99packages/logger"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Basic App - Monorepo Package Demo",
  description: "A comprehensive Next.js application showcasing integration of custom packages including authentication, database management, audit logging, and UI components.",
  keywords: ["Next.js", "React", "TypeScript", "Supabase", "PostgreSQL", "Authentication", "Monorepo"],
  authors: [{ name: "Basic App Team" }],
  creator: "Basic App Team",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
