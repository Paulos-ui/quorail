<div align="center">

# QUORAIL

### Know what a payment changes.

**A working treasury for businesses paying in USDC on Arc.**

*See the obligations behind a balance. Understand the cost of a decision. Settle only when the business can afford it.*

[The product](#explore-the-product) · [Explore the architecture](#system-architecture) · [Operating guide](docs/DEPLOYMENT.md) · [Arc open-source primitives](docs/ARC-OSS-SUBMISSION.md)

**Designed and built by Jayking** · [GitHub @paulos-ui](https://github.com/paulos-ui) · [X @__official__1](https://x.com/__official__1)

</div>

---

## The experience

Quorail returns to its original cinematic dark financial interface: an aubergine treasury canvas, warm metallic accents, a select-to-explore consequence network and four scroll-driven chapters. The visualization is a **public financial example**, not a live statement of any user's funds.

**Wallet-first:** Click **Connect your treasury** directly on the landing page. Choose your browser wallet and sign a free authentication message. If the wallet owns the existing Arc Testnet vault, Quorail opens `/console` immediately. There is **no intermediate wallet login page**. The app never asks for a private key and the signature does not authorize a payment. Any visitor can open `/console` to explore a **clearly labeled example workspace**, without seeing the owner's financial records or acquiring treasury authority.

**Tameion settlement evidence:** Once the authenticated owner runs a real Claude decision and Quorail confirms an Arc USDC payment, the **Settlement proof** tab lists the decision, recorded USDC amount, receiving wallet and Arcscan transaction link. The owner must independently inspect each receipt. The demo does not generate proof or claim artificial traction. The existing Circle App Kit bridging adapter remains optional; no Tameion API key or connection is required for the hackathon itself.

**Visual system (V4.3):** restored V2 dark cinematic landing, original moving commitment nodes and scroll-controlled decision chapter, with V4.2's deep-blue operational navigation retained. The finance/security engine and smart contract are unchanged. See [V4.3 restoration notes](docs/V43-DESIGN-RESTORE.md).

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
| **Interactive Consequence Field** | Explore sample obligations as an animated network and inspect the projected buffer. No blockchain transaction is sent by the public visualization. |

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

Quorail's interface is conceived as a financial instrument, not a generic crypto dashboard. Porcelain surfaces, oceanographic blue, mineral sea-glass, and restrained coral turn the treasury into an instrument. The interface resembles a navigable financial field, not a generic finance dashboard. The landing page responds to scroll progress and showcases a selectable consequence map: compare paying all recorded obligations with a what-if scenario that defers a selected obligation outside the horizon. These are illustrative calculations, not payment instructions. The Control Room prioritizes auditable information and accessible interactions over decoration. The visual story and the transaction logic express the same idea: **each choice changes the shape of future liquidity**.

## Explore the product

**V3 — Pelagic Ledger.** The public site opens directly into an interactive commitment map with no long, empty scroll spacer. The treasury workspace is **wallet-first**: the owner of the deployed vault signs a non-transaction authentication message, while other visitors can enter an isolated, local-only sandbox. Quorail does not require anyone to paste a private key into a browser UI.

- **Overview:** verified balance (owner workspace), near-term obligations, protected reserves, consequence field.
- **What if?:** adjustable spending and incoming-capital projections; simulations do not send transactions.
- **Obligations:** recipient wallet, due date, priority, amount.
- **Decision ledger:** pay/hold/escalate rationale, alternatives, actual Arc receipts.
- **Vault & access:** inspect limits, owner-sign recipient authorization or revocation.
- **Activity:** inspect the financial audit trail.

The single-organization implementation is an **Arc Testnet pilot**, not audited custody infrastructure or a multi-tenant wallet platform. Non-owner wallets never receive private treasury records.


| Route | Experience |
|---|---|
| `/` | Cinematic introduction and interactive financial scenarios |
| `/console` | Treasury, obligations, decisions and policy controls |
| `/docs` | Public documentation: problem, architecture, use, limits and testnet integration |
| `/api/health` | Deployment health and demo/live configuration status |

Quorail has **two clearly separated operating modes**:

- **Demonstration:** Works without credentials or infrastructure. Financial values and agent assessments are illustrative, no USDC moves, and no transactions are fabricated.
- **Live testnet pilot:** Requires PostgreSQL, a vault-owner wallet session, a configured Claude API model, an owner-deployed Arc vault, an authorized agent signer and testnet USDC. Real USDC payments can occur only after those pieces are set up and tested.

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

## Owner access and visitor privacy

Quorail V3 is **wallet-first, not password-first**. On a configured Arc Testnet deployment, the connected wallet signs a short-lived authentication message, then the server checks the recovered signer against the deployed vault's current `owner()` address. Only that owner may read the private treasury or call the protected financial APIs. Non-owners can choose a clearly labelled, browser-only sandbox. The server returns no private treasury state to unauthenticated visitors. An owner-signature session is not permission to bypass the vault's spending limits.

No private key is ever entered into the site. The owner/deployer key remains local. The agent's testnet-only key lives in server-side Vercel secrets. The retired password route returns HTTP 410, and `ADMIN_PASSWORD` is not used by V3. To set up the new login, keep your existing `SESSION_SECRET` and vault address; **do not deploy another vault** just to upgrade the frontend.

The current visual system is documented in [`docs/V3-DESIGN-SYSTEM.md`](docs/V3-DESIGN-SYSTEM.md), with an in-place migration checklist in [`docs/V3-RELEASE-NOTES.md`](docs/V3-RELEASE-NOTES.md). Earlier V2 design notes are retained as project history.
