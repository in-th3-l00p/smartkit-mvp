import { baseSepolia, arbitrumSepolia, optimismSepolia, type Chain } from 'viem/chains'
import { getConvexClient } from './convex'
import { api } from '../../convex/_generated/api'

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

// Static chain metadata (non-deployment info)
const chainMeta: Record<number, {
  chain: Chain
  rpcUrl: string
  bundlerUrl: string
  blockExplorerUrl: string
  envFactory: string
  envPaymaster: string
}> = {
  [baseSepolia.id]: {
    chain: baseSepolia,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    bundlerUrl: `https://api.pimlico.io/v2/${baseSepolia.id}/rpc?apikey=${pimlicoApiKey}`,
    blockExplorerUrl: 'https://sepolia.basescan.org',
    envFactory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
    envPaymaster: process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  },
  [arbitrumSepolia.id]: {
    chain: arbitrumSepolia,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    bundlerUrl: `https://api.pimlico.io/v2/${arbitrumSepolia.id}/rpc?apikey=${pimlicoApiKey}`,
    blockExplorerUrl: 'https://sepolia.arbiscan.io',
    envFactory: process.env.ARBITRUM_SEPOLIA_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
    envPaymaster: process.env.ARBITRUM_SEPOLIA_PAYMASTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  },
  [optimismSepolia.id]: {
    chain: optimismSepolia,
    rpcUrl: 'https://sepolia.optimism.io',
    bundlerUrl: `https://api.pimlico.io/v2/${optimismSepolia.id}/rpc?apikey=${pimlicoApiKey}`,
    blockExplorerUrl: 'https://sepolia-optimism.etherscan.io',
    envFactory: process.env.OP_SEPOLIA_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
    envPaymaster: process.env.OP_SEPOLIA_PAYMASTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  },
}

// In-memory cache for deployment addresses
const deploymentCache = new Map<number, { factory: string; paymaster: string; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const supportedChains = Object.values(chainMeta).map((c) => c.chain)

export const defaultChainId = baseSepolia.id

// Synchronous accessor using env vars (backward compatibility)
export const chainRegistry: Record<number, ChainConfig> = Object.fromEntries(
  Object.entries(chainMeta).map(([id, meta]) => [
    Number(id),
    {
      chain: meta.chain,
      entryPointAddress: ENTRY_POINT_V07,
      factoryAddress: meta.envFactory as `0x${string}`,
      paymasterAddress: meta.envPaymaster as `0x${string}`,
      rpcUrl: meta.rpcUrl,
      bundlerUrl: meta.bundlerUrl,
      blockExplorerUrl: meta.blockExplorerUrl,
    },
  ])
)

export async function getChainConfig(chainId: number): Promise<ChainConfig> {
  const meta = chainMeta[chainId]
  if (!meta) {
    throw new Error(`Unsupported chain: ${chainId}`)
  }

  // Check cache
  const cached = deploymentCache.get(chainId)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return {
      chain: meta.chain,
      entryPointAddress: ENTRY_POINT_V07,
      factoryAddress: cached.factory as `0x${string}`,
      paymasterAddress: cached.paymaster as `0x${string}`,
      rpcUrl: meta.rpcUrl,
      bundlerUrl: meta.bundlerUrl,
      blockExplorerUrl: meta.blockExplorerUrl,
    }
  }

  // Try fetching from Convex deployments table
  try {
    const convex = getConvexClient()
    const result = await convex.query(api.deployments.getFactoryAndPaymaster, { chainId })

    const factory = result.factoryAddress || meta.envFactory
    const paymaster = result.paymasterAddress || meta.envPaymaster

    deploymentCache.set(chainId, { factory, paymaster, ts: Date.now() })

    return {
      chain: meta.chain,
      entryPointAddress: ENTRY_POINT_V07,
      factoryAddress: factory as `0x${string}`,
      paymasterAddress: paymaster as `0x${string}`,
      rpcUrl: meta.rpcUrl,
      bundlerUrl: meta.bundlerUrl,
      blockExplorerUrl: meta.blockExplorerUrl,
    }
  } catch {
    // Fallback to env vars
    return {
      chain: meta.chain,
      entryPointAddress: ENTRY_POINT_V07,
      factoryAddress: meta.envFactory as `0x${string}`,
      paymasterAddress: meta.envPaymaster as `0x${string}`,
      rpcUrl: meta.rpcUrl,
      bundlerUrl: meta.bundlerUrl,
      blockExplorerUrl: meta.blockExplorerUrl,
    }
  }
}
