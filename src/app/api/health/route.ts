import { NextResponse } from 'next/server'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../convex/_generated/api'

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {}

  // Database check (Convex)
  const dbStart = Date.now()
  try {
    const convex = getConvexClient()
    await convex.query(api.projects.healthCheck, {})
    checks.database = { status: 'healthy', latency: Date.now() - dbStart }
  } catch {
    checks.database = { status: 'unhealthy', latency: Date.now() - dbStart }
  }

  // Pimlico bundler check
  const pimlicoStart = Date.now()
  try {
    const pimlicoKey = process.env.PIMLICO_API_KEY
    if (pimlicoKey) {
      const response = await fetch(
        `https://api.pimlico.io/v2/84532/rpc?apikey=${pimlicoKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1,
          }),
          signal: AbortSignal.timeout(5000),
        }
      )
      checks.bundler = {
        status: response.ok ? 'healthy' : 'unhealthy',
        latency: Date.now() - pimlicoStart,
      }
    } else {
      checks.bundler = { status: 'not_configured' }
    }
  } catch {
    checks.bundler = { status: 'unhealthy', latency: Date.now() - pimlicoStart }
  }

  const allHealthy = Object.values(checks).every(
    (c) => c.status === 'healthy' || c.status === 'not_configured'
  )

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
