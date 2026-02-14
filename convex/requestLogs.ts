import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getRecentLogs = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { projectId, limit }) => {
    const take = limit ?? 50;
    return ctx.db
      .query("requestLogs")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .order("desc")
      .take(take);
  },
});

export const getLogStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const logs = await ctx.db
      .query("requestLogs")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .collect();

    const total = logs.length;
    const successCount = logs.filter(
      (l) => l.statusCode >= 200 && l.statusCode < 400
    ).length;
    const errorCount = logs.filter((l) => l.statusCode >= 400).length;
    const avgDuration =
      total > 0
        ? Math.round(logs.reduce((sum, l) => sum + l.duration, 0) / total)
        : 0;

    return { total, successCount, errorCount, avgDuration };
  },
});

export const createLog = mutation({
  args: {
    projectId: v.id("projects"),
    apiKeyId: v.optional(v.string()),
    apiKeyPrefix: v.string(),
    method: v.string(),
    path: v.string(),
    statusCode: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("requestLogs", args);
  },
});
