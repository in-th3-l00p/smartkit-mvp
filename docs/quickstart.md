# SmartKit Quick Start Guide

Get started with SmartKit in under 5 minutes.

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
npm install @smartkit/sdk
```

## Setup

### 1. Get your API key

Visit the [SmartKit Dashboard](/dashboard/api-keys) and create a new API key.

### 2. Initialize the SDK

```typescript
import SmartKit from '@smartkit/sdk'

const smartkit = new SmartKit({
  apiKey: 'sk_test_your_api_key',
  // apiUrl: 'http://localhost:3000/api' // for local development
})
```

### 3. Create a Smart Wallet

```typescript
const wallet = await smartkit.createWallet({
  userId: 'user_123',       // Your app's user ID
  email: 'user@example.com' // User's email
})

console.log('Wallet address:', wallet.address)
// The address is deterministic - same inputs always produce same address
```

### 4. Send a Gasless Transaction

```typescript
const tx = await smartkit.sendTransaction({
  walletAddress: wallet.address,
  to: '0xRecipientAddress...',
  value: '0',          // Amount in wei
  data: '0x',          // Calldata
  sponsored: true      // Gas is paid by paymaster
})

console.log('UserOp hash:', tx.userOpHash)
```

### 5. Wait for Confirmation

```typescript
const result = await smartkit.waitForTransaction(tx.userOpHash, {
  timeout: 60000,   // 60 seconds
  interval: 2000    // Poll every 2 seconds
})

if (result.status === 'success') {
  console.log('Transaction confirmed:', result.txHash)
} else {
  console.error('Transaction failed')
}
```

## What's Next?

- [API Reference](./api.md) - Full API documentation
- [Dashboard](/dashboard) - Monitor wallets and transactions
- [Examples](./examples/) - More integration examples

## Architecture

SmartKit uses the ERC-4337 Account Abstraction standard:

1. **Smart Wallets** - ERC-4337 compliant smart contract wallets
2. **Bundler** - Processes UserOperations and submits them on-chain
3. **Paymaster** - Sponsors gas fees for your users
4. **EntryPoint** - The singleton contract that validates and executes UserOps

All complexity is abstracted away by the SDK. You just call `createWallet()` and `sendTransaction()`.
