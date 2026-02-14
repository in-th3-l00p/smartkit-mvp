import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params
    const tx = await walletService.getTransaction(hash)

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(tx)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}
