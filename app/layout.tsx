import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Evertwine Business Portal",
  description: "Manage your business promotions with Evertwine - The modern way to grow your business",
  keywords: ["business", "promotions", "marketing", "local business"],
  authors: [{ name: "Evertwine" }],
  viewport: "width=device-width, initial-scale=1",
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
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased min-h-screen gradient-mesh`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="animate-fade-in">{children}</div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
