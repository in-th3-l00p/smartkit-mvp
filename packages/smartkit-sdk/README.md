# @smartkit/sdk

The easiest way to add ERC-4337 smart wallets to your app.

## Installation

```bash
npm install @smartkit/sdk
```

## Quick Start

```typescript
import SmartKit from '@smartkit/sdk'

const smartkit = new SmartKit({
  apiKey: 'sk_test_your_api_key',
})

// Create a smart wallet
const wallet = await smartkit.createWallet({
  userId: 'user_123',
  email: 'user@example.com',
})
console.log('Wallet address:', wallet.address)

// Send a gasless transaction
const tx = await smartkit.sendTransaction({
  walletAddress: wallet.address,
  to: '0x...',
  value: '0',
  data: '0x',
  sponsored: true,
})

// Wait for confirmation
const result = await smartkit.waitForTransaction(tx.userOpHash)
console.log('Transaction status:', result.status)
```

## API Reference

### `new SmartKit(config)`
- `apiKey` (required): Your SmartKit API key
- `apiUrl` (optional): Custom API URL (default: production)

### `smartkit.createWallet(params)`
Create a new smart wallet.

### `smartkit.sendTransaction(params)`
Send a gasless transaction.

### `smartkit.waitForTransaction(hash, options?)`
Wait for a transaction to be confirmed.

### `smartkit.getWallet(address)`
Get wallet details and transaction history.

### `smartkit.getStats()`
Get dashboard statistics.
