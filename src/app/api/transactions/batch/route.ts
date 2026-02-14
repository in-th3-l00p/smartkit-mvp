import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/auth/middleware'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import {
  buildExecuteBatchCallData,
  getNonce,
  signUserOpHash,
  isDeployed,
  buildInitCode,
} from '@/lib/account'
import { createBundlerClient, sendUserOperation, estimateUserOperationGas, getUserOperationReceipt } from '@/lib/bundler'
import { createPaymasterClient, sponsorUserOperation } from '@/lib/paymaster'
import { createPublicClient, http, formatEther } from 'viem'
import { config } from '@/lib/config'

const batchTransactionSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  calls: z.array(
    z.object({
      to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      value: z.string().default('0'),
      data: z.string().regex(/^0x([a-fA-F0-9]*)?$/).default('0x'),
    })
  ).min(1).max(10),
  sponsored: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.success) return auth.response

  const validation = await validateBody(request, batchTransactionSchema)
  if (!validation.success) return validation.response

  const { walletAddress, calls, sponsored } = validation.data
  const projectId = auth.context.projectId as Id<"projects">

  try {
    const convex = getConvexClient()

    // Verify wallet exists
    const wallet = await convex.query(
      api.wallets.getWalletByProjectAndAddress,
      { projectId, address: walletAddress.toLowerCase() }
    )

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    const sender = wallet.address as `0x${string}`
    const deployed = await isDeployed(sender)
    const salt = BigInt(wallet.salt)
    const initCode: `0x${string}` = deployed ? '0x' : buildInitCode(salt)

    // Build batch callData
    const targets = calls.map((c) => c.to as `0x${string}`)
    const values = calls.map((c) => BigInt(c.value || '0'))
    const datas = calls.map((c) => (c.data || '0x') as `0x${string}`)
    const callData = buildExecuteBatchCallData(targets, values, datas)

    const nonce = await getNonce(sender)

    const publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    })
    const gasPrice = await publicClient.estimateFeesPerGas()
    const maxFeePerGas = gasPrice.maxFeePerGas ?? 1000000000n
    const maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas ?? 100000000n

    const dummySignature =
      '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c' as `0x${string}`

    const bundlerClient = createBundlerClient()

    const gasEstimate = await estimateUserOperationGas(bundlerClient, {
      sender,
      nonce,
      initCode,
      callData,
      paymasterAndData: '0x',
      signature: dummySignature,
    })

    let paymasterAndData: `0x${string}` = '0x'

    if (sponsored) {
      const paymasterClient = createPaymasterClient()
      const sponsorship = await sponsorUserOperation(paymasterClient, {
        sender,
        nonce,
        initCode,
        callData,
        callGasLimit: gasEstimate.callGasLimit,
        verificationGasLimit: gasEstimate.verificationGasLimit,
        preVerificationGas: gasEstimate.preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        signature: dummySignature,
      })
      paymasterAndData = sponsorship.paymasterAndData
      gasEstimate.callGasLimit = sponsorship.callGasLimit
      gasEstimate.verificationGasLimit = sponsorship.verificationGasLimit
      gasEstimate.preVerificationGas = sponsorship.preVerificationGas
    }

    const userOp = {
      sender,
      nonce,
      initCode,
      callData,
      callGasLimit: gasEstimate.callGasLimit,
      verificationGasLimit: gasEstimate.verificationGasLimit,
      preVerificationGas: gasEstimate.preVerificationGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      paymasterAndData,
      signature: dummySignature,
    }

    // Sign
    const { keccak256, encodeAbiParameters } = require('viem')
    const packed = encodeAbiParameters(
      [
        { type: 'address' },
        { type: 'uint256' },
        { type: 'bytes32' },
        { type: 'bytes32' },
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'bytes32' },
        { type: 'bytes32' },
      ],
      [
        userOp.sender,
        userOp.nonce,
        keccak256(userOp.initCode),
        keccak256(userOp.callData),
        (userOp.verificationGasLimit << 128n) | userOp.callGasLimit,
        userOp.preVerificationGas,
        (userOp.maxPriorityFeePerGas << 128n) | userOp.maxFeePerGas,
        keccak256(userOp.paymasterAndData),
      ]
    )
    const userOpPacked = keccak256(packed)
    const finalHash = keccak256(
      encodeAbiParameters(
        [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
        [userOpPacked, config.entryPointAddress, BigInt(config.chain.id)]
      )
    )

    const signature = await signUserOpHash(finalHash)
    userOp.signature = signature

    const userOpHash = await sendUserOperation(bundlerClient, userOp)

    // Store as a single batch transaction
    const tx = await convex.mutation(api.transactions.createTransaction, {
      projectId,
      walletAddress: sender,
      userOpHash,
      to: 'batch',
      value: '0',
      data: JSON.stringify(calls),
      status: 'pending',
      chainId: 84532,
      gasSponsored: sponsored,
    })

    if (!deployed) {
      await convex.mutation(api.wallets.markWalletDeployed, {
        walletId: wallet._id,
      })
    }

    // Poll for receipt in background
    if (tx) {
      pollForReceipt(tx._id, userOpHash as `0x${string}`, bundlerClient)
    }

    return NextResponse.json(
      {
        ...tx,
        callCount: calls.length,
      },
      { status: 201 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send batch transaction'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function pollForReceipt(
  txId: string,
  userOpHash: `0x${string}`,
  bundlerClient: ReturnType<typeof createBundlerClient>
) {
  const convex = getConvexClient()
  const maxAttempts = 30
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const result = await getUserOperationReceipt(bundlerClient, userOpHash)
    if (result.receipt) {
      await convex.mutation(api.transactions.updateTransactionReceipt, {
        txId: txId as Id<"transactions">,
        txHash: result.receipt.transactionHash,
        status: result.success ? 'success' : 'failed',
        gasCost: formatEther(result.receipt.gasUsed),
      })
      return
    }
  }
  await convex.mutation(api.transactions.markTransactionFailed, {
    txId: txId as Id<"transactions">,
  })
}
