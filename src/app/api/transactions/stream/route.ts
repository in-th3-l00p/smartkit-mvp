import { NextRequest } from 'next/server'
import { authenticateApiKey } from '@/lib/auth/middleware'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.success) return auth.response

  const projectId = auth.context.projectId as Id<"projects">
  const walletAddress = request.nextUrl.searchParams.get('walletAddress')

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      // Send initial heartbeat
      send('connected', { timestamp: new Date().toISOString() })

      // Poll for updates every 2 seconds
      let lastChecked = Date.now()
      const interval = setInterval(async () => {
        try {
          const convex = getConvexClient()
          const updated = await convex.query(
            api.transactions.getRecentUpdated,
            {
              projectId,
              walletAddress: walletAddress ?? undefined,
              afterTimestamp: lastChecked,
            }
          )

          for (const tx of updated) {
            send('transaction', {
              id: tx._id,
              userOpHash: tx.userOpHash,
              txHash: tx.txHash,
              status: tx.status,
              gasCost: tx.gasCost,
            })
          }

          lastChecked = Date.now()

          // Send keepalive
          send('ping', { timestamp: new Date().toISOString() })
        } catch {
          // Silently handle poll errors
        }
      }, 2000)

      // Clean up on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
