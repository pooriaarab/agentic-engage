---
name: agentic-engage
description: Plan and send approved engagement on social platforms. Keywords: social,engagement,comments,agentic-suite,cli,mcp.
---

# agentic-engage

Plan and send approved engagement on social platforms.

## Use the SDK

```js
import { summarizeText, dispatchText } from "agentic-engage";

summarizeText("some text");
await dispatchText("some text", { dryRun: true });
```

## Use the CLI

```sh
agentic-engage summary --text "some text"
agentic-engage dispatch --text "some text" --dry-run
```

## Use the MCP server

Start the server with `agentic-engage mcp`. Call `summarize_text`
for stats, `dispatch_text` for routes, `get_cost_report` for costs.

## Rules

- Preview each route with dry run first.
- Report guard denials and adapter errors as failures.
- Read the cost report at the end.
