import { baseSepolia } from 'viem/chains'

export const config = {
  chain: baseSepolia,
  entryPointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as `0x${string}`,
  factoryAddress: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  paymasterAddress: (process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  pimlicoApiKey: process.env.PIMLICO_API_KEY || '',
  rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  apiKeySecret: process.env.API_KEY_SECRET || 'smartkit-dev-secret',
}
