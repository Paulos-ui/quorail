import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";
import { evaluateConsequences, exposure, dueInDays, outstanding } from "@/lib/core/finance";
import type { Action, Decision, Obligation, Policy } from "@/lib/core/types";
import { getObligations, getPolicy, logEvent, saveDecision, db } from "./db";
import { onchainPolicy, walletInfo } from "./arc";
import { executeDecision } from "./execute";

export async function reasonAboutPayment(candidate:Obligation, obligations:Obligation[], balance:number, policy:Policy):Promise<Decision> {
 const guard=evaluateConsequences(balance,obligations,candidate,policy);
 let action:Action=guard.recommendation;
 let source:Decision["source"]="rules";
 let confidence=0.78;
 let reason=`${candidate.title}: ${guard.days <= 0 ? "Overdue" : `due in ${guard.days} days`}. ${guard.availableAfterPay >= 0 ? `Projected discretionary buffer ${guard.availableAfterPay/100} USDC.` : `Spending would breach protected commitments by ${Math.abs(guard.availableAfterPay)/100} USDC.`} ${guard.needsOwnerSignature ? "Owner authorization is required." : ""}`;
 if(process.env.ANTHROPIC_API_KEY) {
  const anthropic=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY,timeout:20000,maxRetries:1});
  const response=await anthropic.messages.create({
   model:process.env.ANTHROPIC_MODEL||"claude-sonnet-4-5-20250929",max_tokens:650,
   system:`You are Quorail, a business USDC treasury agent. Make an actual reasoned financial decision; you DO NOT execute transfers. Output ONLY valid JSON with keys {"action":"pay|hold|escalate","reason":"under 320 characters","confidence":number between 0 and 1}. Base decisions exclusively on provided numbers. No fabricated invoices, revenue, discounts, or policies. If unclear, HOLD. Choose PAY when due, safe, and allowed; HOLD when solvency or future obligations are threatened; ESCALATE for signer authorization or counterparty risk. Contract guardrails are mandatory and cannot be altered. Never suggest splitting a payment to bypass a limit.`,
   messages:[{role:"user",content:JSON.stringify({candidate:{...candidate},balanceCents:balance,reserveCents:policy.reserveCents,competingObligationsCents:guard.competing,availableAfterPayCents:guard.availableAfterPay,daysUntilDue:guard.days,recipientAuthorized:guard.authorizedRecipient,needsOwnerSignature:guard.needsOwnerSignature,exceedsSingleLimit:guard.exceedsSingleLimit,alternatives:guard.alternatives,otherUpcoming:outstanding(obligations).filter(o=>o.id!==candidate.id).slice(0,20).map(o=>({title:o.title,amountCents:o.amountCents,dueDate:o.dueDate,priority:o.priority}))})}]
  });
  const raw=response.content.filter(x=>x.type==="text").map(x=>x.text).join("").replace(/^```(?:json)?\s*|\s*```$/g,"");
  const parsed=JSON.parse(raw) as {action:Action,reason:string,confidence:number};
  if(!["pay","hold","escalate"].includes(parsed.action) || typeof parsed.reason!=="string" || parsed.reason.length>500 || !Number.isFinite(parsed.confidence)) throw new Error("The model returned an invalid structured decision");
  action=parsed.action; reason=parsed.reason;confidence=Math.max(0,Math.min(1,parsed.confidence));source="claude";
 }
 // A model can be MORE cautious than the math, never LESS cautious.
 if(guard.availableAfterPay<0 || guard.days>policy.horizonDays) {action="hold";reason+= " Hard reserve/horizon guardrail applied.";}
 else if(!guard.authorizedRecipient || guard.exceedsSingleLimit || guard.needsOwnerSignature) {action="escalate";reason+= " Onchain recipient/limit guardrail applied.";}
 const snapshot={balanceCents:balance,obligationsCents:guard.competing,reservesCents:policy.reserveCents,disposableCents:guard.availableAfterPay};
 return {id:randomUUID(),obligationId:candidate.id,obligationTitle:candidate.title,action,reason,confidence,source,alternatives:guard.alternatives,snapshot,status:action==="pay"?"proposed":action==="hold"?"held":"escalated",createdAt:new Date().toISOString()};
}

/** One execution cycle. Cron/manual trigger only wakes agent; agent decides within policy. */
export async function runCycle() {
 const wallet=await walletInfo();
 if(!wallet.ready) throw new Error(wallet.error||"Vault not ready. Initialize Arc first.");
 const sql=db();
 // A PostgreSQL advisory lock serializes evaluations (not held during blockchain RPC); claim still done by executeDecision.
 const reserved = await sql.reserve();
 const [lock] = await reserved`SELECT pg_try_advisory_lock(62419714) AS locked`;
 if(!lock?.locked){await reserved.release(); throw new Error("Another treasury evaluation is running");}
 try {
  const obligations=await getObligations();
  const local=await getPolicy();
  const chain=await onchainPolicy(obligations.map(o=>o.recipient));
  if(chain.paused) throw new Error("Owner paused the vault onchain");
  const policy={...local,autonomousLimitCents:chain.autonomousLimitCents,singleLimitCents:chain.singleLimitCents,dailyLimitCents:chain.dailyLimitCents,allowedRecipients:chain.allowedRecipients};
  const candidates=outstanding(obligations).filter(o=>o.status==="pending" && dueInDays(o.dueDate)<=policy.horizonDays).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||({critical:0,high:1,normal:2}[a.priority]-{critical:0,high:1,normal:2}[b.priority])).slice(0,8);
  if(!candidates.length) return {decisions:[],note:"No eligible pending obligations within the policy horizon"};
  const result:Decision[]=[];
  let balance=wallet.balanceCents;
  for(const candidate of candidates) {
   const existing=await sql`SELECT id FROM decisions WHERE obligation_id=${candidate.id} AND status IN ('proposed','executing','executed','escalated') LIMIT 1`;
   if(existing.length) continue;
   const decision=await reasonAboutPayment(candidate,obligations,balance,policy);
   await saveDecision(decision);
   result.push(decision);
   if(decision.action==="pay" && decision.source==="claude") {
    try {await executeDecision(decision.id);balance=(await walletInfo()).balanceCents;candidate.status="paid";} catch(e){await logEvent("agent.payment_error",`Execution failed: ${candidate.title}`,{decisionId:decision.id,error:e instanceof Error?e.message:"Unknown"});}
   }
  }
  return {decisions:result,note:process.env.ANTHROPIC_API_KEY?"Agent evaluated and attempted authorized payments":"Rules-only preview. Set ANTHROPIC_API_KEY to enable autonomous settlement."};
 } finally {await reserved`SELECT pg_advisory_unlock(62419714)`;await reserved.release();}
}
