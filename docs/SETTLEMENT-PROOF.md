# Quorail — First real Arc Testnet settlement and Tameion evidence

The public site is a simulation. The private control room can use a real Arc Testnet vault. Do not label demo balances or artificially self-dealing transactions as business traction.

## Preconditions (no transaction yet)

1. Quorail V4.2 deployed and `/api/health` reports `live-configured` (this only means configuration is present).
2. Vercel Neon database initialized with `scripts/schema.sql`, with a direct `DATABASE_URL_UNPOOLED` preferred for PostgreSQL session locks.
3. Claude `ANTHROPIC_API_KEY` configured in Vercel. The only server-side signer key is the dedicated TESTNET `AGENT_PRIVATE_KEY`; owner's private key stays local.
4. `VAULT_ADDRESS` and `NEXT_PUBLIC_VAULT_ADDRESS` point to the already-deployed Quorail vault; Arc chain ID is `5042002`.
5. Owner uses an injected EVM wallet controlling `owner()` of that vault and can sign in at `/console`.
6. Owner wallet has native testnet gas for allowlist changes. Agent wallet has native testnet gas for payments. Vault holds Arc Testnet ERC-20 USDC (different from the native gas balance).
7. Reserve floor and near-term obligations are calibrated to the actual testnet treasury balance. Avoid unrealistic forecasts.

Local read-only check (in the existing repo, with `.env.local` configured; this does not broadcast a transaction):

```bash
cd "/mnt/c/Users/MY PC/quorail"
npm run vault:status
```

## One genuine obligation

1. Identify a real business expense, milestone or service provider who legitimately expects payment. Confirm the recipient address with them, separately from the AI. For a pilot, authorize only a **dedicated testnet recipient**.
2. In `/console` → **Vault & access**, use the owner-wallet **Allow recipient** action. This sends an onchain policy transaction; verify its transaction hash and successful receipt.
3. In **Obligations**, enter the actual purpose, recipient, due date, and a small test amount such as `0.25 USDC`, respecting the onchain autonomous ceiling and the reserve floor.
4. In **Decision ledger**, click the manual agent-cycle action **once**. Claude may choose PAY, HOLD, or ESCALATE. All are legitimate decisions; no guarantee of payment should be claimed.
5. If PAY is authorized and executes, inspect the application decision ID and link to `https://testnet.arcscan.app/tx/<HASH>`.
6. Verify transaction status is **success**, `PaymentExecuted` event uses the expected payment identifier and recipient, and the ERC-20 token transfer shows the exact USDC amount. The agent wallet spending native USDC for gas is NOT the same as the recipient's token transfer.
7. If the attempt times out, **do not issue another cycle** until confirming whether a transaction was broadcast and reconciling that operation.

## Evidence worksheet (fill in only after confirmation)

| Field | Actual verified evidence |
| --- | --- |
| Pilot business and authentic use case | Not yet verified |
| Obligation description and business purpose | Not yet verified |
| Quorail decision ID | Not yet verified |
| Agent action and brief rationale | Not yet verified |
| Arc testnet vault address | Not yet verified |
| Receiving address (public only) | Not yet verified |
| Amount of test ERC-20 USDC received | Not yet verified |
| Arc transaction URL and confirmed status | Not yet verified |
| Business confirmation of settlement | Not yet verified |

For the Tameion demo video, record the actual pre-payment state, the decision, owner policy, and the verified Arc receipt. Submit genuine business participation and actual USDC volume, clearly distinguishing testnet from mainnet. Code deployment by itself is not evidence of traction.

Never share `DEPLOYER_PRIVATE_KEY`, `AGENT_PRIVATE_KEY`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, `SESSION_SECRET`, or other secrets in video or screenshots. This is a testnet pilot, not audited production custody.
