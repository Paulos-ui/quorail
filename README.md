<div align="center">

# QUORAIL

### Every payment has a consequence.

**A financial consequence engine for autonomous business treasuries on Arc.**

Interactive treasury scenarios · Reasoned AI decisions · Contract-enforced USDC spending · Verifiable audit trails

[Explore the product](https://tameion.thecanteenapp.com/) · [Arc documentation](https://docs.arc.network/) · [Circle Agent Stack](https://developers.circle.com/agent-stack)

**Creator:** Jayking · [GitHub @paulos-ui](https://github.com/paulos-ui) · [X @__official__1](https://x.com/__official__1)

</div>

---

## 1. What Quorail is

A business can afford a payment today but fail to afford tomorrow's invoice because the money was already committed. Quorail connects balances, outstanding obligations, deadlines, reserve requirements and onchain spending limits, then evaluates three choices: **pay, hold, or escalate**.

The primary innovation is **financial consequence modeling**. Before a payment moves, Quorail estimates what paying would leave available after the other obligations it knows about and the owner's protected cash reserve. A configured Claude model considers those facts and recommends a course of action. Hard checks prevent AI-generated suggestions from overriding liquidity protections or owner-controlled contract permissions.

Its testnet payment path sends native Circle USDC (ERC-20 6-decimal interface) from a dedicated vault to a pre-approved recipient on **Arc Testnet**. A business owner must approve exact high-value payments directly in the contract.

### Product areas

- **Cinematic marketing**: distinctive limestone, forest ink, copper editorial design; scroll-driven interactive financial graph; three spend scenarios; architecture narrative.
- **Treasury control room**: dynamic financial map, real/illustrative balance, pending obligations, 14-day exposure, reserved buffer.
- **Obligation register**: actual recipients, amounts, business purpose, dates and priorities.
- **Decision ledger**: agent action, rationale, rejected alternatives, snapshots, execution status and verifiable Arc transaction hashes.
- **Policy & trust**: reserve, risk boundary, onchain limits, allowlisted recipients, vault account status.
- **Integrated documentation**: `/docs` explains use, architecture, security, integrations and limitations.

## 2. What is real vs. what is a demo?

This distinction is essential for judges, users and anyone evaluating treasury software.

| Experience | No credentials (Demo) | Configured live pilot |
|---|---|---|
| UI and animations | Functional | Functional |
| Obligations | Illustrative + your browser-local examples | Real entries in PostgreSQL |
| Balances | Clearly marked illustrative number | Queried from Arc Testnet USDC contract |
| Reasoning | Deterministic illustrative assessment | Anthropic Claude + deterministic constraint layer |
| Payments | **NEVER sent** | Signed vault transactions on Arc Testnet |
| Receipts | **No fabricated transactions** | Arc transaction hashes after actual broadcast |
| Login | Not required | Admin password + signed HttpOnly cookie |

**A source ZIP does not automatically deploy a smart contract, create a business customer, fund a wallet, or prove hackathon traction.** You must configure and execute the real workflow described below. This is a single-business testnet pilot, **not audited mainnet financial infrastructure**.

## 3. Quickest way to run the demo

Requirements: Node.js **22+** and npm.

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. Use the **Launch app** button. All demo data stays in the browser; no keys, database or wallet needed.

To run checks:

```bash
npm run typecheck
npm test
npm run build
```

## 4. Deploy the ZIP INTO an existing GitHub repository (Git Bash)

**This archive is packaged at the root.** It does not contain an extra `quorail/` directory, `.git`, or any secrets.

1. Create a new **public** GitHub repository, e.g. `paulos-ui/quorail`. Do not initialize it with a template if you intend to use a fresh empty folder; a preexisting cloned repository is also fine.
2. Clone/open **that existing repository** and open Git Bash within its working directory. Your prompt should be at the repository root (where `.git` lives).
3. Download the ZIP from ChatGPT into `Downloads`.
4. Paste this **single command block**. Replace the ZIP filename/location if yours differs.

```bash
# Run INSIDE your existing repository directory.
unzip -oq "$HOME/Downloads/quorail-complete.zip" -d .
npm install
npm run typecheck
npm test
npm run build
git add .
git commit -m "Build Quorail financial consequence engine"
git push
```

**Important:** `unzip -oq` overwrites matching files in the directory and does not replace `.git`. Commit or save any existing work before extracting. The ZIP intentionally contains files at the root so nothing gets nested.

If you're starting from scratch rather than an existing checkout:

```bash
git clone https://github.com/paulos-ui/quorail.git
cd quorail
```

Then run the ZIP extraction block above in that same folder. If `git push` says your upstream is missing, run `git push -u origin main` (or the name of your active branch).

**If you only want to check out the design first, stop after `npm run dev`.** No chain deployment is required to explore the demo.

## 5. Configure a LIVE Arc Testnet pilot

### Step A: Environment

Copy and edit the provided template in your editor:

```bash
cp .env.example .env.local
```

Never commit `.env.local`. A new `.env.local` is ignored by Git. In particular, never place a private key in `NEXT_PUBLIC_*` or your frontend code.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string; e.g. Neon / Supabase Postgres |
| `ADMIN_PASSWORD` | One-business dashboard login password, 16+ random characters recommended |
| `SESSION_SECRET` | At least 32 random bytes/string, used to sign login sessions |
| `ANTHROPIC_API_KEY` | Allows genuine AI reasoning; no key means rules-only decisions with no automatic settlement |
| `ANTHROPIC_MODEL` | An available Claude model ID under your API account |
| `ARC_RPC_URL` | Default `https://rpc.testnet.arc.network` |
| `AGENT_PRIVATE_KEY` | Dedicated testnet-only EVM agent signing key. Server-side secret. |
| `DEPLOYER_PRIVATE_KEY` | **LOCAL ONLY** vault owner's signing key; remove after deployment. Never add to Vercel. |
| `VAULT_ADDRESS` | Deployed QuorailVault address |
| `NEXT_PUBLIC_VAULT_ADDRESS` | Same deployed vault address; public value, safe for browser |
| `AUTONOMOUS_LIMIT_USDC` | Owner-deployed cap, e.g. `50` |
| `SINGLE_LIMIT_USDC` | Hard per-payment maximum, e.g. `200` |
| `DAILY_LIMIT_USDC` | Daily cumulative contract spending maximum, e.g. `400` |
| `CRON_SECRET` | Long random token protecting scheduled agent cycles |

When all three `DATABASE_URL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` are set, the UI switches from demo to live login mode.

### Step B: Initialize PostgreSQL

Run once, using your `.env.local` connection string:

```bash
npm run db:init
```

Tables contain obligations, decision records, policies and an append-only (at application level) SHA-256 chained audit history. The initialization **does not insert fake funds, invoices, businesses, or transactions**.

The initial treasury reserve is `1800` USDC in the database. **For a small testnet pilot, lower it to a suitable REAL test amount.** For example, if you have 20 test USDC, set reserve to 3:

```sql
UPDATE treasury_settings SET reserve_cents = 300, horizon_days = 14 WHERE id = 1;
```

Run that SQL in your database provider's SQL console. The `reserve_cents` amount is in integer cents (`300` means $3). This setting is a decision-engine guardrail; the onchain payment limits remain separate and must be configured in the contract.

### Step C: Set up Arc wallets + faucet

Quorail v1 uses a dedicated EVM private key signer (`viem`) to call the onchain vault. Use **testnet-only, low-value accounts** and a separate owner wallet. Circle Agent Wallet CLI can also help you create/fund an agent wallet, but it is **not** the actual automated signer unless you integrate a Circle-hosted signing adapter later. Do not misrepresent this as completed Circle Wallets SDK integration.

Arc Testnet:

```
Network: Arc Testnet
Chain ID: 5042002
RPC: https://rpc.testnet.arc.network
USDC (ERC-20): 0x3600000000000000000000000000000000000000
USDC ERC-20 decimals: 6
Native transaction gas unit: USDC (18 decimals)
Explorer: https://testnet.arcscan.app
Faucet: https://faucet.circle.com
```

Circle Agent Stack reference (optional Circle-hosted wallet onboarding):

```bash
npm install -g @circle-fin/cli
circle wallet login you@example.com --testnet
circle wallet list --type agent --chain ARC-TESTNET
```

Follow the official CLI prompts. **Do not share email OTPs, wallet private keys or recovery phrases with an AI agent.** For Quorail's default viem signing adapter, use your own dedicated EVM testnet private key.

### Optional: Circle App Kit crosschain funding (actual Circle SDK integration)

The package includes `scripts/bridge-to-arc.ts`, an **optional Circle App Kit** integration for bridging test USDC from Ethereum Sepolia to Arc Testnet. This uses `@circle-fin/app-kit` and `@circle-fin/adapter-viem-v2` according to the official Arc bridge quickstart. It is separate from Quorail's recurring treasury payment adapter.

If you already control Ethereum Sepolia test USDC and ETH to pay source-chain gas, set `BRIDGE_PRIVATE_KEY` and `BRIDGE_AMOUNT_USDC` locally, then run:

```bash
npm run circle:bridge
```

Inspect real explorer URLs in the output. **Do not run this on mainnet or with any valuable wallet**. It is not necessary to bridge if your wallet already holds test USDC on Arc via the Circle faucet.

### Step D: Deploy the owner-controlled vault

In `.env.local`, add `DEPLOYER_PRIVATE_KEY`, `AGENT_PRIVATE_KEY` and your intended limits. The agent and owner must be **different keys**. The deployment needs the owner wallet funded with Arc test USDC to pay network gas.

```bash
npm run vault:deploy
```

The command prints the new contract address and a real Arc explorer link. Copy the contract address into both:

```text
VAULT_ADDRESS=0xYourDeployedContract
NEXT_PUBLIC_VAULT_ADDRESS=0xYourDeployedContract
```

**Never put `DEPLOYER_PRIVATE_KEY` into Vercel. Remove it from your cloud environment if you accidentally added it.** The app's `AGENT_PRIVATE_KEY` should also be a limited-purpose testnet signer; better signing architecture is needed before real mainnet use.

To verify deployment/agent identity:

```bash
npm run vault:status
```

### Step E: Allowlist payment recipients (contract-level)

The owner must explicitly allow a business recipient before Quorail's agent can transfer to them.

```bash
npm run vault:configure -- allow 0xRecipientWalletAddress
```

To revoke a recipient:

```bash
npm run vault:configure -- deny 0xRecipientWalletAddress
```

To emergency-pause or resume the vault:

```bash
npm run vault:configure -- pause
npm run vault:configure -- unpause
```

To recover your test USDC using the **owner** key (not the agent):

```bash
npm run vault:configure -- withdraw 0xYourOwnerWalletAddress 10
```

Fund **the VAULT ADDRESS** with testnet USDC. Funding the agent signer alone does not fund the vault's expenditure balance. The agent may need a small testnet USDC gas balance as well, because gas is paid in USDC.

### Step F: Enable genuine AI reasoning

Set `ANTHROPIC_API_KEY` and select a supported Claude model in `ANTHROPIC_MODEL`. The model will evaluate pay, hold or escalate based on the known obligations and operating buffer. The API request contains business obligation facts, so only use this with a business that consents to sending those details to your model provider.

The agent's selected action cannot bypass hard constraints: if paying would violate protected obligations/reserve or if the recipient is not allowlisted, the model does not get to force a payment. Amounts above the contract's autonomous cap require an owner-signed payment-specific approval.

### Step G: Execute one genuine end-to-end business workflow

1. Create a real business obligation. Use a legitimate recipient wallet and an amount small enough for your testnet vault.
2. Ensure the vault's onchain allowlist includes that recipient.
3. Ensure the reserve and pending commitments leave enough headroom for that payment.
4. Click **Run agent cycle** in the authenticated Control Room.
5. The Claude agent chooses a response. For an authorized `pay`, the server submits the transaction automatically.
6. Open the Decision Ledger, inspect the rationale and open the **actual Arc explorer receipt**.
7. For an `escalate` over the autonomous threshold, the owner connects a separate wallet and approves the exact recipient + amount + decision ID. Then they can trigger settlement.
8. Capture the real transaction hash, business feedback, and outcome for traction evidence.

**Caution:** If a transaction is broadcast but the receipt times out, its decision becomes `failed` and the obligation remains locked in `processing`. This is deliberate: do not send the same payment blindly again. Inspect the receipt and, if successful, use the Decision Ledger's **Reconcile Arc receipt** button. Manual database support may be needed for unusual RPC failure cases.

## 6. Deploy to Vercel

After testing locally, push to the repository and import it into [Vercel](https://vercel.com/). Add these environment variables in Vercel Project Settings:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`
- `ARC_RPC_URL`, `AGENT_PRIVATE_KEY`
- `VAULT_ADDRESS`, `NEXT_PUBLIC_VAULT_ADDRESS`
- `CRON_SECRET`

**DO NOT set `DEPLOYER_PRIVATE_KEY` in Vercel.** Do not enable mainnet with the existing code. The protected scheduler endpoint is `GET /api/agent/cron` and requires header `Authorization: Bearer $CRON_SECRET`. `vercel.json` contains a once-daily schedule. Cron plan availability, function timeouts and billing depend on your Vercel plan; adjust if necessary.

Vercel automatically builds Next.js. Postgres persistence is required for multi-invocation serverless environments; demo uses browser storage only.

## 7. Codebase structure

```
app/
  page.tsx                      # cinematic landing
  console/page.tsx              # treasury application
  docs/page.tsx                 # integrated professional documentation
  api/auth/*                    # signed-cookie admin login
  api/state                     # live chain/database treasury snapshot
  api/obligations               # authenticated obligation creation
  api/agent/run                 # agent decision + autonomous execution
  api/agent/execute             # explicit settlement of approved decision
  api/agent/reconcile           # verify successful Arc receipt after timeout
  api/agent/cron                # protected scheduled autonomous cycle
components/
  Landing.tsx                   # editorial story with scroll-based graph
  StageGraph.tsx                # purpose-built SVG commitment topology
  Console.tsx                   # interactive financial control room
  Brand.tsx                     # custom vector identity
contracts/
  QuorailVault.sol              # onchain limit/allowlist/payment guardrails
lib/core/
  types.ts                      # reusable typed financial objects
  finance.ts                    # deterministic consequence engine
  chain.ts                      # Arc chain config, units and payment IDs
  abi.ts                        # minimal contract interfaces
lib/server/
  arc.ts                        # RPC reads, delegated EVM signer and settlement
  agent.ts                      # structured agent reasoning and cycle
  execute.ts                    # claim, verify, broadcast, reconcile boundary
  auth.ts                       # session integrity and request-origin guard
  db.ts                         # PostgreSQL and audit/event trail
scripts/
  schema.sql                    # PostgreSQL tables
  init-db.ts                    # first-run database initializer
  deploy-vault.ts               # local owner vault deployment
  configure-vault.ts            # allow/deny/pause/recover owner actions
  vault-status.ts               # live chain diagnostics
  bridge-to-arc.ts              # optional Circle App Kit USDC bridge
docs/ARC-OSS-SUBMISSION.md      # Arc open-source reusable-primitive pitch
tests/finance.test.ts           # deterministic economic model tests
```

## 8. Security boundaries and limitations

**Intended operating environment:** Arc Testnet and real businesses testing with testnet assets. This contract and service were designed for a hackathon, **not independently audited**.

- **Contract-authoritative**: agent signer cannot rewrite vault budgets, recipients, owner approvals or pause flag. Above-autonomous transactions require exact-payment approval.
- **Offchain liquidity guardrail**: constraints are recalculated immediately before broadcast; this protects known business obligations, but unrecorded external commitments cannot be detected.
- **Server-side credentials**: keys are never stored in React props or client-side browser state. Vercel configuration must remain private. Admin sessions are signed, HTTP-only and same-site; this is one-business access, not full identity/role management.
- **Idempotency**: each decision ID becomes a bytes32 vault payment ID. Duplicate IDs are rejected onchain. Application doesn't blindly retry ambiguous transfers.
- **Observability**: each action has an associated decision record and audit entry; SHA-256 audit chaining is tamper-evident against normal application writes, but a database admin can rewrite the database and there is no independent attestation anchor.
- **Source validation**: v1 assumes the business administrator authenticates obligations and addresses. It does **not** perform KYB/KYC, legal invoice verification or AML screening.
- **Concurrency**: use a single organization/worker with PostgreSQL. A session-level advisory lock is used for evaluation; however, serverless restart/reconciliation still requires operational care.
- **Hard spending cap** is enforced in Solidity. **Minimum reserve** is an offchain treasury rule and is *not* enforced in the vault contract.
- **Circle integration detail**: Arc native USDC is used for settlement. The default execution signer uses viem and a dedicated EVM key; Circle App Kit CCTP bridging is included as an optional actual integration and Circle's Agent Wallets CLI workflow is included for onboarding/funding reference, not as a claim of integrated Circle-hosted custody.
- **No live demo claim**: until you deploy/fund and send a real testnet transaction, Quorail has no onchain transaction to demonstrate.

## 9. Hackathon submission checklist

### Tameion Agents Hackathon

- [ ] Registration completed: https://luma.com/ivroypr5
- [ ] Public `github.com/paulos-ui/quorail` repository live
- [ ] Live Vercel app with responsive public showcase and working control room
- [ ] Configured Arc Testnet vault funded with test USDC
- [ ] At least one **genuine** business workflow with an actual USDC Arc tx hash
- [ ] Consent and business usage evidence (onboarded businesses, payment amount, solved problem)
- [ ] Screen record under 3 minutes: consequence map → actual agent decision → enforceable guardrail → verified tx and audit
- [ ] Submit here: https://forms.gle/BBWrdfuircrKiG2i6 (deadline **Oct 17, 2026, 11:59 PM ET**)

### Arc Open Source Showcase

- [ ] Keep repository public and MIT licensed
- [ ] Highlight `lib/core` + `contracts/QuorailVault.sol` as reusable primitives
- [ ] Include `docs/ARC-OSS-SUBMISSION.md` and meaningful tests
- [ ] Compare against `circlefin/arc-*` examples and explain what is additive
- [ ] Publish a standalone primitives repo if requested / beneficial
- [ ] Opt in on the Tameion submission form or use `arc-canteen submit-showcase`

Read the [official showcase rules](https://arc-oss.thecanteenapp.com/). Selection is not guaranteed.

## 10. Suggested 2:45 demo narrative

| Seconds | Show |
|---|---|
| 0–25 | The problem: paying an invoice can compromise future obligations |
| 25–55 | Scroll-driven three-future visualization and product differentiation |
| 55–95 | Log into live control room; explain balance, commitments, protected reserve |
| 95–130 | Run an actual Claude agent cycle; inspect options and reason |
| 130–153 | Show onchain contract limit and an actual confirmed USDC Arc receipt |
| 153–165 | Share **real** pilot/business outcome and point to open-source primitives |

## 11. Licensing and contacts

MIT License. Copyright © 2026 Quorail contributors.

Builder: **Jayking**, [GitHub @paulos-ui](https://github.com/paulos-ui) · [X @__official__1](https://x.com/__official__1)

**Quorail is independently built and is not officially endorsed by Arc, Circle or Canteen.**
