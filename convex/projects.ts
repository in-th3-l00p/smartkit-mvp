import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getProjectByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return ctx.db
      .query("projects")
      .withIndex("by_ownerEmail", (q) => q.eq("ownerEmail", email))
      .first();
  },
});

export const getProjectById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const healthCheck = query({
  args: {},
  handler: async () => {
    return { ok: true };
  },
});

export const createProject = mutation({
  args: {
    name: v.string(),
    ownerEmail: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("projects", {
      name: args.name,
      ownerEmail: args.ownerEmail,
      passwordHash: args.passwordHash,
    });
    return ctx.db.get(id);
  },
});

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

export const updateProjectName = mutation({
  args: { id: v.id("projects"), name: v.string() },
  handler: async (ctx, { id, name }) => {
    await ctx.db.patch(id, { name });
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
