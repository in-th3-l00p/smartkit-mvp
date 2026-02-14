import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createCheckoutSession } from '@/lib/billing/stripe'
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
    const body = await request.json()
    const { priceId } = body

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      )
    }

    const origin = request.nextUrl.origin
    const successUrl = `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`
    const cancelUrl = `${origin}/dashboard/billing?canceled=true`

    const checkoutSession = await createCheckoutSession(
      session.projectId,
      priceId,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    logger.error({ error, projectId: session.projectId }, 'Checkout session creation failed')
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
