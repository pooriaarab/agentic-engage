import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getCostReport } from "./core.js";
import { approveEngagement, createEngagementQueue, denyEngagement, executeEngagement, getEngagementQueue, planEngagement, type EngagementQueue } from "./engagement.js";
import { DEFAULT_BRAND } from "./index.js";
const result = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value) }] });
export interface McpDeps { queue?: EngagementQueue }
export function createMcpServer(deps: McpDeps = {}): McpServer { const queue = deps.queue ?? createEngagementQueue(); const s = new McpServer({ name: DEFAULT_BRAND.command, version: DEFAULT_BRAND.version });
 s.registerTool("plan_engagement", { description: "Create AI-disclosed draft engagement actions for own brand accounts.", inputSchema: { targets: z.array(z.object({ id:z.string(), platform:z.enum(["reddit","x","linkedin","youtube","bluesky","webhook"]), url:z.string().optional(), context:z.string().optional(), account:z.string().optional() })), personaVoice:z.string() } }, async ({targets,personaVoice}) => result(planEngagement(targets, personaVoice, queue)));
 s.registerTool("get_engagement_queue", { description:"List queued engagement actions.", inputSchema:{}, annotations:{readOnlyHint:true} }, async()=>result({actions:getEngagementQueue(queue),audit:queue.audit}));
 s.registerTool("approve_engagement", { description:"Approve a draft before it can be sent.", inputSchema:{actionId:z.string()} }, async ({actionId})=> { try{return result(approveEngagement(actionId,queue));}catch(e){return result({error:String(e)})} });
 s.registerTool("deny_engagement", { description:"Deny a draft action.", inputSchema:{actionId:z.string()} }, async ({actionId})=> { try{return result(denyEngagement(actionId,queue));}catch(e){return result({error:String(e)})} });
 s.registerTool("execute_engagement", { description:"Preview an approved action by default; live=true sends it.", inputSchema:{actionId:z.string(),live:z.boolean().optional()} }, async ({actionId,live})=> { try{return result(await executeEngagement(actionId,{queue,live:live??false}));}catch(e){return result({error:String(e)})} });
 s.registerTool("get_cost_report", { description:"Read session costs.",inputSchema:{},annotations:{readOnlyHint:true}},async()=>result(getCostReport())); return s; }
export async function startMcp(deps: McpDeps = {}): Promise<void> { const s=createMcpServer(deps); await s.connect(new StdioServerTransport()); }
