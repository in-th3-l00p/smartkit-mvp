import { NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'

export async function GET() {
  try {
    const wallets = await walletService.getAllWallets()
    return NextResponse.json(wallets)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    )
  }
}
