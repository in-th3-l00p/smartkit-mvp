import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getWalletByProjectAndUser = query({
  args: { projectId: v.id("projects"), userId: v.string() },
  handler: async (ctx, { projectId, userId }) => {
    return ctx.db
      .query("wallets")
      .withIndex("by_projectId_userId", (q) =>
        q.eq("projectId", projectId).eq("userId", userId)
      )
      .first();
  },
});

export const getWalletByProjectAndAddress = query({
  args: { projectId: v.id("projects"), address: v.string() },
  handler: async (ctx, { projectId, address }) => {
    return ctx.db
      .query("wallets")
      .withIndex("by_projectId_address", (q) =>
        q.eq("projectId", projectId).eq("address", address.toLowerCase())
      )
      .first();
  },
});

export const getAllWallets = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return ctx.db
      .query("wallets")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});

export const getWalletCount = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .collect();
    return wallets.length;
  },
});

export const createWallet = mutation({
  args: {
    projectId: v.id("projects"),
    address: v.string(),
    userId: v.string(),
    email: v.string(),
    salt: v.string(),
    chainId: v.number(),
    deployed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("wallets", {
      ...args,
      address: args.address.toLowerCase(),
    });
    return ctx.db.get(id);
  },
});

export const markWalletDeployed = mutation({
  args: { walletId: v.id("wallets") },
  handler: async (ctx, { walletId }) => {
    await ctx.db.patch(walletId, { deployed: true });
  },
});
