// In-memory database for MVP - replace with PostgreSQL/Drizzle in production
export interface Wallet {
  id: string
  address: string
  userId: string
  email: string
  salt: string
  deployed: boolean
  createdAt: Date
}

export interface Transaction {
  id: string
  walletAddress: string
  userOpHash: string
  txHash: string | null
  to: string
  value: string
  data: string
  status: 'pending' | 'submitted' | 'success' | 'failed'
  gasSponsored: boolean
  gasCost: string | null
  createdAt: Date
}

export interface ApiKey {
  id: string
  key: string
  name: string
  userId: string
  createdAt: Date
  lastUsed: Date | null
  requestCount: number
}

class InMemoryDB {
  wallets: Wallet[] = []
  transactions: Transaction[] = []
  apiKeys: ApiKey[] = []

  // Seed with demo data
  constructor() {
    this.seed()
  }

  private seed() {
    const now = new Date()

    // Demo wallets
    this.wallets = [
      {
        id: '1',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        userId: 'user_demo1',
        email: 'alice@example.com',
        salt: '0',
        deployed: true,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: '2',
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        userId: 'user_demo2',
        email: 'bob@example.com',
        salt: '1',
        deployed: true,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: '3',
        address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
        userId: 'user_demo3',
        email: 'carol@example.com',
        salt: '2',
        deployed: false,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    ]

    // Demo transactions
    this.transactions = [
      {
        id: '1',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        userOpHash: '0xabc123def456789012345678901234567890abcdef1234567890abcdef123456',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        value: '0',
        data: '0xa9059cbb',
        status: 'success',
        gasSponsored: true,
        gasCost: '0.0012',
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        id: '2',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        userOpHash: '0xdef456abc789012345678901234567890abcdef1234567890abcdef12345678',
        txHash: '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef',
        to: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        value: '1000000000000000',
        data: '0x',
        status: 'success',
        gasSponsored: true,
        gasCost: '0.0008',
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: '3',
        walletAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        userOpHash: '0x789abc012def345678901234567890abcdef1234567890abcdef1234567890',
        txHash: '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef',
        to: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        value: '0',
        data: '0x095ea7b3',
        status: 'success',
        gasSponsored: false,
        gasCost: '0.0015',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: '4',
        walletAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        userOpHash: '0x012def345abc678901234567890abcdef1234567890abcdef1234567890abcd',
        txHash: null,
        to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        value: '0',
        data: '0xa9059cbb',
        status: 'pending',
        gasSponsored: true,
        gasCost: null,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
      {
        id: '5',
        walletAddress: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
        userOpHash: '0x345abc678def901234567890abcdef1234567890abcdef1234567890abcdef',
        txHash: '0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef',
        to: '0x0000000000000000000000000000000000000000',
        value: '500000000000000',
        data: '0x',
        status: 'failed',
        gasSponsored: true,
        gasCost: '0.0005',
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    ]

    // Demo API key
    this.apiKeys = [
      {
        id: '1',
        key: 'sk_test_smartkit_demo_key_12345',
        name: 'Development Key',
        userId: 'user_demo1',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        requestCount: 142,
      },
    ]
  }
}

// Singleton
export const db = new InMemoryDB()
