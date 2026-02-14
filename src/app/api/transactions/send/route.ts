import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/lib/smart-wallet'
import { authenticateApiKey } from '@/lib/auth/middleware'
import { validateBody } from '@/lib/validation/validate'
import { sendTransactionSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.success) return auth.response

  const validation = await validateBody(request, sendTransactionSchema)
  if (!validation.success) return validation.response

  try {
    const { walletAddress, to, value, data, sponsored } = validation.data

    const tx = await walletService.sendTransaction(auth.context.projectId, {
      walletAddress,
      to,
      value: value || '0',
      data: data || '0x',
      sponsored,
    })

    return NextResponse.json(tx, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send transaction'
    const status = message === 'Wallet not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
