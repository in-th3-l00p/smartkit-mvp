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

export const getMyRecentLogs = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { projectId, limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await verifyOwnership(ctx, userId, projectId);
    const take = limit ?? 50;
    return ctx.db
      .query("requestLogs")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .order("desc")
      .take(take);
  },
});

export const getMyLogStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await verifyOwnership(ctx, userId, projectId);
    const logs = await ctx.db
      .query("requestLogs")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .collect();

    const total = logs.length;
    const successCount = logs.filter(
      (l: any) => l.statusCode >= 200 && l.statusCode < 400
    ).length;
    const errorCount = logs.filter((l: any) => l.statusCode >= 400).length;
    const avgDuration =
      total > 0
        ? Math.round(logs.reduce((sum: number, l: any) => sum + l.duration, 0) / total)
        : 0;

    return { total, successCount, errorCount, avgDuration };
  },
});

// ---------------------------------------------------------------------------
// Server-side queries
// ---------------------------------------------------------------------------

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
      (l: any) => l.statusCode >= 200 && l.statusCode < 400
    ).length;
    const errorCount = logs.filter((l: any) => l.statusCode >= 400).length;
    const avgDuration =
      total > 0
        ? Math.round(logs.reduce((sum: number, l: any) => sum + l.duration, 0) / total)
        : 0;

    return { total, successCount, errorCount, avgDuration };
  },
});

// ---------------------------------------------------------------------------
// Mutations (fire-and-forget from API routes)
// ---------------------------------------------------------------------------

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
