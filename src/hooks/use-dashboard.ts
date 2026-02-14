'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '@/store/dashboard-store'

export function useDashboard() {
  const store = useDashboardStore()

  useEffect(() => {
    async function fetchData() {
      store.setLoading(true)
      try {
        const [walletsRes, txsRes, statsRes, keysRes] = await Promise.all([
          fetch('/api/wallets'),
          fetch('/api/transactions'),
          fetch('/api/stats'),
          fetch('/api/keys'),
        ])
        const [wallets, transactions, stats, apiKeys] = await Promise.all([
          walletsRes.json(),
          txsRes.json(),
          statsRes.json(),
          keysRes.json(),
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
