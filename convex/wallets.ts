import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ---------------------------------------------------------------------------
// Helper: verify the authenticated user owns the project
// ---------------------------------------------------------------------------

async function verifyOwnership(
  ctx: { db: any },
  userId: any,
  projectId: any
) {
  const project = await ctx.db.get(projectId);
  if (!project || project.ownerId !== userId) {
    throw new Error("Not authorized");
  }
  return project;
}

// ---------------------------------------------------------------------------
// Auth-checked queries (dashboard)
// ---------------------------------------------------------------------------

export const getMyWallets = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await verifyOwnership(ctx, userId, projectId);
    return ctx.db
      .query("wallets")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});

export const getMyWalletCount = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await verifyOwnership(ctx, userId, projectId);
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .collect();
    return wallets.length;
  },
});

// ---------------------------------------------------------------------------
// Server-side queries (used by API routes via ConvexHttpClient)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Mutations (server-side)
// ---------------------------------------------------------------------------

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
