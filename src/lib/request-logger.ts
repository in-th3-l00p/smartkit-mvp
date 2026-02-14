import { getConvexClient } from '@/lib/convex'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function logRequest(opts: {
  projectId: string
  apiKeyId?: string
  apiKeyPrefix: string
  method: string
  path: string
  statusCode: number
  duration: number
}) {
  // Fire-and-forget — don't block the response
  const convex = getConvexClient()
  convex
    .mutation(api.requestLogs.createLog, {
      projectId: opts.projectId as Id<"projects">,
      apiKeyId: opts.apiKeyId,
      apiKeyPrefix: opts.apiKeyPrefix,
      method: opts.method,
      path: opts.path,
      statusCode: opts.statusCode,
      duration: opts.duration,
    })
    .catch(() => {})
}
