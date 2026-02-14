import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getDeploymentsByChain = query({
  args: { chainId: v.number() },
  handler: async (ctx, { chainId }) => {
    return ctx.db
      .query("deployments")
      .withIndex("by_chainId", (q) => q.eq("chainId", chainId))
      .collect();
  },
});

export const getDeploymentByChainAndName = query({
  args: { chainId: v.number(), contractName: v.string() },
  handler: async (ctx, { chainId, contractName }) => {
    return ctx.db
      .query("deployments")
      .withIndex("by_chainId_contractName", (q) =>
        q.eq("chainId", chainId).eq("contractName", contractName)
      )
      .first();
  },
});

export const getFactoryAndPaymaster = query({
  args: { chainId: v.number() },
  handler: async (ctx, { chainId }) => {
    const deployments = await ctx.db
      .query("deployments")
      .withIndex("by_chainId", (q) => q.eq("chainId", chainId))
      .collect();

    const factory = deployments.find(
      (d: any) => d.contractName === "SimpleAccountFactory"
    );
    const paymaster = deployments.find(
      (d: any) => d.contractName === "VerifyingPaymaster"
    );

    return {
      factoryAddress: factory?.address ?? null,
      paymasterAddress: paymaster?.address ?? null,
    };
  },
});

export const getAllDeployments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.db.query("deployments").collect();
  },
});

// ---------------------------------------------------------------------------
// Auth-checked mutations (dashboard)
// ---------------------------------------------------------------------------

export const createDeployment = mutation({
  args: {
    contractName: v.string(),
    address: v.string(),
    chainId: v.number(),
    deployer: v.optional(v.string()),
    blockNumber: v.optional(v.number()),
    txHash: v.optional(v.string()),
    abiHash: v.optional(v.string()),
    verified: v.boolean(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const id = await ctx.db.insert("deployments", args);
    return ctx.db.get(id);
  },
});

export const updateDeploymentVerified = mutation({
  args: { id: v.id("deployments"), verified: v.boolean() },
  handler: async (ctx, { id, verified }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(id, { verified });
  },
});

// ---------------------------------------------------------------------------
// Internal mutations (seeding without auth)
// ---------------------------------------------------------------------------

export const seedDeployment = internalMutation({
  args: {
    contractName: v.string(),
    address: v.string(),
    chainId: v.number(),
    deployer: v.optional(v.string()),
    blockNumber: v.optional(v.number()),
    txHash: v.optional(v.string()),
    abiHash: v.optional(v.string()),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if deployment already exists
    const existing = await ctx.db
      .query("deployments")
      .withIndex("by_chainId_contractName", (q) =>
        q.eq("chainId", args.chainId).eq("contractName", args.contractName)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { address: args.address });
      return existing._id;
    }
    return ctx.db.insert("deployments", args);
  },
});
