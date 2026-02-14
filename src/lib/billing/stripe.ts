import Stripe from 'stripe'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Stripe client
// ---------------------------------------------------------------------------

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
})

// ---------------------------------------------------------------------------
// Plan tier definitions
// ---------------------------------------------------------------------------

export type PlanTier = 'free' | 'pro' | 'enterprise'

export interface PlanLimits {
  tier: PlanTier
  name: string
  walletsLimit: number
  transactionsLimit: number
  priceMonthly: number
  stripePriceId: string | null
}

export const PLAN_FREE: PlanLimits = {
  tier: 'free',
  name: 'Free',
  walletsLimit: 100,
  transactionsLimit: 1_000,
  priceMonthly: 0,
  stripePriceId: null,
}

export const PLAN_PRO: PlanLimits = {
  tier: 'pro',
  name: 'Pro',
  walletsLimit: 1_000,
  transactionsLimit: 50_000,
  priceMonthly: 49,
  stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
}

export const PLAN_ENTERPRISE: PlanLimits = {
  tier: 'enterprise',
  name: 'Enterprise',
  walletsLimit: Infinity,
  transactionsLimit: Infinity,
  priceMonthly: 499,
  stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? null,
}

export const PLANS: Record<PlanTier, PlanLimits> = {
  free: PLAN_FREE,
  pro: PLAN_PRO,
  enterprise: PLAN_ENTERPRISE,
}

// ---------------------------------------------------------------------------
// Helper: resolve a price ID to a plan tier
// ---------------------------------------------------------------------------

export function tierForPriceId(priceId: string): PlanTier {
  if (priceId === PLAN_PRO.stripePriceId) return 'pro'
  if (priceId === PLAN_ENTERPRISE.stripePriceId) return 'enterprise'
  return 'free'
}

// ---------------------------------------------------------------------------
// Checkout session
// ---------------------------------------------------------------------------

export async function createCheckoutSession(
  projectId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { projectId },
    subscription_data: {
      metadata: { projectId },
    },
  })

  logger.info({ projectId, sessionId: session.id }, 'Checkout session created')
  return session
}

// ---------------------------------------------------------------------------
// Billing portal session
// ---------------------------------------------------------------------------

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  logger.info({ customerId, sessionId: session.id }, 'Portal session created')
  return session
}

// ---------------------------------------------------------------------------
// Get active subscription for a customer
// ---------------------------------------------------------------------------

export async function getSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
    expand: ['data.items.data.price'],
  })

  return subscriptions.data[0] ?? null
}

// ---------------------------------------------------------------------------
// Report metered usage
// ---------------------------------------------------------------------------

export async function reportUsage(
  subscriptionItemId: string,
  quantity: number,
  eventName: string = 'transaction_count'
): Promise<Stripe.Billing.MeterEvent | null> {
  try {
    // Use Stripe Billing Meter Events API (v2 usage-based billing)
    const meterEvent = await stripe.billing.meterEvents.create({
      event_name: eventName,
      payload: {
        stripe_customer_id: subscriptionItemId,
        value: String(quantity),
      },
      timestamp: Math.floor(Date.now() / 1000),
    })

    logger.info(
      { subscriptionItemId, quantity, eventName },
      'Usage reported to Stripe'
    )

    return meterEvent
  } catch (error) {
    logger.error(
      { subscriptionItemId, quantity, error },
      'Failed to report usage to Stripe'
    )
    return null
  }
}

// ---------------------------------------------------------------------------
// Get plan for a project
// ---------------------------------------------------------------------------

/**
 * Determines the plan tier and limits for a given project.
 *
 * In production this would look up the project's Stripe customer ID from the
 * database and inspect the active subscription.  For the MVP we check a simple
 * metadata-based lookup and fall back to the Free tier.
 */
export async function getPlanForProject(
  projectId: string
): Promise<PlanLimits> {
  try {
    // Search for a Stripe customer with this projectId in metadata
    const customers = await stripe.customers.search({
      query: `metadata["projectId"]:"${projectId}"`,
      limit: 1,
    })

    const customer = customers.data[0]
    if (!customer) return PLAN_FREE

    const subscription = await getSubscription(customer.id)
    if (!subscription) return PLAN_FREE

    const priceId = subscription.items.data[0]?.price?.id
    if (!priceId) return PLAN_FREE

    const tier = tierForPriceId(priceId)
    return PLANS[tier]
  } catch (error) {
    logger.error({ projectId, error }, 'Failed to resolve plan for project')
    return PLAN_FREE
  }
}
