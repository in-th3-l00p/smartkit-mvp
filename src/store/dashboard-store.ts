import { create } from 'zustand'

export interface Wallet {
  id: string
  address: string
  userId: string
  email: string
  salt: string
  deployed: boolean
  createdAt: string
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
  createdAt: string
}

export interface ApiKey {
  id: string
  key: string
  name: string
  createdAt: string
  lastUsed: string | null
  requestCount: number
}

export interface Stats {
  totalWallets: number
  totalTransactions: number
  successfulTxs: number
  failedTxs: number
  pendingTxs: number
  totalGasSponsored: string
  successRate: string
}

interface DashboardStore {
  wallets: Wallet[]
  transactions: Transaction[]
  apiKeys: ApiKey[]
  stats: Stats
  isLoading: boolean
  setWallets: (wallets: Wallet[]) => void
  setTransactions: (transactions: Transaction[]) => void
  setApiKeys: (apiKeys: ApiKey[]) => void
  setStats: (stats: Stats) => void
  setLoading: (loading: boolean) => void
  addWallet: (wallet: Wallet) => void
  addTransaction: (transaction: Transaction) => void
  addApiKey: (apiKey: ApiKey) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
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
  setWallets: (wallets) => set({ wallets }),
  setTransactions: (transactions) => set({ transactions }),
  setApiKeys: (apiKeys) => set({ apiKeys }),
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
  addWallet: (wallet) => set((state) => ({ wallets: [wallet, ...state.wallets] })),
  addTransaction: (transaction) => set((state) => ({ transactions: [transaction, ...state.transactions] })),
  addApiKey: (apiKey) => set((state) => ({ apiKeys: [apiKey, ...state.apiKeys] })),
}))
