# Quorail — Arc Open Source Showcase Candidate

## Why this project belongs in the showcase
Quorail exposes a practical pattern for **bounded financial agency on Arc**: a reasoning engine that selects between real spending alternatives, deterministic liquidity checks, contract-enforced authority, and replay-resistant USDC settlement, with a visible explanation and transaction receipt for each decision.

## Reusable primitives
1. `lib/core/finance.ts`: pure consequence model with typed obligations and policy. No RPC and no AI dependency; builders can reuse it inside payments, procurement, invoice automation, and agent budgeting workflows.
2. `contracts/QuorailVault.sol`: owner-controlled Arc USDC vault with recipient allowlist, autonomous ceiling, hard single/daily budgets, exact-payment approval, emergency pause, signer rotation, and unique payment IDs.
3. `lib/server/arc.ts`: Arc RPC and USDC adapter, balance reads, vault state reads, testnet chain validation, guarded transaction dispatch.
4. `lib/server/execute.ts`: claimed payments, idempotent transaction identifiers, audit trail, no blind retries after ambiguous settlement.
5. `scripts/bridge-to-arc.ts`: optional Circle App Kit crosschain USDC bridge onto Arc Testnet.
6. `lib/core/abi.ts`: typesafe minimal interface for downstream integrations.

## What it adds beyond common arc-* examples
Quorail is not only a wallet-transfer demo. It links spending intent to **future commitments** and makes the agent's decision legible. The onchain policy enforces a split between **low-value autonomous agency** and **high-value exact-payment owner approval**. The same primitives can become a standalone forkable infra repository.

## Publishing and eligibility
- Keep source under the MIT license permanently and leave the GitHub repository public.
- Supply a live product URL and link to the forkable primitive paths (or a separately extracted open-source repository).
- Document tests, environmental configuration, chain ID, vault deploy procedure, and limits.
- Include verified Arc Testnet transaction hashes only after making real transactions.
- Use the Tameion submission form OSS opt-in or `arc-canteen submit-showcase` CLI.

**No acceptance or showcase selection is implied.**
