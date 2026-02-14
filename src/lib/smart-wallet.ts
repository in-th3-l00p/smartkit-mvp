import { createPublicClient, http, formatEther } from 'viem'
import { config } from './config'
import { getChainConfig, type ChainConfig } from './chains'
import { getConvexClient } from './convex'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
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
  private get convex() {
    return getConvexClient()
  }

  async createWallet(
    projectId: string,
    userId: string,
    email: string
  ) {
    const pid = projectId as Id<"projects">

    // Check if user already has wallet in this project
    const existing = await this.convex.query(
      api.wallets.getWalletByProjectAndUser,
      { projectId: pid, userId }
    )
    if (existing) return existing

    // Generate deterministic salt from userId
    const salt = userIdToSalt(userId)

    // Compute counterfactual address via factory contract
    const address = await getCounterfactualAddress(salt)

    const wallet = await this.convex.mutation(api.wallets.createWallet, {
      projectId: pid,
      address,
      userId,
      email,
      salt: salt.toString(),
      chainId: 84532,
      deployed: false,
    })

    return wallet
  }

  async getWallet(projectId: string, address: string) {
    const pid = projectId as Id<"projects">
    return this.convex.query(api.wallets.getWalletByProjectAndAddress, {
      projectId: pid,
      address: address.toLowerCase(),
    })
  }

  async getAllWallets(projectId: string) {
    const pid = projectId as Id<"projects">
    return this.convex.query(api.wallets.getAllWallets, { projectId: pid })
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
  ) {
    const pid = projectId as Id<"projects">
    const wallet = await this.getWallet(projectId, params.walletAddress)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    // Fetch chain config (with deployment addresses from Convex)
    const chainConfig = await getChainConfig(wallet.chainId)

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
    const userOpHashForSigning = this.computeUserOpHash(userOp, chainConfig)
    const signature = await signUserOpHash(userOpHashForSigning)
    userOp.signature = signature

    // Submit to bundler
    const userOpHash = await sendUserOperation(bundlerClient, userOp)

    // Store transaction in DB as pending
    const tx = await this.convex.mutation(api.transactions.createTransaction, {
      projectId: pid,
      walletAddress: sender,
      userOpHash,
      to: target,
      value: params.value || '0',
      data: params.data || '0x',
      status: 'pending',
      chainId: wallet.chainId,
      gasSponsored: sponsored,
    })

    // Update wallet deployed status if it was first tx
    if (!deployed) {
      await this.convex.mutation(api.wallets.markWalletDeployed, {
        walletId: wallet._id,
      })
    }

    // Poll for receipt in background
    if (tx) {
      this.pollForReceipt(tx._id, userOpHash as `0x${string}`, bundlerClient)
    }

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
        await this.convex.mutation(api.transactions.updateTransactionReceipt, {
          txId: txId as Id<"transactions">,
          txHash: result.receipt.transactionHash,
          status: result.success ? 'success' : 'failed',
          gasCost: formatEther(result.receipt.gasUsed),
        })
        return
      }
    }

    // Timeout — mark as failed
    await this.convex.mutation(api.transactions.markTransactionFailed, {
      txId: txId as Id<"transactions">,
    })
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
  }, chainConfig?: ChainConfig): `0x${string}` {
    const { keccak256, encodeAbiParameters } = require('viem')
    const entryPoint = chainConfig?.entryPointAddress ?? config.entryPointAddress
    const chainId = chainConfig?.chain.id ?? config.chain.id
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
        [userOpPacked, entryPoint, BigInt(chainId)]
      )
    )
    return finalHash
  }

  async getTransaction(projectId: string, hash: string) {
    const pid = projectId as Id<"projects">
    return this.convex.query(api.transactions.getTransactionByHash, {
      projectId: pid,
      hash,
    })
  }

  async getTransactions(projectId: string, walletAddress?: string) {
    const pid = projectId as Id<"projects">
    return this.convex.query(api.transactions.getTransactions, {
      projectId: pid,
      walletAddress,
    })
  }

  async getStats(projectId: string) {
    const pid = projectId as Id<"projects">

    const totalWallets = await this.convex.query(api.wallets.getWalletCount, {
      projectId: pid,
    })

    const txRows = await this.convex.query(
      api.transactions.getTransactionsByProject,
      { projectId: pid }
    )

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
      totalWallets,
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
