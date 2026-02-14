import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/billing/stripe'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { priceId, projectId } = body

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      )
    }

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const convex = getConvexClient()
    const project = await convex.query(api.projects.getProjectById, {
      id: projectId as Id<"projects">,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const origin = request.nextUrl.origin
    const successUrl = `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`
    const cancelUrl = `${origin}/dashboard/billing?canceled=true`

    const checkoutSession = await createCheckoutSession(
      projectId,
      priceId,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    logger.error({ error }, 'Checkout session creation failed')
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
