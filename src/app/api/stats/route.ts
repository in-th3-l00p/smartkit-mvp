import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'
import { getSession } from '@/lib/auth/session'
import { authenticateApiKey } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  let projectId: string

  // Stats can be accessed via API key or dashboard session
  const auth = await authenticateApiKey(request)
  if (auth.success) {
    projectId = auth.context.projectId
  } else {
    const session = await getSession()
    if (!session) {
      return auth.response
    }
    projectId = session.projectId
  }

  try {
    const stats = await walletService.getStats(projectId)
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
