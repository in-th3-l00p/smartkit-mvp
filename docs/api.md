# SmartKit API Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API requests require an API key passed in the Authorization header:

```
Authorization: Bearer sk_test_your_api_key
```

## Endpoints

### Wallets

#### Create Wallet

```
POST /api/wallets/create
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | Yes | Unique identifier for the user |
| email | string | Yes | User's email address |

**Response:**

```json
{
  "id": "uuid",
  "address": "0x...",
  "userId": "user_123",
  "email": "user@example.com",
  "salt": "0x...",
  "deployed": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### List Wallets

```
GET /api/wallets
```

Returns an array of all wallets.

#### Get Wallet

```
GET /api/wallets/:address
```

Returns wallet details with transaction history.

### Transactions

#### Send Transaction

```
POST /api/transactions/send
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| walletAddress | string | Yes | Smart wallet address |
| to | string | Yes | Destination address |
| value | string | No | Value in wei (default: "0") |
| data | string | No | Calldata (default: "0x") |
| sponsored | boolean | No | Whether gas is sponsored (default: true) |

**Response:**

```json
{
  "id": "uuid",
  "walletAddress": "0x...",
  "userOpHash": "0x...",
  "txHash": null,
  "status": "pending",
  "gasSponsored": true,
  "gasCost": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### List Transactions

```
GET /api/transactions
```

#### Get Transaction

```
GET /api/transactions/:hash
```

### Statistics

#### Get Dashboard Stats

```
GET /api/stats
```

**Response:**

```json
{
  "totalWallets": 3,
  "totalTransactions": 5,
  "successfulTxs": 3,
  "failedTxs": 1,
  "pendingTxs": 1,
  "totalGasSponsored": "0.0025",
  "successRate": "60.0"
}
```

### API Keys

#### List Keys

```
GET /api/keys
```

#### Create Key

```
POST /api/keys
```

**Request Body:**

```json
{
  "name": "My API Key"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Missing required fields |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |
