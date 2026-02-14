import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ---------------------------------------------------------------------------
// Auth-checked queries (dashboard)
// ---------------------------------------------------------------------------

export const getMyProject = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db
      .query("projects")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
      .first();
  },
});

// ---------------------------------------------------------------------------
// Auth-checked mutations (dashboard)
// ---------------------------------------------------------------------------

export const createProject = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const id = await ctx.db.insert("projects", {
      name,
      ownerId: userId,
    });
    return ctx.db.get(id);
  },
});

export const updateProjectName = mutation({
  args: { id: v.id("projects"), name: v.string() },
  handler: async (ctx, { id, name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(id);
    if (!project || project.ownerId !== userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(id, { name });
  },
});

// ---------------------------------------------------------------------------
// Server-side queries (used by API routes via ConvexHttpClient)
// ---------------------------------------------------------------------------

export const getProjectById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const getProjectByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    return ctx.db
      .query("projects")
      .withIndex("by_stripeCustomerId", (q) =>
        q.eq("stripeCustomerId", stripeCustomerId)
      )
      .first();
  },
});

export const healthCheck = query({
  args: {},
  handler: async () => {
    return { ok: true };
  },
});

// ---------------------------------------------------------------------------
// Server-side mutations (billing webhooks, etc.)
// ---------------------------------------------------------------------------

export const updateProjectBilling = mutation({
  args: {
    id: v.id("projects"),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    planTier: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const update: Record<string, string | undefined> = {};
    if (fields.stripeCustomerId !== undefined)
      update.stripeCustomerId = fields.stripeCustomerId;
    if (fields.stripeSubscriptionId !== undefined)
      update.stripeSubscriptionId = fields.stripeSubscriptionId;
    if (fields.planTier !== undefined) update.planTier = fields.planTier;
    await ctx.db.patch(id, update);
  },
});
