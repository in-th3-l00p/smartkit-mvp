import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getApiKeyByHash = query({
  args: { keyHash: v.string() },
  handler: async (ctx, { keyHash }) => {
    return ctx.db
      .query("apiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", keyHash))
      .first();
  },
});

export const getApiKeysByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return ctx.db
      .query("apiKeys")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

export const createApiKey = mutation({
  args: {
    projectId: v.id("projects"),
    keyHash: v.string(),
    keyPrefix: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("apiKeys", {
      ...args,
      requestCount: 0,
    });
    return ctx.db.get(id);
  },
});

export const updateApiKeyUsage = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, { keyId }) => {
    const key = await ctx.db.get(keyId);
    if (!key) return;
    await ctx.db.patch(keyId, {
      lastUsed: Date.now(),
      requestCount: key.requestCount + 1,
    });
  },
});
