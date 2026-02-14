import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Layers } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">SmartKit</span>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">Documentation</span>
          <div className="ml-auto">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Documentation</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Everything you need to integrate SmartKit into your application.
        </p>

        <Tabs defaultValue="quickstart" className="space-y-8">
          <TabsList>
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
            <TabsTrigger value="sdk">SDK</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="quickstart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start Guide</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">1. Install the SDK</h3>
                  <pre className="bg-zinc-950 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    npm install @smartkit/sdk
                  </pre>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">2. Initialize SmartKit</h3>
                  <pre className="bg-zinc-950 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto">{`import SmartKit from '@smartkit/sdk'

const smartkit = new SmartKit({
  apiKey: 'sk_test_your_api_key'
})`}</pre>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">3. Create a Wallet</h3>
                  <pre className="bg-zinc-950 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto">{`const wallet = await smartkit.createWallet({
  userId: 'user_123',
  email: 'user@example.com'
})

console.log('Address:', wallet.address)`}</pre>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">4. Send a Gasless Transaction</h3>
                  <pre className="bg-zinc-950 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto">{`const tx = await smartkit.sendTransaction({
  walletAddress: wallet.address,
  to: '0xRecipientAddress...',
  value: '0',
  data: '0x',
  sponsored: true  // Gas is paid for!
})

// Wait for confirmation
const result = await smartkit.waitForTransaction(tx.userOpHash)
console.log('Status:', result.status)`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>POST</Badge>
                    <code className="text-sm font-mono">/api/wallets/create</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Create a new smart wallet</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Request Body:</p>
                    <pre className="bg-zinc-950 text-gray-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">{`{
  "userId": "string",
  "email": "string"
}`}</pre>
                    <p className="text-sm font-medium mt-3">Response:</p>
                    <pre className="bg-zinc-950 text-gray-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">{`{
  "id": "string",
  "address": "0x...",
  "userId": "string",
  "email": "string",
  "deployed": false,
  "createdAt": "ISO timestamp"
}`}</pre>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>POST</Badge>
                    <code className="text-sm font-mono">/api/transactions/send</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Send a gasless transaction</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Request Body:</p>
                    <pre className="bg-zinc-950 text-gray-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">{`{
  "walletAddress": "0x...",
  "to": "0x...",
  "value": "0",
  "data": "0x",
  "sponsored": true
}`}</pre>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm font-mono">/api/wallets</code>
                  </div>
                  <p className="text-sm text-muted-foreground">List all wallets</p>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm font-mono">/api/wallets/:address</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Get wallet details with transaction history</p>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm font-mono">/api/transactions</code>
                  </div>
                  <p className="text-sm text-muted-foreground">List all transactions</p>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm font-mono">/api/transactions/:hash</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Get transaction status by userOp hash or tx hash</p>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm font-mono">/api/stats</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Get dashboard statistics</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sdk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SDK Reference</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Constructor</h3>
                  <pre className="bg-zinc-950 text-gray-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">{`new SmartKit({ apiKey: string, apiUrl?: string })`}</pre>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">createWallet(params)</h3>
                  <p className="text-sm text-muted-foreground mb-2">Create a new ERC-4337 smart wallet with a deterministic address.</p>
                  <pre className="bg-zinc-950 text-gray-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">{`const wallet = await smartkit.createWallet({
  userId: 'user_123',
  email: 'user@example.com'
})
// Returns: { id, address, userId, email, deployed, createdAt }`}</pre>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">sendTransaction(params)</h3>
                  <p className="text-sm text-muted-foreground mb-2">Send a transaction from a smart wallet. Set sponsored=true for gasless.</p>
                  <pre className="bg-zinc-950 text-gray-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">{`const tx = await smartkit.sendTransaction({
  walletAddress: '0x...',
  to: '0x...',
  value: '0',
  data: '0x',
  sponsored: true
})
// Returns: { id, userOpHash, txHash, status, gasCost }`}</pre>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">waitForTransaction(hash, options?)</h3>
                  <p className="text-sm text-muted-foreground mb-2">Poll for transaction confirmation. Resolves when status is success or failed.</p>
                  <pre className="bg-zinc-950 text-gray-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">{`const result = await smartkit.waitForTransaction(
  tx.userOpHash,
  { timeout: 60000, interval: 2000 }
)`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="font-semibold mb-3">Next.js App</h3>
                  <pre className="bg-zinc-950 text-gray-300 p-4 rounded-lg font-mono text-xs overflow-x-auto">{`'use client'
import { useState } from 'react'
import SmartKit from '@smartkit/sdk'

const smartkit = new SmartKit({
  apiKey: process.env.NEXT_PUBLIC_SMARTKIT_KEY!
})

export default function App() {
  const [wallet, setWallet] = useState(null)

  const handleCreate = async () => {
    const w = await smartkit.createWallet({
      userId: 'user_1',
      email: 'user@app.com'
    })
    setWallet(w)
  }

  return (
    <div>
      <button onClick={handleCreate}>
        Create Wallet
      </button>
      {wallet && <p>Address: {wallet.address}</p>}
    </div>
  )
}`}</pre>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">NFT Minting (Gasless)</h3>
                  <pre className="bg-zinc-950 text-gray-300 p-4 rounded-lg font-mono text-xs overflow-x-auto">{`const mintNFT = async (walletAddress: string) => {
  // Encode mint function call
  const data = encodeFunctionData({
    abi: nftAbi,
    functionName: 'mint',
    args: [walletAddress, 1]
  })

  const tx = await smartkit.sendTransaction({
    walletAddress,
    to: NFT_CONTRACT,
    value: '0',
    data,
    sponsored: true  // User pays no gas!
  })

  const result = await smartkit.waitForTransaction(
    tx.userOpHash
  )
  console.log('NFT minted!', result)
}`}</pre>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Batch Transactions</h3>
                  <pre className="bg-zinc-950 text-gray-300 p-4 rounded-lg font-mono text-xs overflow-x-auto">{`// Send multiple transactions in sequence
const transfers = [
  { to: '0xAlice...', value: '1000000' },
  { to: '0xBob...', value: '2000000' },
]

for (const transfer of transfers) {
  await smartkit.sendTransaction({
    walletAddress: myWallet,
    to: transfer.to,
    value: transfer.value,
    sponsored: true
  })
}`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
