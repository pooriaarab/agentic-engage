import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "vitest";
import { createMcpServer } from "./mcp.js";
const textOf=(r:unknown)=>(r as {content:{text:string}[]}).content[0].text;
describe("mcp",()=>test("serves engagement tools",async()=>{const [ct,st]=InMemoryTransport.createLinkedPair();const s=createMcpServer();await s.connect(st);const c=new Client({name:"x",version:"1"});await c.connect(ct);try {const names=(await c.listTools()).tools.map(x=>x.name);expect(names).toContain("plan_engagement");const r=await c.callTool({name:"plan_engagement",arguments:{targets:[{id:"a",platform:"reddit"}],personaVoice:"kind"}});expect(JSON.parse(textOf(r))[0].status).toBe("draft");}finally{await c.close();await s.close();}}));
