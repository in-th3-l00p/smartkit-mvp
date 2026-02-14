import { NextRequest, NextResponse } from 'next/server'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { getSession } from '@/lib/auth/session'
import { hashApiKey } from '@/lib/auth/middleware'
import { validateBody } from '@/lib/validation/validate'
import { createApiKeySchema } from '@/lib/validation/schemas'
import { v4 as uuidv4 } from 'uuid'

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
    const keys = await convex.query(api.apiKeys.getApiKeysByProject, {
      projectId: auth.session.projectId as Id<"projects">,
    })

    return NextResponse.json(
      keys.map((k) => ({
        id: k._id,
        keyPrefix: k.keyPrefix,
        name: k.name,
        createdAt: new Date(k._creationTime).toISOString(),
        lastUsed: k.lastUsed ? new Date(k.lastUsed).toISOString() : null,
        requestCount: k.requestCount,
      }))
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession()
  if (!auth.success) return auth.response

  const validation = await validateBody(request, createApiKeySchema)
  if (!validation.success) return validation.response

  try {
    const { name } = validation.data

    const rawKey = `sk_test_${uuidv4().replace(/-/g, '')}`
    const keyHash = await hashApiKey(rawKey)

    const convex = getConvexClient()
    const apiKey = await convex.mutation(api.apiKeys.createApiKey, {
      projectId: auth.session.projectId as Id<"projects">,
      keyHash,
      keyPrefix: rawKey.slice(0, 12),
      name,
    })

    return NextResponse.json(
      {
        id: apiKey!._id,
        key: rawKey,
        keyPrefix: apiKey!.keyPrefix,
        name: apiKey!.name,
        createdAt: new Date(apiKey!._creationTime).toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}
