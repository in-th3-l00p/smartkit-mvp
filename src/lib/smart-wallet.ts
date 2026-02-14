import { createPublicClient, http, formatEther, type PublicClient } from 'viem'
import { config } from './config'
import { db } from './db/drizzle'
import {
  wallets,
  transactions,
  type Wallet,
  type Transaction,
} from './db/schema'
import { eq, and, sql, or, ilike, desc, count } from 'drizzle-orm'
import {
  getCounterfactualAddress,
  buildInitCode,
  buildExecuteCallData,
  getNonce,
  signUserOpHash,
  isDeployed,
  userIdToSalt,
} from './account'
import { createBundlerClient, sendUserOperation, estimateUserOperationGas, getUserOperationReceipt } from './bundler'
import { createPaymasterClient, sponsorUserOperation } from './paymaster'

const publicClient = createPublicClient({
  chain: config.chain,
  transport: http(config.rpcUrl),
})

export class SmartWalletService {
  async createWallet(
    projectId: string,
    userId: string,
    email: string
  ): Promise<Wallet> {
    // Check if user already has wallet in this project
    const [existing] = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.projectId, projectId), eq(wallets.userId, userId)))
      .limit(1)

    if (existing) return existing

    // Generate deterministic salt from userId
    const salt = userIdToSalt(userId)

    // Compute counterfactual address via factory contract
    const address = await getCounterfactualAddress(salt)

    const [wallet] = await db
      .insert(wallets)
      .values({
        projectId,
        address,
        userId,
        email,
        salt: salt.toString(),
        deployed: false,
      })
      .returning()

    return wallet
  }

  async getWallet(
    projectId: string,
    address: string
  ): Promise<Wallet | undefined> {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(
        and(eq(wallets.projectId, projectId), ilike(wallets.address, address))
      )
      .limit(1)

    return wallet
  }

  async getAllWallets(projectId: string): Promise<Wallet[]> {
    return db
      .select()
      .from(wallets)
      .where(eq(wallets.projectId, projectId))
      .orderBy(desc(wallets.createdAt))
  }

  async sendTransaction(
    projectId: string,
    params: {
      walletAddress: string
      to: string
      value: string
      data: string
      sponsored?: boolean
    }
  ): Promise<Transaction> {
    const wallet = await this.getWallet(projectId, params.walletAddress)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    const sender = wallet.address as `0x${string}`
    const target = params.to as `0x${string}`
    const value = BigInt(params.value || '0')
    const data = (params.data || '0x') as `0x${string}`
    const sponsored = params.sponsored ?? true

    // Check if wallet is deployed on-chain
    const deployed = await isDeployed(sender)

    // Build initCode (only if not yet deployed)
    const salt = BigInt(wallet.salt)
    const initCode: `0x${string}` = deployed ? '0x' : buildInitCode(salt)

    // Build callData for execute()
    const callData = buildExecuteCallData(target, value, data)

    // Get nonce from EntryPoint
    const nonce = await getNonce(sender)

    // Get gas prices
    const gasPrice = await publicClient.estimateFeesPerGas()
    const maxFeePerGas = gasPrice.maxFeePerGas ?? 1000000000n
    const maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas ?? 100000000n

    // Dummy signature for gas estimation
    const dummySignature =
      '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c' as `0x${string}`

    const bundlerClient = createBundlerClient()

    // Estimate gas
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
      // Get paymaster sponsorship from Pimlico
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
      // Use updated gas limits from paymaster
      gasEstimate.callGasLimit = sponsorship.callGasLimit
      gasEstimate.verificationGasLimit = sponsorship.verificationGasLimit
      gasEstimate.preVerificationGas = sponsorship.preVerificationGas
    }

    // Build the full UserOp and sign it
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
      signature: dummySignature, // placeholder
    }

    // Sign the UserOp hash
    // The bundler will compute the hash; we sign the hash of the packed UserOp
    const userOpHashForSigning = this.computeUserOpHash(userOp)
    const signature = await signUserOpHash(userOpHashForSigning)
    userOp.signature = signature

    // Submit to bundler
    const userOpHash = await sendUserOperation(bundlerClient, userOp)

    // Store transaction in DB as pending
    const [tx] = await db
      .insert(transactions)
      .values({
        projectId,
        walletAddress: sender,
        userOpHash,
        to: target,
        value: params.value || '0',
        data: params.data || '0x',
        status: 'pending',
        gasSponsored: sponsored,
      })
      .returning()

    // Update wallet deployed status if it was first tx
    if (!deployed) {
      await db
        .update(wallets)
        .set({ deployed: true })
        .where(eq(wallets.id, wallet.id))
    }

    // Poll for receipt in background
    this.pollForReceipt(tx.id, userOpHash, bundlerClient)

    return tx
  }

  private async pollForReceipt(
    txId: string,
    userOpHash: `0x${string}`,
    bundlerClient: ReturnType<typeof createBundlerClient>
  ) {
    const maxAttempts = 30
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const result = await getUserOperationReceipt(bundlerClient, userOpHash)

      if (result.receipt) {
        await db
          .update(transactions)
          .set({
            txHash: result.receipt.transactionHash,
            status: result.success ? 'success' : 'failed',
            gasCost: formatEther(result.receipt.gasUsed),
          })
          .where(eq(transactions.id, txId))
        return
      }
    }

    // Timeout — mark as failed
    await db
      .update(transactions)
      .set({ status: 'failed' })
      .where(eq(transactions.id, txId))
  }

  private computeUserOpHash(userOp: {
    sender: `0x${string}`
    nonce: bigint
    initCode: `0x${string}`
    callData: `0x${string}`
    callGasLimit: bigint
    verificationGasLimit: bigint
    preVerificationGas: bigint
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
    paymasterAndData: `0x${string}`
    signature: `0x${string}`
  }): `0x${string}` {
    // Simplified: the bundler computes the actual hash server-side.
    // We sign the keccak256 of the packed user operation fields.
    const { keccak256, encodePacked, encodeAbiParameters } = require('viem')
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
        // Pack gas limits: verificationGasLimit | callGasLimit
        (userOp.verificationGasLimit << 128n) | userOp.callGasLimit,
        userOp.preVerificationGas,
        // Pack gas fees: maxPriorityFeePerGas | maxFeePerGas
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
    return finalHash
  }

  async getTransaction(
    projectId: string,
    hash: string
  ): Promise<Transaction | undefined> {
    const [tx] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.projectId, projectId),
          or(
            eq(transactions.userOpHash, hash),
            eq(transactions.txHash, hash)
          )
        )
      )
      .limit(1)

    return tx
  }

  async getTransactions(
    projectId: string,
    walletAddress?: string
  ): Promise<Transaction[]> {
    const conditions = [eq(transactions.projectId, projectId)]
    if (walletAddress) {
      conditions.push(ilike(transactions.walletAddress, walletAddress))
    }

    return db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt))
  }

  async getStats(projectId: string) {
    const [walletCount] = await db
      .select({ count: count() })
      .from(wallets)
      .where(eq(wallets.projectId, projectId))

    const txRows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.projectId, projectId))

    const totalTransactions = txRows.length
    const successfulTxs = txRows.filter((t) => t.status === 'success').length
    const failedTxs = txRows.filter((t) => t.status === 'failed').length
    const pendingTxs = txRows.filter(
      (t) => t.status === 'pending' || t.status === 'submitted'
    ).length
    const sponsoredTxs = txRows.filter((t) => t.gasSponsored)
    const totalGasSponsored = sponsoredTxs
      .reduce((sum, t) => sum + parseFloat(t.gasCost || '0'), 0)
      .toFixed(4)

    return {
      totalWallets: walletCount.count,
      totalTransactions,
      successfulTxs,
      failedTxs,
      pendingTxs,
      totalGasSponsored,
      successRate:
        totalTransactions > 0
          ? ((successfulTxs / totalTransactions) * 100).toFixed(1)
          : '0',
    }
  }
}

export const walletService = new SmartWalletService()
