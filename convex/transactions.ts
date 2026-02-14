import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getTransactionByHash = query({
  args: { projectId: v.id("projects"), hash: v.string() },
  handler: async (ctx, { projectId, hash }) => {
    // Try userOpHash first
    const byUserOp = await ctx.db
      .query("transactions")
      .withIndex("by_userOpHash", (q) => q.eq("userOpHash", hash))
      .first();
    if (byUserOp && byUserOp.projectId === projectId) return byUserOp;

    // Try txHash
    const all = await ctx.db
      .query("transactions")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .collect();
    return all.find((t) => t.txHash === hash) ?? null;
  },
});

export const getTransactions = query({
  args: {
    projectId: v.id("projects"),
    walletAddress: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, walletAddress }) => {
    if (walletAddress) {
      const results = await ctx.db
        .query("transactions")
        .withIndex("by_projectId_walletAddress", (q) =>
          q
            .eq("projectId", projectId)
            .eq("walletAddress", walletAddress.toLowerCase())
        )
        .order("desc")
        .collect();
      return results;
    }
    return ctx.db
      .query("transactions")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});

export const getTransactionsByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return ctx.db
      .query("transactions")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

export const getRecentUpdated = query({
  args: {
    projectId: v.id("projects"),
    walletAddress: v.optional(v.string()),
    afterTimestamp: v.number(),
  },
  handler: async (ctx, { projectId, walletAddress, afterTimestamp }) => {
    let txs;
    if (walletAddress) {
      txs = await ctx.db
        .query("transactions")
        .withIndex("by_projectId_walletAddress", (q) =>
          q
            .eq("projectId", projectId)
            .eq("walletAddress", walletAddress.toLowerCase())
        )
        .order("desc")
        .take(20);
    } else {
      txs = await ctx.db
        .query("transactions")
        .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
        .order("desc")
        .take(20);
    }
    return txs.filter(
      (tx) =>
        (tx.status === "success" || tx.status === "failed") &&
        tx._creationTime > afterTimestamp
    );
  },
});

export const createTransaction = mutation({
  args: {
    projectId: v.id("projects"),
    walletAddress: v.string(),
    userOpHash: v.string(),
    to: v.string(),
    value: v.string(),
    data: v.string(),
    status: v.string(),
    chainId: v.number(),
    gasSponsored: v.boolean(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("transactions", {
      ...args,
      walletAddress: args.walletAddress.toLowerCase(),
    });
    return ctx.db.get(id);
  },
});

export const updateTransactionReceipt = mutation({
  args: {
    txId: v.id("transactions"),
    txHash: v.optional(v.string()),
    status: v.string(),
    gasCost: v.optional(v.string()),
  },
  handler: async (ctx, { txId, txHash, status, gasCost }) => {
    const update: Record<string, string | undefined> = { status };
    if (txHash !== undefined) update.txHash = txHash;
    if (gasCost !== undefined) update.gasCost = gasCost;
    await ctx.db.patch(txId, update);
  },
});

export const markTransactionFailed = mutation({
  args: { txId: v.id("transactions") },
  handler: async (ctx, { txId }) => {
    await ctx.db.patch(txId, { status: "failed" });
  },
});

export const cleanupStaleTransactions = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const pending = await ctx.db
      .query("transactions")
      .withIndex("by_status", (q: any) => q.eq("status", "pending"))
      .collect();
    let cleaned = 0;
    for (const tx of pending) {
      if (tx._creationTime < oneHourAgo) {
        await ctx.db.patch(tx._id, { status: "failed" });
        cleaned++;
      }
    }
    return { cleaned };
  },
});
