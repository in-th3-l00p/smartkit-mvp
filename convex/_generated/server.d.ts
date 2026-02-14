/* eslint-disable */
/**
 * Generated utilities for implementing server-side Convex query and mutation functions.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import {
  GenericQueryCtx,
  GenericMutationCtx,
  GenericActionCtx,
  GenericDatabaseReader,
  GenericDatabaseWriter,
  FunctionReference,
  QueryBuilder,
  MutationBuilder,
  ActionBuilder,
  HttpActionBuilder,
  InternalQueryBuilder,
  InternalMutationBuilder,
  InternalActionBuilder,
} from "convex/server";
import type { DataModel } from "./dataModel.js";

/**
 * Define a query in this Convex app's public API.
 */
export declare const query: QueryBuilder<DataModel, "public">;

/**
 * Define a query that is only callable from other Convex functions (but not from the client).
 */
export declare const internalQuery: InternalQueryBuilder<DataModel>;

/**
 * Define a mutation in this Convex app's public API.
 */
export declare const mutation: MutationBuilder<DataModel, "public">;

/**
 * Define a mutation that is only callable from other Convex functions (but not from the client).
 */
export declare const internalMutation: InternalMutationBuilder<DataModel>;

/**
 * Define an action in this Convex app's public API.
 */
export declare const action: ActionBuilder<DataModel, "public">;

/**
 * Define an action that is only callable from other Convex functions (but not from the client).
 */
export declare const internalAction: InternalActionBuilder<DataModel>;

/**
 * Define an HTTP action.
 */
export declare const httpAction: HttpActionBuilder;

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;
export type DatabaseReader = GenericDatabaseReader<DataModel>;
export type DatabaseWriter = GenericDatabaseWriter<DataModel>;
