# Quorail — Project Brief

**Quorail** is an autonomous financial consequence engine for small businesses managing USDC on Arc. It asks a practical question before every payment: **what other commitments become endangered if this money leaves now?**

## The problem

A wallet balance does not distinguish truly spendable capital from funds already required for payroll, infrastructure, suppliers and an operating reserve. Human operators must manually interpret competing deadlines. Basic payment automation pays an invoice because it is due, even when that choice harms a more important commitment.

## The product

Quorail brings business obligations, due dates, priority, an operating reserve and an Arc USDC vault into one decision model. Its consequence engine calculates financial exposure and alternative outcomes. A configured Claude agent then chooses **pay**, **hold** or **escalate** and records its reason. The execution path re-checks liquidity rules, and an owner-controlled vault enforces counterparty allowlists, spending caps and payment-specific approvals.

## What is different

The main innovation is not a payment form with an AI summary. It is the explicit link between *today's payment* and *tomorrow's obligations*. The same system that explains a decision is also connected to an enforceable, testnet USDC payment flow. The onchain policy cannot be changed by the agent's prompt or confidence score.

## User journey

1. Enter the Control Room to review available USDC, upcoming commitments and the reserve.
2. Register an obligation with a verified payee address, amount, purpose and deadline.
3. Trigger a reasoning cycle, or let the protected scheduler wake the agent.
4. Inspect the alternative futures and the chosen action in the Decision Ledger.
5. For an authorized payment, verify the actual Arc transaction. For an escalation, obtain owner approval through the dedicated wallet.

## Architecture in brief

- Next.js, TypeScript and custom animated components for the public experience and treasury control room.
- PostgreSQL to store obligations, policy settings, decisions and an application-level chained audit log.
- A pure consequence model and a Claude-powered structured financial decision step.
- Viem for Arc Testnet RPC reads and vault transaction signing.
- `QuorailVault.sol` for onchain owner controls and USDC payout restrictions.
- Optional Circle App Kit crosschain testnet funding script.

## Verifiability

The public demo illustrates the interface without moving money. A live testnet pilot must be separately configured and funded. Only confirmed, real Arc transaction hashes are eligible to demonstrate actual payment volume; only genuine participating businesses count as traction.

## Intended users

Small development studios, early-stage Web3 teams, digital agencies and service businesses that handle USDC commitments and need to protect operational liquidity.

## Reusable infrastructure

The repository exposes financial consequence calculations, a restricted payment vault, a typed ABI and payment reconciliation patterns for other Arc builders. See [`ARC-OSS-SUBMISSION.md`](ARC-OSS-SUBMISSION.md).

**Builder:** Jayking — [GitHub](https://github.com/paulos-ui) · [X](https://x.com/__official__1). **Network:** Arc Testnet. **License:** MIT. **Status:** Hackathon testnet pilot, unaudited.
