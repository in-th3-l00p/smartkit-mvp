import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('SmartKit SDK', () => {
  let SmartKit: any

  beforeEach(async () => {
    const mod = await import('../../packages/smartkit-sdk/src/index')
    SmartKit = mod.SmartKit
  })

  it('throws if apiKey is missing', () => {
    expect(() => new SmartKit({ apiKey: '' })).toThrow('apiKey is required')
  })

  it('initializes with default apiUrl', () => {
    const kit = new SmartKit({ apiKey: 'sk_test_123' })
    expect(kit).toBeDefined()
  })

  it('accepts custom apiUrl', () => {
    const kit = new SmartKit({ apiKey: 'sk_test_123', apiUrl: 'http://custom:4000/api' })
    expect(kit).toBeDefined()
  })

  it('has all expected methods', () => {
    const kit = new SmartKit({ apiKey: 'sk_test_123' })
    expect(typeof kit.createWallet).toBe('function')
    expect(typeof kit.getWallet).toBe('function')
    expect(typeof kit.listWallets).toBe('function')
    expect(typeof kit.sendTransaction).toBe('function')
    expect(typeof kit.getTransaction).toBe('function')
    expect(typeof kit.listTransactions).toBe('function')
    expect(typeof kit.getStats).toBe('function')
    expect(typeof kit.waitForTransaction).toBe('function')
  })
})

describe('SmartKitError', () => {
  it('has correct name and statusCode', async () => {
    const { SmartKitError } = await import('../../packages/smartkit-sdk/src/index')
    const error = new SmartKitError('test error', 404)
    expect(error.name).toBe('SmartKitError')
    expect(error.message).toBe('test error')
    expect(error.statusCode).toBe(404)
    expect(error instanceof Error).toBe(true)
  })
})
