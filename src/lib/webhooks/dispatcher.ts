import crypto from 'crypto'
import { db } from '@/lib/db/drizzle'
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
// Webhook registration types
// ---------------------------------------------------------------------------

export interface WebhookRegistration {
  id: string
  projectId: string
  url: string
  events: WebhookEvent[]
  secret: string
  createdAt: Date
}

export interface WebhookPayload {
  id: string
  event: WebhookEvent
  projectId: string
  timestamp: string
  data: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// In-memory webhook registry
// TODO: Replace with a persistent webhooks table in the database once the
// schema migration is created. The table should store projectId, url,
// events (json/text[]), secretHash, active flag, and timestamps.
// ---------------------------------------------------------------------------

const webhookRegistry = new Map<string, WebhookRegistration[]>()

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register a webhook URL for a project.
 *
 * @param projectId - The project UUID that owns this webhook.
 * @param url       - The HTTPS endpoint that will receive POST requests.
 * @param events    - The subset of webhook events to subscribe to.
 * @param secret    - A shared secret used to sign payloads with HMAC-SHA256.
 * @returns The newly created WebhookRegistration.
 */
export function registerWebhook(
  projectId: string,
  url: string,
  events: WebhookEvent[],
  secret: string
): WebhookRegistration {
  const registration: WebhookRegistration = {
    id: crypto.randomUUID(),
    projectId,
    url,
    events,
    secret,
    createdAt: new Date(),
  }

  const existing = webhookRegistry.get(projectId) ?? []
  existing.push(registration)
  webhookRegistry.set(projectId, existing)

  logger.info(
    { projectId, webhookId: registration.id, url, events },
    'Webhook registered'
  )

  return registration
}

/**
 * Remove a webhook registration by its id.
 */
export function unregisterWebhook(
  projectId: string,
  webhookId: string
): boolean {
  const registrations = webhookRegistry.get(projectId)
  if (!registrations) return false

  const index = registrations.findIndex((r) => r.id === webhookId)
  if (index === -1) return false

  registrations.splice(index, 1)
  if (registrations.length === 0) {
    webhookRegistry.delete(projectId)
  }

  logger.info({ projectId, webhookId }, 'Webhook unregistered')
  return true
}

/**
 * List all webhook registrations for a project.
 */
export function getWebhooks(projectId: string): WebhookRegistration[] {
  return webhookRegistry.get(projectId) ?? []
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 signing
// ---------------------------------------------------------------------------

/**
 * Compute an HMAC-SHA256 hex digest of `body` using the provided `secret`.
 */
function signPayload(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000 // 1s, 4s, 16s  (base * 4^attempt)

function retryDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(4, attempt)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Deliver a signed JSON payload to a single webhook URL with up to 3 retries
 * using exponential backoff (1 s, 4 s, 16 s).
 */
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

    // Wait before the next retry (skip sleep after the last attempt)
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

/**
 * Dispatch a webhook event to every registered endpoint for the given project
 * that is subscribed to the event type.
 *
 * @param projectId - The project UUID.
 * @param event     - The webhook event name.
 * @param payload   - Arbitrary event data to include in the delivery body.
 * @returns An array of results indicating success/failure per registration.
 */
export async function dispatchWebhookEvent(
  projectId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<{ webhookId: string; url: string; success: boolean }[]> {
  const registrations = webhookRegistry.get(projectId) ?? []

  const relevant = registrations.filter((r) => r.events.includes(event))

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
        registration.id
      )
      return { webhookId: registration.id, url: registration.url, success }
    })
  )

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    // This branch should not normally be reached because deliverWebhook
    // catches its own errors, but we handle it defensively.
    return {
      webhookId: 'unknown',
      url: 'unknown',
      success: false,
    }
  })
}
