import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'
import { authenticateApiKey } from '@/lib/auth/middleware'
import { validateBody } from '@/lib/validation/validate'
import { createWalletSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.success) return auth.response

  const validation = await validateBody(request, createWalletSchema)
  if (!validation.success) return validation.response

  try {
    const { userId, email } = validation.data
    const wallet = await walletService.createWallet(
      auth.context.projectId,
      userId,
      email
    )
    return NextResponse.json(wallet, { status: 201 })
  } catch (error) {
    console.error('Create wallet error:', error)
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    )
  }
}
