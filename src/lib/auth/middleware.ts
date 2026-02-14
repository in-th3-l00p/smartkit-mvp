import { NextRequest, NextResponse } from 'next/server'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../convex/_generated/api'

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export interface AuthContext {
  projectId: string
  keyId: string
}

export type AuthResult =
  | { success: true; context: AuthContext }
  | { success: false; response: NextResponse }

export async function authenticateApiKey(
  request: NextRequest
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Missing or invalid Authorization header. Use: Bearer sk_test_...' },
        { status: 401 }
      ),
    }
  }

  const key = authHeader.slice(7)
  const keyHash = await hashApiKey(key)

  const convex = getConvexClient()
  const found = await convex.query(api.apiKeys.getApiKeyByHash, { keyHash })

  if (!found) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      ),
    }
  }

  // Update last used and request count (fire-and-forget)
  convex
    .mutation(api.apiKeys.updateApiKeyUsage, { keyId: found._id })
    .catch(() => {})

  return {
    success: true,
    context: { projectId: found.projectId, keyId: found._id },
  }
}

export { hashApiKey }
