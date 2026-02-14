import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  projects: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    planTier: v.optional(v.string()),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  wallets: defineTable({
    projectId: v.id("projects"),
    address: v.string(),
    userId: v.string(),
    email: v.string(),
    salt: v.string(),
    chainId: v.number(),
    deployed: v.boolean(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_address", ["address"])
    .index("by_projectId_userId", ["projectId", "userId"])
    .index("by_projectId_address", ["projectId", "address"]),

  transactions: defineTable({
    projectId: v.id("projects"),
    walletAddress: v.string(),
    userOpHash: v.string(),
    txHash: v.optional(v.string()),
    to: v.string(),
    value: v.string(),
    data: v.string(),
    status: v.string(),
    chainId: v.number(),
    gasSponsored: v.boolean(),
    gasCost: v.optional(v.string()),
  })
    .index("by_projectId", ["projectId"])
    .index("by_walletAddress", ["walletAddress"])
    .index("by_userOpHash", ["userOpHash"])
    .index("by_status", ["status"])
    .index("by_projectId_walletAddress", ["projectId", "walletAddress"]),

  apiKeys: defineTable({
    projectId: v.id("projects"),
    keyHash: v.string(),
    keyPrefix: v.string(),
    name: v.string(),
    lastUsed: v.optional(v.number()),
    requestCount: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_keyHash", ["keyHash"]),

  webhooks: defineTable({
    projectId: v.id("projects"),
    url: v.string(),
    events: v.array(v.string()),
    secret: v.string(),
    active: v.boolean(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_projectId_active", ["projectId", "active"]),

  requestLogs: defineTable({
    projectId: v.id("projects"),
    apiKeyId: v.optional(v.string()),
    apiKeyPrefix: v.string(),
    method: v.string(),
    path: v.string(),
    statusCode: v.number(),
    duration: v.number(),
  }).index("by_projectId", ["projectId"]),

  deployments: defineTable({
    contractName: v.string(),
    address: v.string(),
    chainId: v.number(),
    deployer: v.optional(v.string()),
    blockNumber: v.optional(v.number()),
    txHash: v.optional(v.string()),
    abiHash: v.optional(v.string()),
    verified: v.boolean(),
    projectId: v.optional(v.id("projects")),
  })
    .index("by_chainId", ["chainId"])
    .index("by_chainId_contractName", ["chainId", "contractName"])
    .index("by_address", ["address"]),
});
