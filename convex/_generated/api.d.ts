/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as apiKeys from "../apiKeys.js";
import type * as crons from "../crons.js";
import type * as projects from "../projects.js";
import type * as requestLogs from "../requestLogs.js";
import type * as transactions from "../transactions.js";
import type * as wallets from "../wallets.js";
import type * as webhooksDb from "../webhooksDb.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  apiKeys: typeof apiKeys;
  crons: typeof crons;
  projects: typeof projects;
  requestLogs: typeof requestLogs;
  transactions: typeof transactions;
  wallets: typeof wallets;
  webhooksDb: typeof webhooksDb;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
