import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Evertwine Business Portal",
  description: "Manage your business promotions and analytics with Evertwine",
  icons: {
    icon: [
      { url: "/images/evertwine-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/images/evertwine-logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/images/evertwine-logo.png", sizes: "180x180", type: "image/png" },
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/evertwine-logo.png" />
        <link rel="apple-touch-icon" href="/images/evertwine-logo.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
