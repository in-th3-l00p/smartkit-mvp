import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    return webhooks.filter((w) => w.events.includes(event));
  },
});

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
