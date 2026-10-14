export { VERSION } from "./version.js";
export * from "./core.js";
export * from "./engagement.js";
import { defineBrand, type BrandConfig } from "./core.js";
import { VERSION } from "./version.js";
export const DEFAULT_BRAND: BrandConfig = defineBrand({ name: "Agentic Engage", command: "agentic-engage", description: "Plan and send approved engagement on own brand accounts.", keywords: ["social", "engagement", "comments", "agentic-suite", "cli", "mcp"], version: VERSION });
