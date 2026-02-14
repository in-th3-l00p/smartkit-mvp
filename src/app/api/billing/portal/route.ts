import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createPortalSession, stripe } from '@/lib/billing/stripe'
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
    // Look up the Stripe customer for this project
    const customers = await stripe.customers.search({
      query: `metadata["projectId"]:"${session.projectId}"`,
      limit: 1,
    })

    const customer = customers.data[0]
    if (!customer) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe to a plan first.' },
        { status: 404 }
      )
    }

    const origin = request.nextUrl.origin
    const returnUrl = `${origin}/dashboard/billing`

    const portalSession = await createPortalSession(customer.id, returnUrl)

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    logger.error({ error, projectId: session.projectId }, 'Portal session creation failed')
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
