import { describe, it, expect } from 'vitest'

// SmartWalletService now requires a real database connection.
// These tests validate the service's exported interface and types.
// Full integration tests with a test database are in tests/integration/.

describe('SmartWalletService', () => {
  describe('account utilities', () => {
    it('exports getCounterfactualAddress', async () => {
      const mod = await import('@/lib/account')
      expect(typeof mod.getCounterfactualAddress).toBe('function')
    })

    it('exports buildInitCode', async () => {
      const mod = await import('@/lib/account')
      expect(typeof mod.buildInitCode).toBe('function')
    })

    it('exports buildExecuteCallData', async () => {
      const mod = await import('@/lib/account')
      expect(typeof mod.buildExecuteCallData).toBe('function')
    })

    it('exports userIdToSalt', async () => {
      const mod = await import('@/lib/account')
      expect(typeof mod.userIdToSalt).toBe('function')
    })

    it('userIdToSalt is deterministic', async () => {
      const mod = await import('@/lib/account')
      const salt1 = mod.userIdToSalt('user_123')
      const salt2 = mod.userIdToSalt('user_123')
      expect(salt1).toBe(salt2)
    })

    it('userIdToSalt produces different salts for different users', async () => {
      const mod = await import('@/lib/account')
      const salt1 = mod.userIdToSalt('user_a')
      const salt2 = mod.userIdToSalt('user_b')
      expect(salt1).not.toBe(salt2)
    })
  })

  describe('bundler utilities', () => {
    it('exports createBundlerClient', async () => {
      const mod = await import('@/lib/bundler')
      expect(typeof mod.createBundlerClient).toBe('function')
    })

    it('exports sendUserOperation', async () => {
      const mod = await import('@/lib/bundler')
      expect(typeof mod.sendUserOperation).toBe('function')
    })

    it('exports estimateUserOperationGas', async () => {
      const mod = await import('@/lib/bundler')
      expect(typeof mod.estimateUserOperationGas).toBe('function')
    })
  })
})
