import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'
import { authenticateApiKey } from '@/lib/auth/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const auth = await authenticateApiKey(request)
  if (!auth.success) return auth.response

  try {
    const { hash } = await params
    const tx = await walletService.getTransaction(
      auth.context.projectId,
      hash
    )

    if (!tx) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(tx)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}
