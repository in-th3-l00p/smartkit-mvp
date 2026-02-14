'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useProject } from './use-project'

export interface Stats {
  totalWallets: number
  totalTransactions: number
  successfulTxs: number
  failedTxs: number
  pendingTxs: number
  totalGasSponsored: string
  successRate: string
}

export function useDashboard() {
  const { projectId } = useProject()

  const wallets = useQuery(
    api.wallets.getMyWallets,
    projectId ? { projectId } : 'skip'
  )

  const transactions = useQuery(
    api.transactions.getMyTransactions,
    projectId ? { projectId } : 'skip'
  )

  const apiKeys = useQuery(
    api.apiKeys.getMyApiKeys,
    projectId ? { projectId } : 'skip'
  )

  const isLoading =
    wallets === undefined || transactions === undefined || apiKeys === undefined

  // Compute stats client-side from reactive data
  const txList = transactions ?? []
  const walletList = wallets ?? []

  const totalTransactions = txList.length
  const successfulTxs = txList.filter((t) => t.status === 'success').length
  const failedTxs = txList.filter((t) => t.status === 'failed').length
  const pendingTxs = txList.filter(
    (t) => t.status === 'pending' || t.status === 'submitted'
  ).length
  const sponsoredTxs = txList.filter((t) => t.gasSponsored)
  const totalGasSponsored = sponsoredTxs
    .reduce((sum, t) => sum + parseFloat(t.gasCost || '0'), 0)
    .toFixed(4)

  const stats: Stats = {
    totalWallets: walletList.length,
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

  return {
    wallets: walletList.map((w) => ({
      id: w._id,
      address: w.address,
      userId: w.userId,
      email: w.email,
      salt: w.salt,
      deployed: w.deployed,
      createdAt: new Date(w._creationTime).toISOString(),
    })),
    transactions: txList.map((t) => ({
      id: t._id,
      walletAddress: t.walletAddress,
      userOpHash: t.userOpHash,
      txHash: t.txHash ?? null,
      to: t.to,
      value: t.value,
      data: t.data,
      status: t.status as 'pending' | 'submitted' | 'success' | 'failed',
      gasSponsored: t.gasSponsored,
      gasCost: t.gasCost ?? null,
      createdAt: new Date(t._creationTime).toISOString(),
    })),
    apiKeys: (apiKeys ?? []).map((k) => ({
      id: k._id,
      key: k.keyPrefix,
      name: k.name,
      createdAt: new Date(k._creationTime).toISOString(),
      lastUsed: k.lastUsed ? new Date(k.lastUsed).toISOString() : null,
      requestCount: k.requestCount,
    })),
    stats,
    isLoading,
  }
}
