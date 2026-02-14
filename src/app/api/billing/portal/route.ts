import { NextRequest, NextResponse } from 'next/server'
import { createPortalSession, stripe } from '@/lib/billing/stripe'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId } = body

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

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

    let customerId = project.stripeCustomerId

    // Fallback to Stripe search if not stored yet
    if (!customerId) {
      const customers = await stripe.customers.search({
        query: `metadata["projectId"]:"${projectId}"`,
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
    logger.error({ error }, 'Portal session creation failed')
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
