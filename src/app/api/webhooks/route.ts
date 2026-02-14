import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import crypto from 'crypto'

async function requireSession() {
  const session = await getSession()
  if (!session) {
    return {
      success: false as const,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }
  return { success: true as const, session }
}

export async function GET() {
  const auth = await requireSession()
  if (!auth.success) return auth.response

  try {
    const convex = getConvexClient()
    const webhooks = await convex.query(api.webhooksDb.getWebhooksByProject, {
      projectId: auth.session.projectId as Id<"projects">,
    })

    return NextResponse.json(
      webhooks.map((w) => ({
        id: w._id,
        url: w.url,
        events: w.events,
        active: w.active,
        createdAt: new Date(w._creationTime).toISOString(),
      }))
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession()
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    const { url, events } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const validEvents = ['wallet.created', 'transaction.success', 'transaction.failed']
    const selectedEvents = Array.isArray(events)
      ? events.filter((e: string) => validEvents.includes(e))
      : validEvents

    const secret = crypto.randomBytes(32).toString('hex')

    const convex = getConvexClient()
    const webhook = await convex.mutation(api.webhooksDb.createWebhook, {
      projectId: auth.session.projectId as Id<"projects">,
      url,
      events: selectedEvents,
      secret,
      active: true,
    })

    return NextResponse.json(
      {
        id: webhook!._id,
        url: webhook!.url,
        events: webhook!.events,
        secret,
        active: webhook!.active,
        createdAt: new Date(webhook!._creationTime).toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}
