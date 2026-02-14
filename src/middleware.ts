import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, apiRateLimit, authRateLimit } from '@/lib/security/rate-limit'
import { corsHeaders, handlePreflight } from '@/lib/security/cors'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // Handle CORS preflight for API routes
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    return handlePreflight(origin)
  }

  // Security headers for all responses
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )

  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const headers = corsHeaders(origin)
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value)
    }
  }

  // Rate limiting for auth endpoints
  if (pathname.startsWith('/api/auth/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    const result = await checkRateLimit(authRateLimit, `auth:${ip}`)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  // Rate limiting for API routes (by API key or IP)
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth/') &&
    !pathname.startsWith('/api/health')
  ) {
    const authHeader = request.headers.get('authorization')
    const identifier = authHeader
      ? `key:${authHeader.slice(7, 19)}` // Use key prefix as identifier
      : `ip:${request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'}`

    const result = await checkRateLimit(apiRateLimit, identifier)

    response.headers.set('X-RateLimit-Limit', String(result.limit))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))

    if (!result.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  // Dashboard session check (allow access — actual auth happens in route handlers)
  // The middleware just sets security headers; route handlers enforce authentication

  return response
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
}
