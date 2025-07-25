import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DevTools } from "@/components/dev-tools"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "NAPPS Nasarawa State Unified Exams",
  description: "NAPPS Nasarawa State Unified Examination System",
  generator: 'v0dev',
  icons: {
    icon: '/napps-logo.svg',
    shortcut: '/napps-logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="light" 
            enableSystem 
            disableTransitionOnChange
            storageKey="napps-theme"
          >
            {children}
            <Toaster />
            <DevTools />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
