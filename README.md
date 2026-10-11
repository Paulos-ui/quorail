<div align="center">

# QUORAIL

### Every payment has a consequence.

**An autonomous financial consequence engine for USDC-powered businesses on Arc.**

*See the obligations behind a balance. Understand the cost of a decision. Settle only when the business can afford it.*

[Product walkthrough](#explore-the-product) · [Explore the architecture](#system-architecture) · [Operating guide](docs/DEPLOYMENT.md) · [Arc open-source primitives](docs/ARC-OSS-SUBMISSION.md)

**Designed and built by Jayking** · [GitHub @paulos-ui](https://github.com/paulos-ui) · [X @__official__1](https://x.com/__official__1)

</div>

---

## The problem is not the balance. It is what the balance must cover.

A business can have enough USDC to pay an invoice this afternoon and still be unable to meet payroll, infrastructure bills or other commitments next week. Most treasury tools show transactions and balances as independent entries. Business owners are left to assemble the consequences in their heads, and important decisions happen too late.

Quorail changes the unit of analysis. Rather than treating a payment as an isolated transaction, it evaluates that payment in the context of the **other obligations the business has already promised to meet**. The result is a treasury that can reason about when to spend, when to preserve capital and when a decision exceeds its authority.

Quorail is built for small companies, developer teams and service businesses that receive or settle payments in USDC. Its primary deployment target is **Arc Testnet**, using native USDC and an owner-controlled payment vault.

## A payment in context

Imagine a studio with **1,500 USDC**, upcoming obligations worth **1,200 USDC**, and a **200 USDC** operating reserve. Its discretionary liquidity is only **100 USDC**, despite the much larger wallet balance.

A new **600 USDC** service purchase arrives. A balance-only system sees 1,500 USDC. Quorail sees the commitments behind it. The consequence engine calculates the post-payment shortfall, presents alternatives and prevents the agent from automatically sending funds that would violate its known reserve policy.

When new revenue reaches the treasury, the agent can re-evaluate the request. If conditions now allow the payment and the owner's onchain policies permit it, Quorail can authorize settlement and record the resulting Arc transaction.

The product is designed around a simple principle:

> **A payment is not just money leaving an account. It changes what the business can do next.**

## What Quorail does

| Capability | What it means for the business |
|---|---|
| **Living Treasury** | Brings Arc USDC balance, registered obligations, deadlines, priorities and protected reserves into a single financial view. |
| **Financial Consequence Model** | Calculates the liquidity remaining after a potential payment and the commitments already due within the operating horizon. |
| **Autonomous Decision Engine** | A configured Claude model chooses whether to pay, hold or escalate based on actual structured treasury facts. |
| **Bounded Authority** | A Solidity vault enforces a recipient allowlist, per-payment limit, daily limit, emergency pause and payment-specific owner approvals. |
| **Decision Ledger** | Associates each agent decision with its rationale, alternatives, financial snapshot and execution status. |
| **Arc USDC Settlement** | Broadcasts permitted transfers on Arc Testnet; a successful onchain payment receives an actual transaction hash. |
| **Interactive Financial Map** | A custom scroll-driven visual language reveals how financial commitments compete for the same capital. |

### The three decisions

**PAY:** An eligible obligation is due, the available capital covers the obligation and known reserve requirements, and the payment passes the onchain authorization rules.

**HOLD:** Paying now could place other recorded commitments or the protected operating reserve at risk, or the payment is premature under the configured horizon.

**ESCALATE:** A payment requires the owner's explicit authorization or cannot proceed within the agent's existing permissions. An escalation is not a bypass; owner-controlled contract requirements still apply.

The model selects a decision. **Deterministic financial checks and the smart contract remain the enforcement boundary.** The agent does not receive authority to modify treasury spending limits merely because it generated a persuasive explanation.

## System architecture

```text
Business owner                         Quorail control room
    |                                          |
    | register obligations / policies         | display liquidity and decisions
    +--------------------+---------------------+
                         |
                    PostgreSQL
                         |
Arc Testnet USDC ---- Treasury state ---- Consequence engine
                                              |
                                       Claude reasoning
                                              |
                                     Policy validation
                                              |
                           +------------------+------------------+
                           |                                     |
                    Hold or escalate                          Eligible pay
                           |                                     |
                    Decision ledger                      Agent signer (viem)
                                                                 |
                                                      Owner-controlled USDC vault
                                                                 |
                                                          Arc Testnet receipt
                                                                 |
                                                          Recorded audit trail
```

**Why two layers?** The offchain model can evaluate economic consequences without paying transaction fees for each scenario. The onchain contract controls who may receive money and how much may be released. Neither layer alone is sufficient for responsible autonomous payments.

### Onchain control

[`contracts/QuorailVault.sol`](contracts/QuorailVault.sol) gives the owner authority to allow or deny recipients, rotate the agent signer, pause transfers, set spending limits and approve specific larger payments. An onchain payment ID also blocks reuse of the same decision identifier. Agent authorization and business solvency are different concerns: the vault enforces the former, while the consequence model evaluates the latter using recorded data.

### The design language

Quorail's interface is conceived as a financial instrument, not a generic crypto dashboard. Limestone and forest-ink surfaces frame an interactive commitment network; copper draws attention to decisions that matter. The landing page uses scroll position to change financial states, while the Control Room prioritizes traceable information over decorative charts. The visual story and the transaction logic express the same idea: **each choice changes the shape of future liquidity**.

## Explore the product

| Route | Experience |
|---|---|
| `/` | Cinematic introduction and interactive financial scenarios |
| `/console` | Treasury, obligations, decisions and policy controls |
| `/docs` | Public documentation: problem, architecture, use, limits and testnet integration |
| `/api/health` | Deployment health and demo/live configuration status |

Quorail has **two clearly separated operating modes**:

- **Demonstration:** Works without credentials or infrastructure. Financial values and agent assessments are illustrative, no USDC moves, and no transactions are fabricated.
- **Live testnet pilot:** Requires PostgreSQL, an admin session, a configured Claude API model, an owner-deployed Arc vault, an authorized agent signer and testnet USDC. Real USDC payments can occur only after those pieces are set up and tested.

**The repository is an implementation, not a claim of deployed funds or customers.** Onchain payment volume and business traction are established only by genuine usage and independently verifiable transactions.

## Technology

| Layer | Implementation |
|---|---|
| Application | Next.js 15, React 19, TypeScript, authored responsive CSS |
| Interaction | Framer Motion, GSAP, Lenis, authored SVG visualizations |
| Agent | Anthropic Claude for structured decisions, deterministic finance functions for guardrails |
| Data | PostgreSQL with `postgres.js`, integer-cent accounting and an application-level hash-chained audit log |
| Network | Arc Testnet (chain ID `5042002`), ERC-20 USDC |
| Execution | `viem` signer calling the Solidity QuorailVault |
| Circle tooling | Optional Circle App Kit bridge script; Circle Agent Wallet CLI documented for onboarding, **not** the default signing backend |
| Hosting | Vercel for Next.js; hosted PostgreSQL for persistent state |

No AI model is trusted to create or override authorization. Do not equate a model's confidence score with proof of payment, compliance or solvency.

## Developer quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. No environment variables are required to inspect the interactive demo.

```bash
npm run typecheck
npm test
npm run build
```

For **the complete installation, WSL-compatible Windows paths, GitHub updates, Vercel deployment, database creation, testnet wallet creation, contract deployment and first verified Arc payment**, follow **[Deployment & Operator Guide](docs/DEPLOYMENT.md)**. The guide is intentionally separate from this product overview.

For a condensed commissioning checklist covering Neon, Claude, Arc testnet funding, the vault and Vercel, see **[Live Setup Checklist](docs/LIVE-SETUP-CHECKLIST.md)**. A read-only setup check is available with `npm run verify:setup`; use `npm run verify:setup -- --claude` to make one small billable API call and validate Anthropic credentials.

The source also includes `.env.example` (variable names, never secrets), [`docs/ARC-OSS-SUBMISSION.md`](docs/ARC-OSS-SUBMISSION.md) (reusable Arc primitives), and [`docs/PROJECT-BRIEF.md`](docs/PROJECT-BRIEF.md) (a concise technical/impact brief).

## Current scope and important boundaries

Quorail is a **single-organization, Arc Testnet pilot**. It is not an audited financial product or a production multi-tenant treasury. The reserve model sees only obligations entered in the application; it cannot infer undisclosed liabilities. The recipient allowlist confirms that an address is approved by the vault owner, **not** that its identity, invoice or regulatory status was independently verified. The agent key is a dedicated testnet-only EVM signer, not a completed Circle-hosted custody integration. The audit chain offers tamper-evidence against ordinary application writes, not independent cryptographic attestation against a database administrator.

The project does not claim audited smart contracts, regulatory compliance, production-grade custody, customer adoption or real USDC volume until separately demonstrated. Anyone handling mainnet funds should obtain independent security and legal review, controlled custody and a substantial test plan before enabling real-value payments.

## Open infrastructure

Quorail is MIT-licensed and designed to contribute useful building blocks to the Arc ecosystem:

- [`lib/core/finance.ts`](lib/core/finance.ts): reusable consequence calculations independent of AI or an RPC provider.
- [`contracts/QuorailVault.sol`](contracts/QuorailVault.sol): bounded USDC payment permissions and payment replay protection.
- [`lib/server/execute.ts`](lib/server/execute.ts): payment claiming, confirmation and uncertain-transaction handling.
- [`lib/core/abi.ts`](lib/core/abi.ts): contract interface primitives for other Arc applications.

These modules can inform invoice workflows, AI procurement, contractor payments and other forms of bounded financial agency. See the [Arc showcase brief](docs/ARC-OSS-SUBMISSION.md).

## Creator and license

**Jayking** · [@paulos-ui](https://github.com/paulos-ui) · [@__official__1](https://x.com/__official__1)

Licensed under [MIT](LICENSE). Built independently; not affiliated with or endorsed by Circle, Arc or Canteen.
