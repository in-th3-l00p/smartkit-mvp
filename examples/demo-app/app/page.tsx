'use client'

import { useState } from 'react'

// In a real app, you'd import from @smartkit/sdk
// import SmartKit from '@smartkit/sdk'
// For demo, we call the API directly
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

interface Wallet {
  id: string
  address: string
  email: string
  deployed: boolean
}

interface Transaction {
  id: string
  userOpHash: string
  txHash: string | null
  status: string
  gasSponsored: boolean
}

export default function DemoPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [email, setEmail] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const createWallet = async () => {
    if (!email) return
    setIsCreating(true)
    try {
      const res = await fetch(`${API_URL}/wallets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: `demo_${Date.now()}`, email }),
      })
      const data = await res.json()
      setWallet(data)
      setStep(2)
    } catch (error) {
      console.error('Failed to create wallet:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const sendGaslessTransaction = async () => {
    if (!wallet) return
    setIsSending(true)
    try {
      const res = await fetch(`${API_URL}/transactions/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.address,
          to: '0x000000000000000000000000000000000000dEaD',
          value: '0',
          data: '0x',
          sponsored: true,
        }),
      })
      const tx = await res.json()
      setTransactions(prev => [tx, ...prev])
      setStep(3)
    } catch (error) {
      console.error('Failed to send transaction:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)', color: 'white', padding: '2rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.75rem', marginBottom: '1rem', color: '#818cf8' }}>
            SmartKit Demo
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
            Gasless Transactions
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
            Create a smart wallet and send transactions without paying gas
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              opacity: step >= s ? 1 : 0.3,
            }}>
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.875rem', fontWeight: 'bold',
                background: step >= s ? '#6366f1' : '#333',
              }}>
                {step > s ? '\u2713' : s}
              </div>
              <span style={{ fontSize: '0.875rem' }}>
                {s === 1 ? 'Create Wallet' : s === 2 ? 'Send TX' : 'Done!'}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Create Wallet */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: '1rem',
          border: '1px solid rgba(255,255,255,0.1)', padding: '2rem',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginTop: 0 }}>
            Step 1: Create Smart Wallet
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Enter your email to create an ERC-4337 smart contract wallet on Base Sepolia.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!wallet}
              style={{
                flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem',
                border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)',
                color: 'white', fontSize: '0.875rem', outline: 'none',
              }}
            />
            <button
              onClick={createWallet}
              disabled={isCreating || !!wallet || !email}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                background: wallet ? '#22c55e' : '#6366f1',
                color: 'white', border: 'none', fontWeight: '600',
                cursor: wallet ? 'default' : 'pointer', fontSize: '0.875rem',
                opacity: (isCreating || !email) && !wallet ? 0.5 : 1,
              }}
            >
              {wallet ? '\u2713 Created' : isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
          {wallet && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(34,197,94,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#86efac', fontWeight: '600' }}>Wallet Address</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#bbf7d0', wordBreak: 'break-all' }}>
                {wallet.address}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Send Transaction */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: '1rem',
          border: '1px solid rgba(255,255,255,0.1)', padding: '2rem',
          marginBottom: '1.5rem',
          opacity: wallet ? 1 : 0.4,
          pointerEvents: wallet ? 'auto' : 'none',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginTop: 0 }}>
            Step 2: Send Gasless Transaction
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Send a transaction without paying gas. The paymaster sponsors the fees.
          </p>
          <button
            onClick={sendGaslessTransaction}
            disabled={isSending || !wallet}
            style={{
              width: '100%', padding: '0.875rem', borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', border: 'none', fontWeight: '600',
              cursor: 'pointer', fontSize: '1rem', marginTop: '1rem',
              opacity: isSending ? 0.5 : 1,
            }}
          >
            {isSending ? 'Sending...' : 'Send Gasless Transaction'}
          </button>
        </div>

        {/* Transactions */}
        {transactions.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: '1rem',
            border: '1px solid rgba(255,255,255,0.1)', padding: '2rem',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginTop: 0 }}>
              Transactions
            </h2>
            {transactions.map((tx, i) => (
              <div key={i} style={{
                padding: '0.75rem', background: 'rgba(0,0,0,0.3)',
                borderRadius: '0.5rem', marginBottom: '0.5rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                    {tx.userOpHash.slice(0, 16)}...
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem',
                    background: tx.status === 'success' ? 'rgba(34,197,94,0.2)' : tx.status === 'failed' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)',
                    color: tx.status === 'success' ? '#86efac' : tx.status === 'failed' ? '#fca5a5' : '#fde047',
                  }}>
                    {tx.status}
                  </span>
                </div>
                {tx.gasSponsored && (
                  <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '0.25rem' }}>
                    Gas sponsored by paymaster
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '3rem', color: '#64748b', fontSize: '0.875rem' }}>
          Built with <a href="/" style={{ color: '#818cf8', textDecoration: 'none' }}>SmartKit</a> &bull; ERC-4337 on Base Sepolia
        </div>
      </div>
    </div>
  )
}
