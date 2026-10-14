import { randomUUID } from "node:crypto";
import { createDryRunResult, recordCost, type DispatchReceipt, type Guards, type Logger, VendorError } from "./core.js";

export const DISCLOSURE_TEXT = "Created with AI assistance and reviewed for the brand.";
export type Platform = "reddit" | "x" | "linkedin" | "youtube" | "bluesky" | "webhook";
export type EngagementStatus = "draft" | "approved" | "denied" | "sent";

export interface EngagementTarget { id: string; platform: Platform; url?: string; context?: string; account?: string }
export interface EngagementAction { id: string; target: EngagementTarget; text: string; personaVoice: string; status: EngagementStatus; createdAt: string; updatedAt: string; receipt?: DispatchReceipt }
export interface AuditEntry { actionId: string; event: "planned" | "approved" | "denied" | "dry_run" | "sent"; at: string; detail?: string }
export interface EngagementQueue { actions: EngagementAction[]; audit: AuditEntry[] }

export function createEngagementQueue(): EngagementQueue { return { actions: [], audit: [] }; }
function now(): string { return new Date().toISOString(); }
function audit(queue: EngagementQueue, actionId: string, event: AuditEntry["event"], detail?: string): void { queue.audit.push({ actionId, event, at: now(), detail }); }
function ensureDisclosure(text: string): string { return text.includes(DISCLOSURE_TEXT) ? text : `${text.trim()}\n\n${DISCLOSURE_TEXT}`; }

export function planEngagement(targets: EngagementTarget[], personaVoice: string, queue: EngagementQueue = createEngagementQueue()): EngagementAction[] {
  if (!personaVoice.trim()) throw new Error("persona voice must not be empty");
  const seen = new Set(queue.actions.map((a) => a.target.id));
  const planned: EngagementAction[] = [];
  for (const target of targets) {
    if (!target.id.trim()) throw new Error("target id must not be empty");
    if (seen.has(target.id)) continue;
    seen.add(target.id);
    const stamp = now();
    const action: EngagementAction = { id: randomUUID(), target: { ...target }, personaVoice, text: ensureDisclosure(`${personaVoice}: Thanks for sharing${target.context ? ` — ${target.context}` : ""}.`), status: "draft", createdAt: stamp, updatedAt: stamp };
    queue.actions.push(action); audit(queue, action.id, "planned"); planned.push(action);
  }
  return planned;
}
export function getEngagementQueue(queue: EngagementQueue): EngagementAction[] { return queue.actions.map((a) => ({ ...a, target: { ...a.target } })); }
export function approveEngagement(actionId: string, queue: EngagementQueue): EngagementAction { return setStatus(actionId, "approved", queue); }
export function denyEngagement(actionId: string, queue: EngagementQueue): EngagementAction { return setStatus(actionId, "denied", queue); }
function setStatus(id: string, status: "approved" | "denied", queue: EngagementQueue): EngagementAction {
  const action = queue.actions.find((item) => item.id === id); if (!action) throw new Error(`action not found: ${id}`);
  if (action.status === "sent") throw new Error("sent actions cannot be changed");
  action.status = status; action.updatedAt = now(); audit(queue, id, status); return action;
}

export interface EngagementAdapter { readonly name: Platform; send(action: EngagementAction): Promise<DispatchReceipt>; }
export interface HttpEngagementAdapterOptions { endpoint: string; fetchFn?: typeof fetch; timeoutMs?: number; }
export class HttpEngagementAdapter implements EngagementAdapter {
  readonly name: Platform; private endpoint: string; private fetchFn: typeof fetch; private timeoutMs: number;
  constructor(name: Platform, options: HttpEngagementAdapterOptions) { this.name = name; this.endpoint = options.endpoint; this.fetchFn = options.fetchFn ?? fetch; this.timeoutMs = options.timeoutMs ?? 10_000; }
  async send(action: EngagementAction): Promise<DispatchReceipt> {
    let response: Response; try { response = await this.fetchFn(this.endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target: action.target, text: action.text }), signal: AbortSignal.timeout(this.timeoutMs) }); } catch (error) { throw new VendorError(`${this.name} request failed: ${String(error)}`, { cause: error }); }
    if (!response.ok) throw new VendorError(`${this.name} got status ${response.status}`, { status: response.status });
    return { adapter: this.name, id: randomUUID(), chars: action.text.length, at: now() };
  }
}
export class LocalEngagementAdapter implements EngagementAdapter { constructor(readonly name: Platform = "webhook") {} async send(action: EngagementAction): Promise<DispatchReceipt> { return { adapter: this.name, id: randomUUID(), chars: action.text.length, at: now() }; } }
export type AdapterMap = Partial<Record<Platform, EngagementAdapter>>;
export interface ExecuteEngagementOptions { queue: EngagementQueue; adapters?: AdapterMap; guards?: Guards; logger?: Logger; live?: boolean; }
export interface ExecuteEngagementResult { dryRun: boolean; action: EngagementAction; receipt?: DispatchReceipt }
export async function executeEngagement(action: EngagementAction | string, options: ExecuteEngagementOptions): Promise<ExecuteEngagementResult> {
  const item = typeof action === "string" ? options.queue.actions.find((a) => a.id === action) : options.queue.actions.find((a) => a.id === action.id);
  if (!item) throw new Error("action not found");
  if (item.status !== "approved") throw new Error("only approved actions can be sent");
  const duplicate = options.queue.actions.some((a) => a.id !== item.id && a.target.id === item.target.id && a.status === "sent"); if (duplicate) throw new Error(`target already sent: ${item.target.id}`);
  options.guards?.checkDispatch(item.text);
  if (!options.live) { audit(options.queue, item.id, "dry_run"); options.logger?.info(`dry run: would send ${item.id}`); return { dryRun: true, action: { ...item, target: { ...item.target } } }; }
  const adapter = options.adapters?.[item.target.platform] ?? new LocalEngagementAdapter(item.target.platform);
  const receipt = await adapter.send(item); options.guards?.recordDispatch(); recordCost({ kind: "dispatch", adapter: adapter.name, units: item.text.length }); item.status = "sent"; item.updatedAt = now(); item.receipt = receipt; audit(options.queue, item.id, "sent"); options.logger?.info(`sent ${item.id}`); return { dryRun: false, action: { ...item, target: { ...item.target } }, receipt };
}
