import { createPublicClient, http, keccak256, toBytes } from 'viem'
import { config } from './config'
import { db, type Wallet, type Transaction } from './db/schema'
import { v4 as uuidv4 } from 'uuid'

const publicClient = createPublicClient({
  chain: config.chain,
  transport: http(config.rpcUrl),
})

export class SmartWalletService {
  async createWallet(userId: string, email: string): Promise<Wallet> {
    // Check if user already has wallet
    const existing = db.wallets.find(w => w.userId === userId)
    if (existing) return existing

    // Generate deterministic salt from userId
    const salt = keccak256(toBytes(userId))

    // Compute counterfactual address (CREATE2)
    const address = this.computeAddress(salt)

    const wallet: Wallet = {
      id: uuidv4(),
      address,
      userId,
      email,
      salt,
      deployed: false,
      createdAt: new Date(),
    }

    db.wallets.push(wallet)
    return wallet
  }

  async getWallet(address: string): Promise<Wallet | undefined> {
    return db.wallets.find(w => w.address.toLowerCase() === address.toLowerCase())
  }

  async getAllWallets(): Promise<Wallet[]> {
    return db.wallets
  }

  async sendTransaction(params: {
    walletAddress: string
    to: string
    value: string
    data: string
    sponsored?: boolean
  }): Promise<Transaction> {
    const tx: Transaction = {
      id: uuidv4(),
      walletAddress: params.walletAddress,
      userOpHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      txHash: null,
      to: params.to,
      value: params.value,
      data: params.data,
      status: 'pending',
      gasSponsored: params.sponsored ?? true,
      gasCost: null,
      createdAt: new Date(),
    }

    db.transactions.push(tx)

    // Simulate async processing
    setTimeout(() => {
      tx.status = 'submitted'
      setTimeout(() => {
        tx.txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')
        tx.status = Math.random() > 0.1 ? 'success' : 'failed'
        tx.gasCost = (Math.random() * 0.003 + 0.0005).toFixed(4)
      }, 2000)
    }, 1000)

    return tx
  }

  async getTransaction(hash: string): Promise<Transaction | undefined> {
    return db.transactions.find(t => t.userOpHash === hash || t.txHash === hash)
  }

  async getTransactions(walletAddress?: string): Promise<Transaction[]> {
    if (walletAddress) {
      return db.transactions.filter(t => t.walletAddress.toLowerCase() === walletAddress.toLowerCase())
    }
    return db.transactions
  }

  async getStats() {
    const totalWallets = db.wallets.length
    const totalTransactions = db.transactions.length
    const successfulTxs = db.transactions.filter(t => t.status === 'success').length
    const sponsoredTxs = db.transactions.filter(t => t.gasSponsored)
    const totalGasSponsored = sponsoredTxs
      .reduce((sum, t) => sum + parseFloat(t.gasCost || '0'), 0)
      .toFixed(4)

    return {
      totalWallets,
      totalTransactions,
      successfulTxs,
      failedTxs: db.transactions.filter(t => t.status === 'failed').length,
      pendingTxs: db.transactions.filter(t => t.status === 'pending' || t.status === 'submitted').length,
      totalGasSponsored,
      successRate: totalTransactions > 0 ? ((successfulTxs / totalTransactions) * 100).toFixed(1) : '0',
    }
  }

  private computeAddress(salt: string): string {
    // Simulated CREATE2 address computation
    const hash = keccak256(toBytes(salt + config.factoryAddress))
    return '0x' + hash.slice(26) // Last 20 bytes
  }
}

export const walletService = new SmartWalletService()
