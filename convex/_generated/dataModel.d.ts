/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { DataModelFromSchemaDefinition, GenericId } from "convex/server";
import type schema from "../schema.js";

/**
 * The names of all of your Convex tables.
 */
export type TableNames = "projects" | "wallets" | "transactions" | "apiKeys" | "webhooks" | "requestLogs";

/**
 * The type of a document stored in Convex.
 */
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;

/**
 * An identifier for a document in Convex.
 */
export type Id<TableName extends TableNames> = GenericId<TableName>;
