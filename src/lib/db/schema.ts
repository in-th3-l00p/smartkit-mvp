import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  bigint,
  index,
} from 'drizzle-orm/pg-core'

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    address: varchar('address', { length: 42 }).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    salt: text('salt').notNull(),
    chainId: integer('chain_id').notNull().default(84532), // Base Sepolia
    deployed: boolean('deployed').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('wallets_project_id_idx').on(table.projectId),
    index('wallets_address_idx').on(table.address),
    index('wallets_user_id_idx').on(table.userId),
  ]
)

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
    userOpHash: varchar('user_op_hash', { length: 66 }).notNull(),
    txHash: varchar('tx_hash', { length: 66 }),
    to: varchar('to', { length: 42 }).notNull(),
    value: varchar('value', { length: 78 }).notNull().default('0'),
    data: text('data').notNull().default('0x'),
    status: varchar('status', { length: 20 })
      .notNull()
      .default('pending')
      .$type<'pending' | 'submitted' | 'success' | 'failed'>(),
    chainId: integer('chain_id').notNull().default(84532),
    gasSponsored: boolean('gas_sponsored').notNull().default(true),
    gasCost: varchar('gas_cost', { length: 78 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('transactions_project_id_idx').on(table.projectId),
    index('transactions_wallet_address_idx').on(table.walletAddress),
    index('transactions_user_op_hash_idx').on(table.userOpHash),
    index('transactions_status_idx').on(table.status),
  ]
)

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    keyHash: varchar('key_hash', { length: 64 }).notNull(), // SHA-256, never plaintext
    keyPrefix: varchar('key_prefix', { length: 12 }).notNull(), // "sk_test_abc..." for display
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastUsed: timestamp('last_used'),
    requestCount: integer('request_count').notNull().default(0),
  },
  (table) => [
    index('api_keys_project_id_idx').on(table.projectId),
    index('api_keys_key_hash_idx').on(table.keyHash),
  ]
)

// Type exports inferred from schema
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Wallet = typeof wallets.$inferSelect
export type NewWallet = typeof wallets.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
