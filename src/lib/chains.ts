import { baseSepolia, arbitrumSepolia, optimismSepolia, type Chain } from 'viem/chains'

export interface ChainConfig {
  chain: Chain
  entryPointAddress: `0x${string}`
  factoryAddress: `0x${string}`
  paymasterAddress: `0x${string}`
  rpcUrl: string
  bundlerUrl: string
  blockExplorerUrl: string
}

// ERC-4337 EntryPoint v0.7 (same on all chains)
const ENTRY_POINT_V07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as `0x${string}`

const pimlicoApiKey = process.env.PIMLICO_API_KEY || ''

export const chainRegistry: Record<number, ChainConfig> = {
  [baseSepolia.id]: {
    chain: baseSepolia,
    entryPointAddress: ENTRY_POINT_V07,
    factoryAddress: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ||
      '0x0000000000000000000000000000000000000000') as `0x${string}`,
    paymasterAddress: (process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS ||
      '0x0000000000000000000000000000000000000000') as `0x${string}`,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    bundlerUrl: `https://api.pimlico.io/v2/${baseSepolia.id}/rpc?apikey=${pimlicoApiKey}`,
    blockExplorerUrl: 'https://sepolia.basescan.org',
  },
  [arbitrumSepolia.id]: {
    chain: arbitrumSepolia,
    entryPointAddress: ENTRY_POINT_V07,
    factoryAddress: (process.env.ARBITRUM_SEPOLIA_FACTORY_ADDRESS ||
      '0x0000000000000000000000000000000000000000') as `0x${string}`,
    paymasterAddress: (process.env.ARBITRUM_SEPOLIA_PAYMASTER_ADDRESS ||
      '0x0000000000000000000000000000000000000000') as `0x${string}`,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    bundlerUrl: `https://api.pimlico.io/v2/${arbitrumSepolia.id}/rpc?apikey=${pimlicoApiKey}`,
    blockExplorerUrl: 'https://sepolia.arbiscan.io',
  },
  [optimismSepolia.id]: {
    chain: optimismSepolia,
    entryPointAddress: ENTRY_POINT_V07,
    factoryAddress: (process.env.OP_SEPOLIA_FACTORY_ADDRESS ||
      '0x0000000000000000000000000000000000000000') as `0x${string}`,
    paymasterAddress: (process.env.OP_SEPOLIA_PAYMASTER_ADDRESS ||
      '0x0000000000000000000000000000000000000000') as `0x${string}`,
    rpcUrl: 'https://sepolia.optimism.io',
    bundlerUrl: `https://api.pimlico.io/v2/${optimismSepolia.id}/rpc?apikey=${pimlicoApiKey}`,
    blockExplorerUrl: 'https://sepolia-optimism.etherscan.io',
  },
}

export const supportedChains = Object.values(chainRegistry).map((c) => c.chain)

export const defaultChainId = baseSepolia.id

export function getChainConfig(chainId: number): ChainConfig {
  const config = chainRegistry[chainId]
  if (!config) {
    throw new Error(`Unsupported chain: ${chainId}`)
  }
  return config
}
