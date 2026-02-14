'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '@/store/dashboard-store'

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url)
    if (!res.ok) return fallback
    const contentType = res.headers.get('content-type')
    if (!contentType?.includes('application/json')) return fallback
    return await res.json()
  } catch {
    return fallback
  }
}

const defaultStats = {
  totalWallets: 0,
  totalTransactions: 0,
  successfulTxs: 0,
  failedTxs: 0,
  pendingTxs: 0,
  totalGasSponsored: '0',
  successRate: '0%',
}

export function useDashboard() {
  const store = useDashboardStore()

  useEffect(() => {
    async function fetchData() {
      store.setLoading(true)
      try {
        const [wallets, transactions, stats, apiKeys] = await Promise.all([
          fetchJson('/api/wallets', []),
          fetchJson('/api/transactions', []),
          fetchJson('/api/stats', defaultStats),
          fetchJson('/api/keys', []),
        ])
        store.setWallets(wallets)
        store.setTransactions(transactions)
        store.setStats(stats)
        store.setApiKeys(apiKeys)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        store.setLoading(false)
      }
    }
    fetchData()
  }, [])

  return store
}
