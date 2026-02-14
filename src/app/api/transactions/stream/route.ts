import { NextRequest } from 'next/server'
import { authenticateApiKey } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { transactions } from '@/lib/db/schema'
import { eq, and, or } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.success) return auth.response

  const projectId = auth.context.projectId
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
      let lastChecked = new Date()
      const interval = setInterval(async () => {
        try {
          const conditions = [eq(transactions.projectId, projectId)]
          if (walletAddress) {
            conditions.push(eq(transactions.walletAddress, walletAddress))
          }

          // Find transactions updated since last check (status changed)
          const recent = await db
            .select()
            .from(transactions)
            .where(and(...conditions))
            .limit(20)

          const updated = recent.filter(
            (tx) =>
              (tx.status === 'success' || tx.status === 'failed') &&
              tx.createdAt > lastChecked
          )

          for (const tx of updated) {
            send('transaction', {
              id: tx.id,
              userOpHash: tx.userOpHash,
              txHash: tx.txHash,
              status: tx.status,
              gasCost: tx.gasCost,
            })
          }

          lastChecked = new Date()

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
