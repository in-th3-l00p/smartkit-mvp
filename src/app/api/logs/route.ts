import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const convex = getConvexClient()
    const projectId = session.projectId as Id<"projects">

    const [logs, stats] = await Promise.all([
      convex.query(api.requestLogs.getRecentLogs, { projectId, limit: 50 }),
      convex.query(api.requestLogs.getLogStats, { projectId }),
    ])

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l._id,
        timestamp: new Date(l._creationTime).toISOString(),
        method: l.method,
        path: l.path,
        statusCode: l.statusCode,
        duration: l.duration,
        apiKeyPrefix: l.apiKeyPrefix,
      })),
      stats,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}
