import crypto from 'crypto'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel.js'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Webhook event types
// ---------------------------------------------------------------------------

export type WebhookEvent =
  | 'wallet.created'
  | 'transaction.success'
  | 'transaction.failed'

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  'wallet.created',
  'transaction.success',
  'transaction.failed',
]

// ---------------------------------------------------------------------------
// Webhook payload types
// ---------------------------------------------------------------------------

export interface WebhookPayload {
  id: string
  event: WebhookEvent
  projectId: string
  timestamp: string
  data: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 signing
// ---------------------------------------------------------------------------

function signPayload(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

function retryDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(4, attempt)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function deliverWebhook(
  url: string,
  body: string,
  signature: string,
  webhookId: string
): Promise<boolean> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SmartKit-Signature': signature,
          'X-SmartKit-Webhook-Id': webhookId,
        },
        body,
      })

      if (response.ok) {
        logger.info(
          { webhookId, url, attempt, status: response.status },
          'Webhook delivered successfully'
        )
        return true
      }

      logger.warn(
        { webhookId, url, attempt, status: response.status },
        'Webhook delivery received non-2xx response'
      )
    } catch (error) {
      logger.warn(
        { webhookId, url, attempt, error: String(error) },
        'Webhook delivery failed with network error'
      )
    }

    if (attempt < MAX_RETRIES) {
      const delay = retryDelay(attempt)
      logger.info(
        { webhookId, url, attempt, nextRetryMs: delay },
        'Scheduling webhook retry'
      )
      await sleep(delay)
    }
  }

  logger.error(
    { webhookId, url, maxRetries: MAX_RETRIES },
    'Webhook delivery exhausted all retries'
  )
  return false
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export async function dispatchWebhookEvent(
  projectId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<{ webhookId: string; url: string; success: boolean }[]> {
  const convex = getConvexClient()
  const pid = projectId as Id<"projects">

  const relevant = await convex.query(api.webhooksDb.getActiveWebhooksByEvent, {
    projectId: pid,
    event,
  })

  if (relevant.length === 0) {
    logger.debug({ projectId, event }, 'No webhooks registered for event')
    return []
  }

  const webhookPayload: WebhookPayload = {
    id: crypto.randomUUID(),
    event,
    projectId,
    timestamp: new Date().toISOString(),
    data: payload,
  }

  const body = JSON.stringify(webhookPayload)

  const results = await Promise.allSettled(
    relevant.map(async (registration) => {
      const signature = signPayload(body, registration.secret)
      const success = await deliverWebhook(
        registration.url,
        body,
        signature,
        registration._id
      )
      return { webhookId: registration._id, url: registration.url, success }
    })
  )

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    return {
      webhookId: 'unknown',
      url: 'unknown',
      success: false,
    }
  })
}
