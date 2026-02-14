import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { projects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateBody } from '@/lib/validation/validate'
import { loginSchema } from '@/lib/validation/schemas'
import { createSession, setSessionCookie } from '@/lib/auth/session'

async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltHex, storedHash] = stored.split(':')
  const encoder = new TextEncoder()
  const data = encoder.encode(saltHex + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hashHex === storedHash
}

export async function POST(request: NextRequest) {
  const validation = await validateBody(request, loginSchema)
  if (!validation.success) return validation.response

  const { email, password } = validation.data

  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerEmail, email))
      .limit(1)

    if (!project) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const valid = await verifyPassword(password, project.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const token = await createSession({
      projectId: project.id,
      email: project.ownerEmail,
    })
    await setSessionCookie(token)

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        email: project.ownerEmail,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
