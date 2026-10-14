import { planEngagement, createEngagementQueue } from "./engagement.js";
import { summarizeText } from "./core.js";
import { VERSION } from "./version.js";
export interface WorkerEnv { PACK_NAME?: string }
const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{"content-type":"application/json"}});
export default { async fetch(request:Request,env:WorkerEnv):Promise<Response> { const url=new URL(request.url); if(request.method==="GET"&&url.pathname==="/health") return json({ok:true,pack:env.PACK_NAME??"agentic-engage",version:VERSION}); if(request.method==="POST"&&url.pathname==="/summarize"){try { const b=await request.json() as {text:unknown}; if(typeof b.text!=="string") throw new Error(); return json(summarizeText(b.text)); } catch { return json({error:"body needs a text string"},400); }} if(request.method==="POST"&&url.pathname==="/plan"){try { const b=await request.json() as {targets:never[];personaVoice:string}; return json(planEngagement(b.targets,b.personaVoice,createEngagementQueue())); } catch { return json({error:"body needs targets and personaVoice"},400); }} return json({error:"not found"},404); } };
