import { NextRequest, NextResponse } from 'next/server'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../../convex/_generated/api'
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
    const convex = getConvexClient()

    const project = await convex.query(api.projects.getProjectByEmail, {
      email,
    })

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
      projectId: project._id,
      email: project.ownerEmail,
    })
    await setSessionCookie(token)

    return NextResponse.json({
      project: {
        id: project._id,
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
