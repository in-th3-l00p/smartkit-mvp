import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { transactions } from '@/lib/db/schema'
import { eq, and, lt } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Mark stale pending transactions (older than 1 hour) as failed
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const result = await db
      .update(transactions)
      .set({ status: 'failed' })
      .where(
        and(
          eq(transactions.status, 'pending'),
          lt(transactions.createdAt, oneHourAgo)
        )
      )

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cleanup cron error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
