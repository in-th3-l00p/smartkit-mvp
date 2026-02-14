'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Code, Terminal } from "lucide-react"
import { toast } from "sonner"

const DEMO_API_KEY = 'sk_test_playground_demo'

const examples = [
  {
    id: 'create-wallet',
    name: 'Create Wallet',
    method: 'POST',
    path: '/api/wallets/create',
    code: `// Create a new smart wallet
const response = await fetch('/api/wallets/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${DEMO_API_KEY}'
  },
  body: JSON.stringify({
    userId: 'user_playground_1',
    email: 'demo@smartkit.dev'
  })
})

const wallet = await response.json()
console.log('Wallet:', wallet)`,
    mockResponse: {
      id: 'wlt_pg_1a2b3c4d',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      userId: 'user_playground_1',
      email: 'demo@smartkit.dev',
      deployed: false,
      network: 'sepolia',
      createdAt: new Date().toISOString(),
    },
  },
  {
    id: 'send-transaction',
    name: 'Send Transaction',
    method: 'POST',
    path: '/api/transactions/send',
    code: `// Send a gasless transaction
const response = await fetch('/api/transactions/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${DEMO_API_KEY}'
  },
  body: JSON.stringify({
    walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    to: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    value: '0',
    data: '0x',
    sponsored: true
  })
})

const tx = await response.json()
console.log('Transaction:', tx)`,
    mockResponse: {
      id: 'tx_pg_9f8e7d6c',
      userOpHash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
      txHash: '0xab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12',
      status: 'pending',
      from: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      to: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      value: '0',
      sponsored: true,
      gasCost: '0.00042',
      createdAt: new Date().toISOString(),
    },
  },
  {
    id: 'check-status',
    name: 'Check Status',
    method: 'GET',
    path: '/api/transactions/:hash',
    code: `// Check transaction status
const userOpHash = '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b'

const response = await fetch(
  \`/api/transactions/\${userOpHash}\`,
  {
    headers: {
      'Authorization': 'Bearer ${DEMO_API_KEY}'
    }
  }
)

const status = await response.json()
console.log('Status:', status)`,
    mockResponse: {
      id: 'tx_pg_9f8e7d6c',
      userOpHash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
      txHash: '0xab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12',
      status: 'success',
      from: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      to: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      value: '0',
      sponsored: true,
      gasCost: '0.00042',
      blockNumber: 18942156,
      confirmations: 12,
      createdAt: new Date(Date.now() - 30000).toISOString(),
      confirmedAt: new Date().toISOString(),
    },
  },
]

export default function PlaygroundPage() {
  const [selectedExample, setSelectedExample] = useState(examples[0])
  const [code, setCode] = useState(examples[0].code)
  const [response, setResponse] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [requestCount, setRequestCount] = useState(0)

  const selectExample = useCallback((example: typeof examples[0]) => {
    setSelectedExample(example)
    setCode(example.code)
    setResponse(null)
  }, [])

  const runCode = useCallback(async () => {
    if (requestCount >= 5) {
      toast.error('Rate limit reached', {
        description: 'You have used all 5 requests this minute. Please wait.',
      })
      return
    }

    setIsRunning(true)
    setResponse(null)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))

    setResponse(JSON.stringify(selectedExample.mockResponse, null, 2))
    setRequestCount((prev) => prev + 1)
    setIsRunning(false)

    toast.success('Request completed', {
      description: `${selectedExample.method} ${selectedExample.path}`,
    })

    // Reset rate limit after 60 seconds
    if (requestCount === 0) {
      setTimeout(() => setRequestCount(0), 60000)
    }
  }, [selectedExample, requestCount])

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <h1 className="text-lg font-semibold">SmartKit Playground</h1>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              No signup required
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              {5 - requestCount}/5 requests remaining
            </span>
            <Badge variant="outline" className="text-zinc-400 border-zinc-700">
              5 requests per minute
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <p className="text-zinc-400 text-sm">
            Try the SmartKit API directly in your browser. Select an example, edit the code, and hit Run.
          </p>
        </div>

        {/* Example Selector */}
        <div className="flex gap-2 mb-6">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => selectExample(example)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedExample.id === example.id
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Badge
                variant={example.method === 'POST' ? 'default' : 'secondary'}
                className={
                  example.method === 'POST'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }
              >
                {example.method}
              </Badge>
              {example.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor Panel */}
          <Card className="bg-zinc-900 border-zinc-800 text-gray-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-zinc-400" />
                  <CardTitle className="text-sm text-zinc-200">Request</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-mono">
                    {selectedExample.path}
                  </span>
                </div>
              </div>
              <CardDescription className="text-zinc-500 text-xs">
                API Key: {DEMO_API_KEY.slice(0, 16)}...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="w-full h-80 bg-zinc-950 text-emerald-300 font-mono text-sm p-4 rounded-lg border border-zinc-800 resize-none focus:outline-none focus:border-zinc-600 leading-relaxed"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-zinc-600">
                  Responses are simulated for this demo environment.
                </p>
                <Button
                  onClick={runCode}
                  disabled={isRunning || requestCount >= 5}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? 'Running...' : 'Run'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Response Panel */}
          <Card className="bg-zinc-900 border-zinc-800 text-gray-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-zinc-400" />
                  <CardTitle className="text-sm text-zinc-200">Response</CardTitle>
                </div>
                {response && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    200 OK
                  </Badge>
                )}
              </div>
              <CardDescription className="text-zinc-500 text-xs">
                JSON response from the API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="w-full h-80 bg-zinc-950 text-amber-300 font-mono text-sm p-4 rounded-lg border border-zinc-800 overflow-auto leading-relaxed">
                  {isRunning ? (
                    <span className="text-zinc-500 animate-pulse">Executing request...</span>
                  ) : response ? (
                    response
                  ) : (
                    <span className="text-zinc-600">
                      {'// Click "Run" to execute the request\n// Response will appear here'}
                    </span>
                  )}
                </pre>
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
              </div>
              {response && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    Response time: {(800 + Math.random() * 200).toFixed(0)}ms
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => {
                      navigator.clipboard.writeText(response)
                      toast.success('Response copied to clipboard')
                    }}
                  >
                    Copy Response
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Bar */}
        <Card className="mt-6 bg-zinc-900 border-zinc-800 text-gray-100">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-6 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Testnet (Sepolia)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>ERC-4337 Account Abstraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Gas Sponsored</span>
                </div>
              </div>
              <p className="text-xs text-zinc-600">
                Ready to build? Sign up for a full API key at /dashboard/api-keys
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
