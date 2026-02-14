import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      )
    }

    const wallet = await walletService.createWallet(userId, email)
    return NextResponse.json(wallet, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    )
  }
}
