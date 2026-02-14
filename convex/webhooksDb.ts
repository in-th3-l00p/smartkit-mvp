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

export const getMyWebhooks = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await verifyOwnership(ctx, userId, projectId);
    return ctx.db
      .query("webhooks")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Auth-checked mutations (dashboard)
// ---------------------------------------------------------------------------

export const createMyWebhook = mutation({
  args: {
    projectId: v.id("projects"),
    url: v.string(),
    events: v.array(v.string()),
    secret: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await verifyOwnership(ctx, userId, args.projectId);
    const id = await ctx.db.insert("webhooks", args);
    return ctx.db.get(id);
  },
});

export const deleteMyWebhook = mutation({
  args: { id: v.id("webhooks") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const webhook = await ctx.db.get(id);
    if (!webhook) throw new Error("Not found");
    await verifyOwnership(ctx, userId, webhook.projectId);
    await ctx.db.delete(id);
  },
});

// ---------------------------------------------------------------------------
// Server-side queries (webhook dispatcher)
// ---------------------------------------------------------------------------

export const getWebhooksByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return ctx.db
      .query("webhooks")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

export const getActiveWebhooksByEvent = query({
  args: { projectId: v.id("projects"), event: v.string() },
  handler: async (ctx, { projectId, event }) => {
    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_projectId_active", (q) =>
        q.eq("projectId", projectId).eq("active", true)
      )
      .collect();
    return webhooks.filter((w: any) => w.events.includes(event));
  },
});

// ---------------------------------------------------------------------------
// Server-side mutations
// ---------------------------------------------------------------------------

export const createWebhook = mutation({
  args: {
    projectId: v.id("projects"),
    url: v.string(),
    events: v.array(v.string()),
    secret: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("webhooks", args);
    return ctx.db.get(id);
  },
});

export const deleteWebhook = mutation({
  args: { id: v.id("webhooks") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const toggleWebhookActive = mutation({
  args: { id: v.id("webhooks"), active: v.boolean() },
  handler: async (ctx, { id, active }) => {
    await ctx.db.patch(id, { active });
  },
});
