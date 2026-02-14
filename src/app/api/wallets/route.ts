import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'
import { authenticateApiKey } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.success) return auth.response

  try {
    const wallets = await walletService.getAllWallets(auth.context.projectId)
    return NextResponse.json(wallets)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    )
  }
}
