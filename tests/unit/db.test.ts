import { describe, it, expect } from 'vitest'
import { wallets, transactions, apiKeys, projects } from '@/lib/db/schema'

describe('Database Schema', () => {
  it('exports wallets table', () => {
    expect(wallets).toBeDefined()
  })

  it('exports transactions table', () => {
    expect(transactions).toBeDefined()
  })

  it('exports apiKeys table', () => {
    expect(apiKeys).toBeDefined()
  })

  it('exports projects table', () => {
    expect(projects).toBeDefined()
  })
})
