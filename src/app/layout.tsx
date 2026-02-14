import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ConvexClientProvider } from "@/components/providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "SmartKit - ERC-4337 Account Abstraction Made Simple",
  description: "The easiest way to add smart wallets to your app. Create wallets, send gasless transactions, and manage accounts with a simple API.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
        <Toaster />
      </body>
    </html>
  )
}
