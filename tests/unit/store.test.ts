import { describe, it, expect, beforeEach } from 'vitest'

describe('Dashboard Store', () => {
  let useDashboardStore: any

  beforeEach(async () => {
    const mod = await import('@/store/dashboard-store')
    useDashboardStore = mod.useDashboardStore
    // Reset store
    useDashboardStore.setState({
      wallets: [],
      transactions: [],
      apiKeys: [],
      stats: {
        totalWallets: 0,
        totalTransactions: 0,
        successfulTxs: 0,
        failedTxs: 0,
        pendingTxs: 0,
        totalGasSponsored: '0',
        successRate: '0',
      },
      isLoading: true,
    })
  })

  it('starts with empty state', () => {
    const state = useDashboardStore.getState()
    expect(state.wallets).toEqual([])
    expect(state.transactions).toEqual([])
    expect(state.isLoading).toBe(true)
  })

  it('sets wallets', () => {
    const wallets = [{ id: '1', address: '0x123', userId: 'u1', email: 'a@b.com', salt: '0', deployed: false, createdAt: '2024-01-01' }]
    useDashboardStore.getState().setWallets(wallets)
    expect(useDashboardStore.getState().wallets).toEqual(wallets)
  })

  it('adds a wallet', () => {
    const wallet = { id: '1', address: '0x123', userId: 'u1', email: 'a@b.com', salt: '0', deployed: false, createdAt: '2024-01-01' }
    useDashboardStore.getState().addWallet(wallet)
    expect(useDashboardStore.getState().wallets).toHaveLength(1)
    expect(useDashboardStore.getState().wallets[0]).toEqual(wallet)
  })

  it('sets loading state', () => {
    useDashboardStore.getState().setLoading(false)
    expect(useDashboardStore.getState().isLoading).toBe(false)
  })

  it('adds transaction at beginning', () => {
    const tx1 = { id: '1', walletAddress: '0x1', userOpHash: '0xa', txHash: null, to: '0x2', value: '0', data: '0x', status: 'pending' as const, gasSponsored: true, gasCost: null, createdAt: '2024-01-01' }
    const tx2 = { id: '2', walletAddress: '0x1', userOpHash: '0xb', txHash: null, to: '0x2', value: '0', data: '0x', status: 'pending' as const, gasSponsored: true, gasCost: null, createdAt: '2024-01-02' }
    useDashboardStore.getState().addTransaction(tx1)
    useDashboardStore.getState().addTransaction(tx2)
    const txs = useDashboardStore.getState().transactions
    expect(txs).toHaveLength(2)
    expect(txs[0].id).toBe('2') // Most recent first
  })
})
