import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    const wallet = await walletService.getWallet(address)

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    const transactions = await walletService.getTransactions(address)
    return NextResponse.json({ ...wallet, transactions })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    )
  }
}
