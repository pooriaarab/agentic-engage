# agentic-engage

Plan and send approved outbound engagement on **own brand accounts**. Drafts are AI-disclosed, deduplicated by target, and dry-run is the default.

## CLI

```sh
agentic-engage plan --targets '[{"id":"post-1","platform":"reddit","context":"your launch"}]' --voice "Helpful brand"
agentic-engage queue
agentic-engage approve --id <action-id>
agentic-engage send --id <action-id>       # preview only
agentic-engage send --id <action-id> --live # approved action only
```

## Library

`planEngagement`, `approveEngagement`, `denyEngagement`, and `executeEngagement` share an in-memory queue. `HttpEngagementAdapter` supports injected `fetchFn` for testable Reddit, X, LinkedIn, YouTube, Bluesky, and webhook delivery. Adapter failures throw `VendorError`.

## MCP

Tools: `plan_engagement`, `get_engagement_queue`, `approve_engagement`, `deny_engagement`, `execute_engagement`, and `get_cost_report`.
