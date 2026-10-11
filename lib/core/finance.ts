import type { Action, Obligation, Option, Policy } from "./types";

/** Strict cents avoid floating-point payment ambiguity. Input maximum is bounded. */
export function toCents(value: string | number): number {
 const text = String(value).trim();
 if (!/^(0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(text)) throw new Error("Enter a nonnegative USDC amount with at most two decimals.");
 const [whole, fractional = ""] = text.split(".");
 const n = Number(whole) * 100 + Number(fractional.padEnd(2, "0"));
 if (!Number.isSafeInteger(n) || n > 100_000_000_000) throw new Error("Amount exceeds supported limit.");
 return n;
}
export function fromCents(cents: number) { return (cents / 100).toFixed(2); }
export function usd(cents: number, digits = 2) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(cents / 100); }
export function dueInDays(date: string, now: Date = new Date()): number {
 const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
 const target = new Date(`${date}T00:00:00Z`).getTime();
 return Number.isFinite(target) ? Math.ceil((target - today) / 86_400_000) : 99999;
}
export function outstanding(obligations: Obligation[]) { return obligations.filter(o => o.status === "pending" || o.status === "held" || o.status === "processing"); }
export function exposure(obligations: Obligation[], horizonDays: number, now = new Date()) {
 return outstanding(obligations).filter(o => dueInDays(o.dueDate, now) <= horizonDays).reduce((a, o) => a + o.amountCents, 0);
}
export function forecast(balanceCents: number, obligations: Obligation[], policy: Policy, now = new Date()) {
 const committed = exposure(obligations, policy.horizonDays, now);
 return { committed, availableAfterCommitments: balanceCents - committed - policy.reserveCents, coverage: committed === 0 ? 100 : Math.max(0, Math.min(100, Math.round(100 * (balanceCents - policy.reserveCents) / committed))) };
}
/** Pure, forkable consequence model. It makes no transfers and grants no spending authority. */
export function evaluateConsequences(balanceCents: number, obligations: Obligation[], candidate: Obligation, policy: Policy, now = new Date()) {
 const otherObligations = outstanding(obligations).filter(o => o.id !== candidate.id);
 const competing = exposure(otherObligations, policy.horizonDays, now);
 const discretionaryBefore = balanceCents - policy.reserveCents - competing;
 const availableAfterPay = discretionaryBefore - candidate.amountCents;
 const days = dueInDays(candidate.dueDate, now);
 const authorizedRecipient = policy.allowedRecipients.some(a => a.toLowerCase() === candidate.recipient.toLowerCase());
 const exceedsSingleLimit = candidate.amountCents > policy.singleLimitCents;
 const needsOwnerSignature = candidate.amountCents > policy.autonomousLimitCents;
 const risk = availableAfterPay < 0 || !authorizedRecipient || exceedsSingleLimit;
 const alternatives: Option[] = [
  { action: "pay", label: "Release payment", impact: `Projected buffer ${usd(availableAfterPay)} after competing obligations and reserve.`, score: risk ? 12 : days <= 2 ? 90 : 70 },
  { action: "hold", label: "Preserve liquidity", impact: `Retain ${usd(candidate.amountCents)} while monitoring the ${usd(competing)} due soon.`, score: risk ? 91 : days > 5 ? 65 : 24 },
  { action: "escalate", label: "Ask the owner", impact: needsOwnerSignature ? "Owner's onchain authorization is required." : "Send uncertain decisions to an owner for review.", score: needsOwnerSignature ? 94 : risk ? 72 : 20 },
 ];
 let recommendation: Action = availableAfterPay < 0 ? "hold" : !authorizedRecipient || exceedsSingleLimit || needsOwnerSignature ? "escalate" : days <= policy.horizonDays ? "pay" : "hold";
 return { competing, discretionaryBefore, availableAfterPay, authorizedRecipient, exceedsSingleLimit, needsOwnerSignature, days, recommendation, alternatives, risk };
}
