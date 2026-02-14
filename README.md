# SmartKit MVP

The easiest way to add ERC-4337 smart wallets to your app.

## Quick Start

```bash
npm install @smartkit/sdk
```

```typescript
import SmartKit from '@smartkit/sdk'

const smartkit = new SmartKit({ apiKey: 'sk_test_...' })

// Create a smart wallet
const wallet = await smartkit.createWallet({
  userId: 'user_123',
  email: 'user@example.com'
})

// Send a gasless transaction
const tx = await smartkit.sendTransaction({
  walletAddress: wallet.address,
  to: '0x...',
  value: '0',
  data: '0x',
  sponsored: true
})

// Wait for confirmation
const result = await smartkit.waitForTransaction(tx.userOpHash)
```

## Features

- **5-minute integration** - Simple SDK with TypeScript support
- **Gasless transactions** - Built-in paymaster sponsorship
- **Smart wallets** - ERC-4337 smart contract wallets with deterministic addresses
- **Developer dashboard** - Monitor wallets, transactions, and gas usage
- **Social recovery** - Account recovery via trusted guardians
- **Multi-chain ready** - Built on Base Sepolia, extensible to other L2s

## Architecture

```
smartkit-mvp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # REST API routes
│   │   │   ├── wallets/        # Wallet CRUD
│   │   │   ├── transactions/   # Transaction management
│   │   │   ├── stats/          # Dashboard analytics
│   │   │   └── keys/           # API key management
│   │   ├── dashboard/          # Dashboard UI pages
│   │   ├── docs/               # Documentation page
│   │   └── page.tsx            # Landing page
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── dashboard/          # Dashboard-specific components
│   ├── lib/                    # Core business logic
│   │   ├── smart-wallet.ts     # Wallet & transaction service
│   │   ├── config.ts           # Chain & contract config
│   │   └── db/schema.ts        # Database (in-memory for MVP)
│   ├── store/                  # Zustand state management
│   └── hooks/                  # React hooks
├── contracts/                  # Solidity smart contracts
│   └── src/
│       ├── SimpleAccount.sol           # ERC-4337 smart wallet
│       ├── SimpleAccountFactory.sol    # CREATE2 factory
│       └── TestPaymaster.sol           # Gas sponsorship
├── packages/smartkit-sdk/      # npm SDK package
├── examples/demo-app/          # Demo integration app
├── tests/                      # Test suites
│   └── unit/                   # Unit tests (Vitest)
└── docs/                       # Documentation
    ├── api.md                  # API reference
    └── quickstart.md           # Getting started guide
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + shadcn/ui + TailwindCSS
- **Backend**: Next.js API Routes
- **Blockchain**: Base Sepolia (ERC-4337 v0.7)
- **Smart Contracts**: Solidity 0.8.24 (Foundry)
- **State Management**: Zustand
- **Testing**: Vitest
- **Language**: TypeScript (strict mode)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wallets/create` | Create a new smart wallet |
| GET | `/api/wallets` | List all wallets |
| GET | `/api/wallets/:address` | Get wallet details + transactions |
| POST | `/api/transactions/send` | Send a gasless transaction |
| GET | `/api/transactions` | List all transactions |
| GET | `/api/transactions/:hash` | Get transaction status |
| GET | `/api/stats` | Dashboard statistics |
| GET/POST | `/api/keys` | Manage API keys |

## Smart Contracts

ERC-4337 Account Abstraction contracts for Base Sepolia:

- **SimpleAccount** - Smart wallet with owner-based auth and execute/executeBatch
- **SimpleAccountFactory** - CREATE2 factory with EIP-1167 minimal proxy pattern
- **TestPaymaster** - Whitelist-based gas sponsorship paymaster

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

See `.env.example` for all required variables.

## Testing

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## License

MIT
