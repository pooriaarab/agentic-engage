import { describe, expect, test } from "vitest";
import { parseArgs, runCli, UsageError, type CliIo } from "./cli.js";
import { createEngagementQueue } from "./engagement.js";
function testIo(): CliIo & { outLines:string[]; errLines:string[] } { const outLines:string[]=[]; const errLines:string[]=[]; return {out:(x)=>outLines.push(x),err:(x)=>errLines.push(x),queue:createEngagementQueue(),outLines,errLines}; }
describe("engage cli",()=>{
 test("plan parse",()=>expect(parseArgs(["plan","--targets","[]","--voice","kind"])).toMatchObject({command:"plan"}));
 test("plan approve and preview",async()=>{const io=testIo(); expect(await runCli(["plan","--targets",JSON.stringify([{id:"one",platform:"reddit"}]),"--voice","kind"],io)).toBe(0); const id=JSON.parse(io.outLines[0])[0].id; await runCli(["approve","--id",id],io); await runCli(["send","--id",id],io); expect(JSON.parse(io.outLines[2]).dryRun).toBe(true);});
 test("bad usage",()=>expect(()=>parseArgs(["bogus"])).toThrow(UsageError));
});
