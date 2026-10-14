# agentic-engage

[![npm version](https://img.shields.io/npm/v/agentic-engage)](https://www.npmjs.com/package/agentic-engage)
[![npm downloads](https://img.shields.io/npm/dm/agentic-engage)](https://www.npmjs.com/package/agentic-engage)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

agentic-engage is an open-source engagement queue for Node.js developers and agents, with approval steps, local receipts, and a generic HTTP adapter.

## Install

```sh
npm install agentic-engage
```

Requires Node.js 18 or later. Includes TypeScript declarations and two runtime dependencies.

## Preview your first action

Save this as `preview.mjs`, then run `node preview.mjs`. No credentials are needed.

```js
import {
  createEngagementQueue, planEngagement, approveEngagement,
  executeEngagement, getCostReport,
} from "agentic-engage";

const queue = createEngagementQueue();
const [draft] = planEngagement(
  [{ id: "post-1", platform: "webhook", context: "your launch" }],
  "Helpful brand", queue,
);
approveEngagement(draft.id, queue);
const preview = await executeEngagement(draft.id, { queue });
console.log(preview.dryRun, preview.action.status); // true approved
console.log(getCostReport()); // entries: [], dispatches: 0, units: 0
```

Success prints `true approved` and zero dispatch costs. Preview makes no delivery request.

## Features and coverage

- **Drafts:** Generate fixed template text with an AI-assistance disclosure.
- **Review:** Approve or deny actions; execution requires approved status.
- **Queue:** Deduplicate target IDs and keep an in-memory audit log.
- **HTTP adapter:** POST target and text to an endpoint you supply.
- **Guards:** Optional dispatch caps, UTC quiet hours, and text blocklists.

| Target label | Native integration status |
| --- | --- |
| Reddit | scaffold; generic HTTP or local receipt only |
| X (Twitter) | scaffold; generic HTTP or local receipt only |
| LinkedIn | scaffold; generic HTTP or local receipt only |
| YouTube | scaffold; generic HTTP or local receipt only |
| Bluesky | scaffold; generic HTTP or local receipt only |
| Webhook | Generic HTTP adapter implemented; endpoint supplied by caller |

Six target labels share two engagement adapter classes. No native social API is credential-verified.
Use `new HttpEngagementAdapter("webhook", { endpoint })` in the library's `adapters` map.
Your endpoint handles authentication and platform delivery. No vendor environment variables or `.env` loader exist.

## Runtime surfaces

CLI commands: `plan`, `queue`, `approve`, `deny`, `send`, `costs`, and `mcp`; also `--help` and `--version`.
Run `npx agentic-engage mcp` or `npx --package agentic-engage agentic-engage-mcp` for Model Context Protocol (MCP).
Tools: `plan_engagement`, `get_engagement_queue`, `approve_engagement`, `deny_engagement`, `execute_engagement`, and `get_cost_report`.
Worker source exposes `GET /health`, `POST /summarize`, and `POST /plan`; you deploy it yourself.

## Limits and status

Queues and costs reset when the process exits. Separate CLI invocations do not share actions.
CLI and MCP live execution use local receipts; they cannot configure HTTP adapters.
Library execution also defaults to local receipts without an adapter, even with `live: true`.
A `sent` status therefore does not prove social publication. HTTP receipts use locally generated IDs.
HTTP requests default to a 10-second timeout with no retries. Costs count characters, not currency.
Drafts use fixed text templates; no language model generates them. Account ownership is not verified.
Version 0.1.0 has an API that may change. No managed social delivery service is included.

## Links and license

[Package and releases](https://www.npmjs.com/package/agentic-engage) · [MIT license](https://opensource.org/license/mit)
