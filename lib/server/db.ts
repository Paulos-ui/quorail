import postgres from "postgres";
import type { AuditEntry, Decision, Obligation, Policy } from "@/lib/core/types";
import { createHash, randomUUID } from "node:crypto";
let client: ReturnType<typeof postgres> | undefined;
export function isLive() { return !!((process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL) && process.env.SESSION_SECRET && process.env.VAULT_ADDRESS); }
export function db() {
 if (!isLive()) throw new Error("Live mode requires database, SESSION_SECRET and VAULT_ADDRESS. See README.");
 if (!client) client = postgres((process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)!, {max: 4, prepare: false, idle_timeout: 20, connect_timeout: 10});
 return client;
}
function dateOnly(value:unknown) { if(value instanceof Date)return value.toISOString().slice(0,10); const raw=String(value); return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0,10) : new Date(raw).toISOString().slice(0,10); }
export function mapObligation(r: Record<string, unknown>): Obligation {
 return {id:String(r.id),title:String(r.title),counterparty:String(r.counterparty),recipient:String(r.recipient),amountCents:Number(r.amount_cents),dueDate:dateOnly(r.due_date),priority:r.priority as Obligation["priority"],category:String(r.category),status:r.status as Obligation["status"],createdAt:new Date(String(r.created_at)).toISOString(),txHash:r.tx_hash ? String(r.tx_hash) : null};
}
export function mapDecision(r: Record<string, unknown>): Decision {
 return {id:String(r.id),obligationId:String(r.obligation_id),obligationTitle:String(r.obligation_title),action:r.action as Decision["action"],reason:String(r.reason),alternatives:r.alternatives as Decision["alternatives"],confidence:Number(r.confidence),source:r.source as Decision["source"],snapshot:r.snapshot as Decision["snapshot"],status:r.status as Decision["status"],txHash:r.tx_hash ? String(r.tx_hash) : null,createdAt:new Date(String(r.created_at)).toISOString()};
}
export async function getObligations() { const rows = await db()`SELECT * FROM obligations ORDER BY due_date ASC, created_at ASC`; return rows.map(mapObligation); }
export async function getDecisions() { const rows = await db()`SELECT * FROM decisions ORDER BY created_at DESC LIMIT 80`; return rows.map(mapDecision); }
export async function getAudit() {
 const rows = await db()`SELECT * FROM audit_events ORDER BY id DESC LIMIT 100`;
 return rows.map((r): AuditEntry => ({id:String(r.id),at:new Date(String(r.created_at)).toISOString(),kind:String(r.kind),message:String(r.message),payload:r.payload as Record<string,unknown>,prevHash:String(r.prev_hash),hash:String(r.entry_hash)}));
}
export async function getPolicy(): Promise<Policy> {
 const rows = await db()`SELECT * FROM treasury_settings WHERE id=1`;
 if (!rows[0]) throw new Error("Database not initialized. Run npm run db:init.");
 return {reserveCents:Number(rows[0].reserve_cents),horizonDays:Number(rows[0].horizon_days),autonomousLimitCents:Number(rows[0].autonomous_limit_cents),singleLimitCents:Number(rows[0].single_limit_cents),dailyLimitCents:Number(rows[0].daily_limit_cents),allowedRecipients:[]};
}
export async function logEvent(kind: string, message: string, payload: Record<string,unknown>={}) {
 // Serialization is mandatory so two concurrent writers cannot fork the event chain.
 const sql = db();
 await sql.begin(async tx => {
  await tx`SELECT pg_advisory_xact_lock(62419713)`;
  const previous = await tx`SELECT entry_hash FROM audit_events ORDER BY id DESC LIMIT 1`;
  const prev = previous[0]?.entry_hash ?? "GENESIS";
  const data = {kind,message,payload,prev,at:new Date().toISOString()};
  const hash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
  await tx`INSERT INTO audit_events (kind,message,payload,prev_hash,entry_hash,created_at) VALUES (${kind},${message},${tx.json({...payload,_timestamp:data.at})},${prev},${hash},${data.at})`;
 });
}
export async function createObligation(input: Omit<Obligation,"id"|"status"|"createdAt"|"txHash">) {
 const id=randomUUID();
 await db()`INSERT INTO obligations (id,title,counterparty,recipient,amount_cents,due_date,priority,category,status)
 VALUES (${id},${input.title},${input.counterparty},${input.recipient},${input.amountCents},${input.dueDate},${input.priority},${input.category},'pending')`;
 await logEvent("obligation.created",`New obligation: ${input.title}`,{id,amountCents:input.amountCents});
 return id;
}
export async function saveDecision(d: Decision) {
 // Postgres.js JSONValue requires an index signature, while our domain's Option
 // interface deliberately has none. Bind serialized JSON as query parameters
 // and cast explicitly to jsonb; this preserves strict domain types, avoids
 // unsafe `any`/type assertions, and does not interpolate untrusted SQL.
 const alternativesJson = JSON.stringify(d.alternatives);
 const snapshotJson = JSON.stringify(d.snapshot);
 await db()`INSERT INTO decisions (id,obligation_id,obligation_title,action,reason,alternatives,confidence,source,snapshot,status)
 VALUES (${d.id},${d.obligationId},${d.obligationTitle},${d.action},${d.reason},${alternativesJson}::jsonb,${d.confidence},${d.source},${snapshotJson}::jsonb,${d.status})`;
 await logEvent("agent.decision",`${d.action.toUpperCase()}: ${d.obligationTitle}`,{decisionId:d.id,source:d.source,reason:d.reason,snapshot:d.snapshot});
}
export async function getDecision(id:string) {
 const rows=await db()`SELECT * FROM decisions WHERE id=${id} LIMIT 1`;
 return rows[0] ? mapDecision(rows[0]) : null;
}
