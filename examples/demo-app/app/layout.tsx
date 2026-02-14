import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SmartKit Demo - Gasless NFT Minting',
  description: 'Demo app showing SmartKit SDK integration for gasless transactions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
