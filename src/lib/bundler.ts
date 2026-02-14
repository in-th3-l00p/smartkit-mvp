import { createPublicClient, http, type Chain, type PublicClient } from 'viem'
import { config } from './config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPublicClient = PublicClient<any, any>

export function createBundlerClient(chain?: Chain): AnyPublicClient {
  const targetChain = chain || config.chain
  const pimlicoUrl = `https://api.pimlico.io/v2/${targetChain.id}/rpc?apikey=${config.pimlicoApiKey}`

  return createPublicClient({
    chain: targetChain,
    transport: http(pimlicoUrl),
  })
}

export async function sendUserOperation(
  bundlerClient: AnyPublicClient,
  userOp: {
    sender: `0x${string}`
    nonce: bigint
    initCode: `0x${string}`
    callData: `0x${string}`
    callGasLimit: bigint
    verificationGasLimit: bigint
    preVerificationGas: bigint
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
    paymasterAndData: `0x${string}`
    signature: `0x${string}`
  }
): Promise<`0x${string}`> {
  // ERC-4337 v0.7 uses PackedUserOperation format
  const packedUserOp = {
    sender: userOp.sender,
    nonce: `0x${userOp.nonce.toString(16)}`,
    initCode: userOp.initCode,
    callData: userOp.callData,
    accountGasLimits: packGasLimits(
      userOp.verificationGasLimit,
      userOp.callGasLimit
    ),
    preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
    gasFees: packGasFees(userOp.maxPriorityFeePerGas, userOp.maxFeePerGas),
    paymasterAndData: userOp.paymasterAndData,
    signature: userOp.signature,
  }

  const userOpHash = (await bundlerClient.request({
    method: 'eth_sendUserOperation' as any,
    params: [packedUserOp, config.entryPointAddress] as any,
  })) as `0x${string}`

  return userOpHash
}

export async function getUserOperationReceipt(
  bundlerClient: AnyPublicClient,
  userOpHash: `0x${string}`
): Promise<{
  success: boolean
  receipt: { transactionHash: `0x${string}`; gasUsed: bigint } | null
}> {
  try {
    const result = (await bundlerClient.request({
      method: 'eth_getUserOperationReceipt' as any,
      params: [userOpHash] as any,
    })) as any

    if (!result) {
      return { success: false, receipt: null }
    }

    return {
      success: result.success,
      receipt: {
        transactionHash: result.receipt.transactionHash,
        gasUsed: BigInt(result.receipt.gasUsed),
      },
    }
  } catch {
    return { success: false, receipt: null }
  }
}

export async function estimateUserOperationGas(
  bundlerClient: AnyPublicClient,
  userOp: {
    sender: `0x${string}`
    nonce: bigint
    initCode: `0x${string}`
    callData: `0x${string}`
    paymasterAndData: `0x${string}`
    signature: `0x${string}`
  }
): Promise<{
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
}> {
  const result = (await bundlerClient.request({
    method: 'eth_estimateUserOperationGas' as any,
    params: [
      {
        sender: userOp.sender,
        nonce: `0x${userOp.nonce.toString(16)}`,
        initCode: userOp.initCode,
        callData: userOp.callData,
        paymasterAndData: userOp.paymasterAndData,
        signature: userOp.signature,
      },
      config.entryPointAddress,
    ] as any,
  })) as any

  return {
    callGasLimit: BigInt(result.callGasLimit),
    verificationGasLimit: BigInt(result.verificationGasLimit),
    preVerificationGas: BigInt(result.preVerificationGas),
  }
}

function packGasLimits(
  verificationGasLimit: bigint,
  callGasLimit: bigint
): `0x${string}` {
  const packed = (verificationGasLimit << 128n) | callGasLimit
  return `0x${packed.toString(16).padStart(64, '0')}`
}

function packGasFees(
  maxPriorityFeePerGas: bigint,
  maxFeePerGas: bigint
): `0x${string}` {
  const packed = (maxPriorityFeePerGas << 128n) | maxFeePerGas
  return `0x${packed.toString(16).padStart(64, '0')}`
}
