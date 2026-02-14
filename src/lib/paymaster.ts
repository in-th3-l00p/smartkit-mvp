import { createPublicClient, http, type Chain, type PublicClient } from 'viem'
import { config } from './config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPublicClient = PublicClient<any, any>

export function createPaymasterClient(chain?: Chain): AnyPublicClient {
  const targetChain = chain || config.chain
  const pimlicoUrl = `https://api.pimlico.io/v2/${targetChain.id}/rpc?apikey=${config.pimlicoApiKey}`

  return createPublicClient({
    chain: targetChain,
    transport: http(pimlicoUrl),
  })
}

export async function sponsorUserOperation(
  paymasterClient: AnyPublicClient,
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
    signature: `0x${string}`
  }
): Promise<{
  paymasterAndData: `0x${string}`
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
}> {
  const result = (await paymasterClient.request({
    method: 'pm_sponsorUserOperation' as any,
    params: [
      {
        sender: userOp.sender,
        nonce: `0x${userOp.nonce.toString(16)}`,
        initCode: userOp.initCode,
        callData: userOp.callData,
        callGasLimit: `0x${userOp.callGasLimit.toString(16)}`,
        verificationGasLimit: `0x${userOp.verificationGasLimit.toString(16)}`,
        preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
        maxFeePerGas: `0x${userOp.maxFeePerGas.toString(16)}`,
        maxPriorityFeePerGas: `0x${userOp.maxPriorityFeePerGas.toString(16)}`,
        paymasterAndData: '0x',
        signature: userOp.signature,
      },
      config.entryPointAddress,
      { sponsorshipPolicyId: config.pimlicoSponsorshipPolicyId || undefined },
    ] as any,
  })) as any

  return {
    paymasterAndData: result.paymasterAndData,
    callGasLimit: BigInt(result.callGasLimit),
    verificationGasLimit: BigInt(result.verificationGasLimit),
    preVerificationGas: BigInt(result.preVerificationGas),
  }
}
