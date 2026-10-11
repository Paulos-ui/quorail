/** Serializable reusable treasury primitives. All amounts are integer USDC cents. */
export type Priority = "critical" | "high" | "normal";
export type ObligationStatus = "pending" | "processing" | "paid" | "held";
export type Action = "pay" | "hold" | "escalate";
export type DecisionStatus = "proposed" | "executing" | "executed" | "failed" | "held" | "escalated";
export interface Obligation {
 id: string; title: string; counterparty: string; recipient: string; amountCents: number;
 dueDate: string; priority: Priority; category: string; status: ObligationStatus;
 createdAt: string; txHash?: string | null;
}
export interface Policy {
 reserveCents: number;
 horizonDays: number;
 autonomousLimitCents: number;
 singleLimitCents: number;
 dailyLimitCents: number;
 allowedRecipients: string[];
}
export interface Option { action: Action; label: string; impact: string; score: number }
export interface Decision {
 id: string; obligationId: string; obligationTitle: string; action: Action;
 reason: string; alternatives: Option[]; confidence: number; source: "claude" | "rules" | "demo";
 snapshot: { balanceCents: number; obligationsCents: number; reservesCents: number; disposableCents: number };
 status: DecisionStatus; txHash?: string | null; createdAt: string;
}
export interface AuditEntry {
 id: string; at: string; kind: string; message: string; payload: Record<string, unknown>;
 prevHash: string; hash: string;
}
export interface TreasuryState {
 mode: "demo" | "live";
 balanceCents: number; vaultAddress: string | null; agentAddress: string | null;
 policy: Policy; obligations: Obligation[]; decisions: Decision[]; audit: AuditEntry[];
 authenticated: boolean; agentReady: boolean; vaultReady: boolean; walletError?: string;
}
