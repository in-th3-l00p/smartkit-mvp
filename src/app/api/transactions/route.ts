import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'
import { authenticateApiKey } from '@/lib/auth/middleware'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  let projectId: string

  // Accept API key or dashboard session
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
    const transactions = await walletService.getTransactions(projectId)
    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
