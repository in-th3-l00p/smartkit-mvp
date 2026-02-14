import { describe, it, expect, beforeEach } from 'vitest'

// We need to test the SmartWalletService logic
// Since it uses in-memory DB, we can test directly

describe('SmartWalletService', () => {
  let walletService: any

  beforeEach(async () => {
    // Dynamic import to get fresh module each time
    const mod = await import('@/lib/smart-wallet')
    walletService = mod.walletService
  })

  describe('createWallet', () => {
    it('creates a wallet with correct fields', async () => {
      const wallet = await walletService.createWallet('test_user_1', 'test@example.com')

      expect(wallet).toBeDefined()
      expect(wallet.address).toBeDefined()
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(wallet.userId).toBe('test_user_1')
      expect(wallet.email).toBe('test@example.com')
      expect(wallet.deployed).toBe(false)
      expect(wallet.createdAt).toBeInstanceOf(Date)
    })

    it('returns existing wallet for same userId', async () => {
      const wallet1 = await walletService.createWallet('same_user', 'same@test.com')
      const wallet2 = await walletService.createWallet('same_user', 'same@test.com')

      expect(wallet1.address).toBe(wallet2.address)
      expect(wallet1.id).toBe(wallet2.id)
    })

    it('creates different wallets for different users', async () => {
      const wallet1 = await walletService.createWallet('user_a', 'a@test.com')
      const wallet2 = await walletService.createWallet('user_b', 'b@test.com')

      expect(wallet1.address).not.toBe(wallet2.address)
    })
  })

  describe('sendTransaction', () => {
    it('creates a pending transaction', async () => {
      const tx = await walletService.sendTransaction({
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        to: '0x000000000000000000000000000000000000dEaD',
        value: '0',
        data: '0x',
        sponsored: true,
      })

      expect(tx).toBeDefined()
      expect(tx.status).toBe('pending')
      expect(tx.userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
      expect(tx.gasSponsored).toBe(true)
      expect(tx.walletAddress).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
    })

    it('defaults to sponsored=true', async () => {
      const tx = await walletService.sendTransaction({
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        to: '0x000000000000000000000000000000000000dEaD',
        value: '0',
        data: '0x',
      })

      expect(tx.gasSponsored).toBe(true)
    })
  })

  describe('getStats', () => {
    it('returns stats object with correct fields', async () => {
      const stats = await walletService.getStats()

      expect(stats).toBeDefined()
      expect(typeof stats.totalWallets).toBe('number')
      expect(typeof stats.totalTransactions).toBe('number')
      expect(typeof stats.successfulTxs).toBe('number')
      expect(typeof stats.failedTxs).toBe('number')
      expect(typeof stats.pendingTxs).toBe('number')
      expect(typeof stats.totalGasSponsored).toBe('string')
      expect(typeof stats.successRate).toBe('string')
    })

    it('has seeded demo data', async () => {
      const stats = await walletService.getStats()

      expect(stats.totalWallets).toBeGreaterThan(0)
      expect(stats.totalTransactions).toBeGreaterThan(0)
    })
  })

  describe('getWallet', () => {
    it('finds wallet by address (case-insensitive)', async () => {
      const wallet = await walletService.getWallet('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
      expect(wallet).toBeDefined()
      expect(wallet?.email).toBe('alice@example.com')
    })

    it('returns undefined for unknown address', async () => {
      const wallet = await walletService.getWallet('0x0000000000000000000000000000000000000000')
      expect(wallet).toBeUndefined()
    })
  })

  describe('getTransactions', () => {
    it('returns all transactions when no filter', async () => {
      const txs = await walletService.getTransactions()
      expect(txs.length).toBeGreaterThan(0)
    })

    it('filters by wallet address', async () => {
      const txs = await walletService.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
      expect(txs.length).toBeGreaterThan(0)
      txs.forEach((tx: any) => {
        expect(tx.walletAddress.toLowerCase()).toBe('0x742d35cc6634c0532925a3b844bc9e7595f0beb0')
      })
    })
  })
})
