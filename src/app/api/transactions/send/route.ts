import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, to, value, data, sponsored } = body

    if (!walletAddress || !to) {
      return NextResponse.json(
        { error: 'walletAddress and to are required' },
        { status: 400 }
      )
    }

    const tx = await walletService.sendTransaction({
      walletAddress,
      to,
      value: value || '0',
      data: data || '0x',
      sponsored: sponsored ?? true,
    })

    return NextResponse.json(tx, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send transaction' },
      { status: 500 }
    )
  }
}
