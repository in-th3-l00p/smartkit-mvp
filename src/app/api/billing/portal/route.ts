import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createPortalSession, stripe } from '@/lib/billing/stripe'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const convex = getConvexClient()

    // Look up the project to check for stored stripeCustomerId
    const project = await convex.query(api.projects.getProjectById, {
      id: session.projectId as Id<"projects">,
    })

    let customerId = project?.stripeCustomerId

    // Fallback to Stripe search if not stored yet
    if (!customerId) {
      const customers = await stripe.customers.search({
        query: `metadata["projectId"]:"${session.projectId}"`,
        limit: 1,
      })
      customerId = customers.data[0]?.id
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe to a plan first.' },
        { status: 404 }
      )
    }

    const origin = request.nextUrl.origin
    const returnUrl = `${origin}/dashboard/billing`

    const portalSession = await createPortalSession(customerId, returnUrl)

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    logger.error({ error, projectId: session.projectId }, 'Portal session creation failed')
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
