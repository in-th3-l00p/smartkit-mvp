import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { apiKeys } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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
    const keys = await db
      .select({
        id: apiKeys.id,
        keyPrefix: apiKeys.keyPrefix,
        name: apiKeys.name,
        createdAt: apiKeys.createdAt,
        lastUsed: apiKeys.lastUsed,
        requestCount: apiKeys.requestCount,
      })
      .from(apiKeys)
      .where(eq(apiKeys.projectId, auth.session.projectId))

    return NextResponse.json(keys)
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

    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        projectId: auth.session.projectId,
        keyHash,
        keyPrefix: rawKey.slice(0, 12),
        name,
      })
      .returning()

    return NextResponse.json(
      {
        id: apiKey.id,
        key: rawKey,
        keyPrefix: apiKey.keyPrefix,
        name: apiKey.name,
        createdAt: apiKey.createdAt,
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
