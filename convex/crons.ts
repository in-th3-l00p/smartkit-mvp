import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "cleanup stale transactions",
  { hourUTC: 3, minuteUTC: 0 },
  internal.transactions.cleanupStaleTransactions
);

export default crons;
