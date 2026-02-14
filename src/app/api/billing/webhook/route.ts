import { NextRequest, NextResponse } from 'next/server'
import { stripe, tierForPriceId } from '@/lib/billing/stripe'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { logger } from '@/lib/logger'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ error: message }, 'Webhook signature verification failed')
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    )
  }

  logger.info(
    { eventId: event.id, type: event.type },
    'Stripe webhook event received'
  )

  const convex = getConvexClient()

  try {
    switch (event.type) {
      // -----------------------------------------------------------------
      // Checkout completed — a new subscription was created
      // -----------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const projectId = session.metadata?.projectId
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        logger.info(
          { projectId, customerId, subscriptionId },
          'Checkout session completed — subscription created'
        )

        if (projectId) {
          await convex.mutation(api.projects.updateProjectBilling, {
            id: projectId as Id<"projects">,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          })
        }
        break
      }

      // -----------------------------------------------------------------
      // Subscription updated (plan change, renewal, etc.)
      // -----------------------------------------------------------------
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const projectId = subscription.metadata?.projectId
        const priceId = subscription.items.data[0]?.price?.id
        const tier = priceId ? tierForPriceId(priceId) : 'free'

        logger.info(
          {
            projectId,
            subscriptionId: subscription.id,
            status: subscription.status,
            tier,
          },
          'Subscription updated'
        )

        if (projectId) {
          await convex.mutation(api.projects.updateProjectBilling, {
            id: projectId as Id<"projects">,
            stripeSubscriptionId: subscription.id,
            planTier: tier,
          })
        }
        break
      }

      // -----------------------------------------------------------------
      // Subscription deleted (cancellation)
      // -----------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const projectId = subscription.metadata?.projectId

        logger.info(
          { projectId, subscriptionId: subscription.id },
          'Subscription deleted — reverting to free tier'
        )

        if (projectId) {
          await convex.mutation(api.projects.updateProjectBilling, {
            id: projectId as Id<"projects">,
            planTier: 'free',
            stripeSubscriptionId: undefined,
          })
        }
        break
      }

      // -----------------------------------------------------------------
      // Invoice payment succeeded
      // -----------------------------------------------------------------
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const amountPaid = invoice.amount_paid

        logger.info(
          {
            customerId,
            invoiceId: invoice.id,
            amountPaid,
          },
          'Invoice payment succeeded'
        )
        break
      }

      // -----------------------------------------------------------------
      // Invoice payment failed
      // -----------------------------------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        logger.warn(
          {
            customerId,
            invoiceId: invoice.id,
            attemptCount: invoice.attempt_count,
          },
          'Invoice payment failed'
        )
        break
      }

      default:
        logger.debug({ type: event.type }, 'Unhandled Stripe event type')
    }
  } catch (error) {
    logger.error(
      { eventId: event.id, type: event.type, error },
      'Error processing Stripe webhook event'
    )
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
