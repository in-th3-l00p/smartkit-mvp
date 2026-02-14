export interface SmartKitConfig {
  apiKey: string
  apiUrl?: string
}

export interface CreateWalletParams {
  userId: string
  email: string
}

export interface CreateWalletResponse {
  id: string
  address: string
  userId: string
  email: string
  deployed: boolean
  createdAt: string
}

export interface SendTransactionParams {
  walletAddress: string
  to: string
  value?: string
  data?: string
  sponsored?: boolean
}

export interface SendTransactionResponse {
  id: string
  walletAddress: string
  userOpHash: string
  txHash: string | null
  status: 'pending' | 'submitted' | 'success' | 'failed'
  gasSponsored: boolean
  gasCost: string | null
  createdAt: string
}

export interface WalletDetails extends CreateWalletResponse {
  transactions: SendTransactionResponse[]
}

export interface TransactionStatus {
  id: string
  userOpHash: string
  txHash: string | null
  status: 'pending' | 'submitted' | 'success' | 'failed'
  gasCost: string | null
}

export interface DashboardStats {
  totalWallets: number
  totalTransactions: number
  successfulTxs: number
  failedTxs: number
  pendingTxs: number
  totalGasSponsored: string
  successRate: string
}

export class SmartKit {
  private apiKey: string
  private apiUrl: string

  constructor(config: SmartKitConfig) {
    if (!config.apiKey) {
      throw new Error('SmartKit: apiKey is required')
    }
    this.apiKey = config.apiKey
    this.apiUrl = config.apiUrl || 'http://localhost:3000/api'
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.apiUrl}${path}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new SmartKitError(
        error.error || `Request failed with status ${response.status}`,
        response.status
      )
    }

    return response.json()
  }

  async createWallet(params: CreateWalletParams): Promise<CreateWalletResponse> {
    return this.request<CreateWalletResponse>('/wallets/create', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async getWallet(address: string): Promise<WalletDetails> {
    return this.request<WalletDetails>(`/wallets/${address}`)
  }

  async listWallets(): Promise<CreateWalletResponse[]> {
    return this.request<CreateWalletResponse[]>('/wallets')
  }

  async sendTransaction(params: SendTransactionParams): Promise<SendTransactionResponse> {
    return this.request<SendTransactionResponse>('/transactions/send', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async getTransaction(hash: string): Promise<TransactionStatus> {
    return this.request<TransactionStatus>(`/transactions/${hash}`)
  }

  async listTransactions(): Promise<SendTransactionResponse[]> {
    return this.request<SendTransactionResponse[]>('/transactions')
  }

  async getStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/stats')
  }

  async waitForTransaction(
    userOpHash: string,
    options?: { timeout?: number; interval?: number }
  ): Promise<TransactionStatus> {
    const timeout = options?.timeout || 60000
    const interval = options?.interval || 2000
    const start = Date.now()

    while (Date.now() - start < timeout) {
      const tx = await this.getTransaction(userOpHash)
      if (tx.status === 'success' || tx.status === 'failed') {
        return tx
      }
      await new Promise(resolve => setTimeout(resolve, interval))
    }

    throw new SmartKitError('Transaction timeout', 408)
  }
}

export class SmartKitError extends Error {
  public statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'SmartKitError'
    this.statusCode = statusCode
  }
}

export default SmartKit
