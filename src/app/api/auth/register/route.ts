import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { projects, apiKeys } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateBody } from '@/lib/validation/validate'
import { registerSchema } from '@/lib/validation/schemas'
import { createSession, setSessionCookie } from '@/lib/auth/session'
import { hashApiKey } from '@/lib/auth/middleware'
import { v4 as uuidv4 } from 'uuid'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const data = encoder.encode(saltHex + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${saltHex}:${hashHex}`
}

export async function POST(request: NextRequest) {
  const validation = await validateBody(request, registerSchema)
  if (!validation.success) return validation.response

  const { email, password, projectName } = validation.data

  try {
    // Check if email already exists
    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.ownerEmail, email))
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    // Create project
    const [project] = await db
      .insert(projects)
      .values({
        name: projectName,
        ownerEmail: email,
        passwordHash,
      })
      .returning()

    // Auto-create a default API key
    const rawKey = `sk_test_${uuidv4().replace(/-/g, '')}`
    const keyHash = await hashApiKey(rawKey)

    await db.insert(apiKeys).values({
      projectId: project.id,
      keyHash,
      keyPrefix: rawKey.slice(0, 12),
      name: 'Default Key',
    })

    // Set session
    const token = await createSession({
      projectId: project.id,
      email: project.ownerEmail,
    })
    await setSessionCookie(token)

    return NextResponse.json(
      {
        project: {
          id: project.id,
          name: project.name,
          email: project.ownerEmail,
        },
        apiKey: rawKey, // Only returned once at creation
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    )
  }
}
