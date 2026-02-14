import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'
import { authenticateApiKey } from '@/lib/auth/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const auth = await authenticateApiKey(request)
  if (!auth.success) return auth.response

  try {
    const { address } = await params
    const wallet = await walletService.getWallet(
      auth.context.projectId,
      address
    )

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    const transactions = await walletService.getTransactions(
      auth.context.projectId,
      address
    )
    return NextResponse.json({ ...wallet, transactions })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    )
  }
}
