import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Wallet, Zap, Shield, Globe, Code2, Layers } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SmartKit</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <a href="https://github.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              Built on ERC-4337 &bull; Base Sepolia Testnet
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Smart Wallets in{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                5 Minutes
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Add ERC-4337 account abstraction to your app with a simple SDK.
              Gasless transactions, social recovery, and smart wallet management — all out of the box.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="text-base px-8">
                  Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="text-base px-8">
                  <Code2 className="mr-2 h-4 w-4" /> Read the Docs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-16 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Integrate in minutes, not months
              </h2>
              <p className="text-muted-foreground mb-6">
                Install the SDK, create a wallet, and send your first gasless transaction
                with just a few lines of code. No blockchain expertise required.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-sm font-bold">1</div>
                  <span className="text-sm">Install <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npm install @smartkit/sdk</code></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-sm font-bold">2</div>
                  <span className="text-sm">Create a wallet with one API call</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-sm font-bold">3</div>
                  <span className="text-sm">Send gasless transactions</span>
                </div>
              </div>
            </div>
            <div className="bg-zinc-950 rounded-xl p-6 font-mono text-sm overflow-x-auto">
              <div className="flex gap-1.5 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <pre className="text-gray-300">
                <code>{`import SmartKit from '@smartkit/sdk'

const kit = new SmartKit({
  apiKey: 'sk_test_...'
})

// Create a smart wallet
const wallet = await kit.createWallet({
  userId: 'user_123',
  email: 'alice@example.com'
})

// Send a gasless transaction
const tx = await kit.sendTransaction({
  walletAddress: wallet.address,
  to: '0xRecipient...',
  value: '0',
  sponsored: true  // No gas needed!
})

console.log('TX Hash:', tx.userOpHash)`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Everything you need</h2>
            <p className="text-muted-foreground">
              A complete toolkit for integrating smart wallets into any application
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Smart Wallets</h3>
                <p className="text-sm text-muted-foreground">
                  Create ERC-4337 smart contract wallets with deterministic addresses. No seed phrases, no browser extensions.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Gasless Transactions</h3>
                <p className="text-sm text-muted-foreground">
                  Sponsor gas for your users with built-in paymaster support. Users never need to hold ETH.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Social Recovery</h3>
                <p className="text-sm text-muted-foreground">
                  Built-in account recovery via trusted guardians. No more lost wallets or irrecoverable funds.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Multi-Chain</h3>
                <p className="text-sm text-muted-foreground">
                  Deploy on Base, Arbitrum, Optimism, and more. Same wallet address across all supported chains.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                  <Code2 className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Simple SDK</h3>
                <p className="text-sm text-muted-foreground">
                  TypeScript-first SDK with full type safety. Integrate in 5 minutes with comprehensive documentation.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-4">
                  <Layers className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Developer Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor wallets, transactions, and gas usage in real-time. Manage API keys and track analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">
            Create your first smart wallet in under 5 minutes. Free for testnet usage.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="text-base px-8">
              Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <Layers className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">SmartKit</span>
              <span className="text-sm text-muted-foreground">MVP</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              <span>Built with ERC-4337</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
