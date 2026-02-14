import { describe, it, expect } from 'vitest'
import { db } from '@/lib/db/schema'

describe('InMemoryDB', () => {
  it('has seeded wallets', () => {
    expect(db.wallets.length).toBeGreaterThan(0)
  })

  it('has seeded transactions', () => {
    expect(db.transactions.length).toBeGreaterThan(0)
  })

  it('has seeded API keys', () => {
    expect(db.apiKeys.length).toBeGreaterThan(0)
  })

  it('wallets have correct structure', () => {
    const wallet = db.wallets[0]
    expect(wallet.id).toBeDefined()
    expect(wallet.address).toMatch(/^0x/)
    expect(wallet.userId).toBeDefined()
    expect(wallet.email).toContain('@')
    expect(typeof wallet.deployed).toBe('boolean')
    expect(wallet.createdAt).toBeInstanceOf(Date)
  })

  it('transactions have correct structure', () => {
    const tx = db.transactions[0]
    expect(tx.id).toBeDefined()
    expect(tx.walletAddress).toMatch(/^0x/)
    expect(tx.userOpHash).toMatch(/^0x/)
    expect(['pending', 'submitted', 'success', 'failed']).toContain(tx.status)
    expect(typeof tx.gasSponsored).toBe('boolean')
  })

  it('API keys have correct structure', () => {
    const key = db.apiKeys[0]
    expect(key.id).toBeDefined()
    expect(key.key).toMatch(/^sk_test_/)
    expect(key.name).toBeDefined()
    expect(typeof key.requestCount).toBe('number')
  })
})
