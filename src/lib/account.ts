import {
  createPublicClient,
  http,
  encodeFunctionData,
  type Chain,
  type Address,
  keccak256,
  toBytes,
  concat,
  pad,
  toHex,
} from 'viem'
import { privateKeyToAccount, signMessage } from 'viem/accounts'
import { config } from './config'

// ABI fragments for our contracts
const FACTORY_ABI = [
  {
    name: 'createAccount',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'salt', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getAddress',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'salt', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const

const ACCOUNT_ABI = [
  {
    name: 'execute',
    type: 'function',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'executeBatch',
    type: 'function',
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'datas', type: 'bytes[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

const ENTRY_POINT_ABI = [
  {
    name: 'getNonce',
    type: 'function',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'key', type: 'uint192' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

// Operator account (custodial MVP - signs on behalf of users)
function getOperatorAccount() {
  const privateKey = process.env.OPERATOR_PRIVATE_KEY
  if (!privateKey) {
    throw new Error(
      'OPERATOR_PRIVATE_KEY not set. Required for signing UserOperations.'
    )
  }
  return privateKeyToAccount(privateKey as `0x${string}`)
}

export function getOperatorAddress(): Address {
  return getOperatorAccount().address
}

export async function getCounterfactualAddress(
  salt: bigint,
  chain?: Chain
): Promise<Address> {
  const client = createPublicClient({
    chain: chain || config.chain,
    transport: http(config.rpcUrl),
  })

  const address = await client.readContract({
    address: config.factoryAddress,
    abi: FACTORY_ABI,
    functionName: 'getAddress',
    args: [getOperatorAddress(), salt],
  })

  return address
}

export function buildInitCode(salt: bigint): `0x${string}` {
  const initCallData = encodeFunctionData({
    abi: FACTORY_ABI,
    functionName: 'createAccount',
    args: [getOperatorAddress(), salt],
  })

  return concat([config.factoryAddress, initCallData])
}

export function buildExecuteCallData(
  target: Address,
  value: bigint,
  data: `0x${string}`
): `0x${string}` {
  return encodeFunctionData({
    abi: ACCOUNT_ABI,
    functionName: 'execute',
    args: [target, value, data],
  })
}

export function buildExecuteBatchCallData(
  targets: Address[],
  values: bigint[],
  datas: `0x${string}`[]
): `0x${string}` {
  return encodeFunctionData({
    abi: ACCOUNT_ABI,
    functionName: 'executeBatch',
    args: [targets, values, datas],
  })
}

export async function getNonce(
  sender: Address,
  chain?: Chain
): Promise<bigint> {
  const client = createPublicClient({
    chain: chain || config.chain,
    transport: http(config.rpcUrl),
  })

  return client.readContract({
    address: config.entryPointAddress,
    abi: ENTRY_POINT_ABI,
    functionName: 'getNonce',
    args: [sender, 0n],
  })
}

export async function signUserOpHash(
  userOpHash: `0x${string}`
): Promise<`0x${string}`> {
  const account = getOperatorAccount()
  return account.signMessage({ message: { raw: toBytes(userOpHash) } })
}

export async function isDeployed(
  address: Address,
  chain?: Chain
): Promise<boolean> {
  const client = createPublicClient({
    chain: chain || config.chain,
    transport: http(config.rpcUrl),
  })

  const code = await client.getCode({ address })
  return !!code && code !== '0x'
}

// Convert a userId string to a deterministic salt
export function userIdToSalt(userId: string): bigint {
  const hash = keccak256(toBytes(userId))
  return BigInt(hash)
}
