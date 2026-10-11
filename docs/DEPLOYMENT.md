# Quorail · Deployment and Operator Guide

This document is for project maintainers deploying the source and activating the **Arc Testnet** pilot. The product vision, real capabilities and architectural principles are in [the main README](../README.md).

## 1. Fix the Windows / WSL path correctly

On the contributor's current computer, the Windows account folder has a **space** in its name. WSL shows it as `/mnt/c/Users/MY PC/`, not as `$HOME/Desktop`. `$HOME` in WSL normally points to `/home/jayking`, which is why the earlier ZIP command could not find the file.

Create/open the existing public repository `https://github.com/paulos-ui/quorail`. Put the updated ZIP on the **Windows Desktop**. In your **Ubuntu/WSL terminal**, run this block:

```bash
cd "/mnt/c/Users/MY PC/quorail" &&
unzip -oq "/mnt/c/Users/MY PC/Desktop/quorail-v1-live-ready.zip" -d . &&
test -f package.json &&
node scripts/doctor.mjs &&
npm install &&
npm run typecheck &&
npm test &&
npm run build &&
git add . &&
git commit -m "Fix Quorail TypeScript and vault ABI" &&
git push -u origin HEAD
```

This release corrects the `Option[]` JSONB serialization compile error, synchronizes the vault ABI and fixes the regression-test TypeScript string inference. It also adds `npm run verify:setup` for read-only connectivity checks. The `&&` chaining stops at the first error. This prevents accidentally committing or pushing an empty repository when extraction or testing fails. The ZIP contains files at its root, no nested project folder and no `.git` directory. Your existing Git history is preserved. The ZIP **overwrites matching project files**, so commit existing changes before extracting if you want to preserve older versions.

**First-time setup only**, if the local clone does not exist:

```bash
cd "/mnt/c/Users/MY PC" &&
git clone https://github.com/paulos-ui/quorail.git &&
cd quorail
```

**Path troubleshooting:**

```bash
ls "/mnt/c/Users/MY PC/Desktop"/*.zip
pwd
ls package.json
```

If the ZIP actually lives in Downloads or OneDrive/Desktop, adjust only the ZIP path. If you launch Windows Git Bash rather than WSL, use `/c/Users/MY PC/...` paths instead of `/mnt/c/Users/MY PC/...`.

## 2. Public demo on Vercel (no secrets)

1. Open https://vercel.com/new and import `paulos-ui/quorail` from GitHub.
2. Set framework to **Next.js**, root to `./` and the install/build commands to `npm install` / `npm run build`.
3. Choose a compatible Node.js version (22+). **Do not enter any environment variables for the first deployment.**
4. Deploy, and inspect `/`, `/console`, `/docs`, `/api/health`. A correct first demo reports `"mode":"demo"`.
5. Changing environment variables later requires a new Vercel deployment. Do not consider a deployment complete until its build and runtime logs are clean.

**Do not activate live mode before PostgreSQL tables and the Arc vault are ready.** Adding the three core variables `DATABASE_URL`, `ADMIN_PASSWORD` and `SESSION_SECRET` together switches the server to live mode.

## 3. Configure the live Arc Testnet pilot

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

For Quorail's default viem signing backend, the package includes an optional helper that creates **fresh testnet-only EVM signer keys** on your own computer after `npm install`:

```bash
npm run wallet:new -- owner
npm run wallet:new -- agent
```

Run once for each role, copy each private key **privately** to the appropriate `.env.local` variable, and save the public addresses for funding and configuration. Do not screenshot, post, or commit the keys. The owner key is used for local deployment and owner controls; the limited agent key is the one the application uses to initiate approved transfers. The helper creates a keypair only; it does **not** deploy a vault, fund a wallet or call Arc. Optionally use a separate owner wallet created in MetaMask if you can sign through the required deployment tooling. Do **not** reuse your main wallet's private key.


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

## 4. Deploy to Vercel

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


## 5. Exact Vercel environment-variable plan

**Stage A — public demo:** leave the Environment Variables screen empty.

**Stage B — authenticated database and AI (after initializing the schema):** add the following values through Vercel → Project → Settings → Environment Variables. Select **Production** and redeploy.

| Variable | Value source | Keep secret? |
|---|---|---|
| `DATABASE_URL` | A new PostgreSQL database connection string from Neon, Supabase or your own Postgres | Yes |
| `ADMIN_PASSWORD` | A newly generated strong password used only for this pilot | Yes |
| `SESSION_SECRET` | Fresh long random value, e.g. `openssl rand -hex 32` | Yes |
| `ANTHROPIC_API_KEY` | Anthropic Console developer API key | Yes |
| `ANTHROPIC_MODEL` | Model ID enabled for your API account | No |
| `ARC_RPC_URL` | `https://rpc.testnet.arc.network` | No |

**Stage C — verified USDC payments (only after deploying/funding the testnet vault):**

| Variable | Value source | Keep secret? |
|---|---|---|
| `AGENT_PRIVATE_KEY` | New purpose-specific Arc testnet-only EVM account, not your main wallet | **YES** |
| `VAULT_ADDRESS` | Address emitted from `npm run vault:deploy` | Public contract address |
| `NEXT_PUBLIC_VAULT_ADDRESS` | Same address as `VAULT_ADDRESS` | Public contract address |
| `CRON_SECRET` | Separate random value, `openssl rand -hex 32` | Yes |

The vault **owner's** `DEPLOYER_PRIVATE_KEY` stays on the local device only; do **not** place it in Vercel. Also keep `BRIDGE_PRIVATE_KEY` local if using optional crosschain funding. Never place any signing key, API key or password in a `NEXT_PUBLIC_` variable or GitHub repository.

**Database reuse:** It is fine to reuse an existing Neon or Supabase account or Postgres server, but create a **separate Quorail database or isolated database project** rather than pointing Quorail at production tables from an unrelated app. Quorail v1 uses session-level PostgreSQL advisory locks in its agent cycle, so use a **direct PostgreSQL connection**, not a PgBouncer transaction-pooling URL (often marked `-pooler` in Neon). For this single-business pilot, keep application traffic low and monitor connection limits. A future scale-up should replace session locks with a durable job/lease strategy and then use pooling.

**Wallet reuse:** An existing wallet interface such as MetaMask can be used to *view or authorize on Arc Testnet*, but create two **fresh low-value testnet-only addresses** for Quorail: an owner/deployer and a limited agent signer. Do not copy a seed phrase or main wallet private key into Vercel. The vault address is not chosen ahead of time: it is produced **when the Solidity contract is deployed**. The beneficiary/recipient wallet is a third address owned by a real authorized payee (or a controlled test recipient for development).

**Anthropic access:** A Claude chat subscription does not automatically supply API credits. `ANTHROPIC_API_KEY` must be obtained from the Anthropic developer console and enabled for API usage.

**Circle scope:** Quorail transfers native USDC on Arc using its smart-contract vault and a viem EVM signer. The Circle App Kit bridge utility is optional. This package does not claim that its primary agent is using Circle-hosted programmable custody.

### Readiness checklist before any live agent cycle

- [ ] New Postgres database initialized, login works.
- [ ] Arc Testnet chosen; signer, owner and recipient addresses double-checked.
- [ ] Vault deployed, signer configured and recipient allowlisted onchain.
- [ ] Vault and signer funded with enough **testnet USDC** to operate.
- [ ] Reserve adjusted to realistic pilot levels.
- [ ] Actual payable obligation exists and is independently verified by the business.
- [ ] Anthropic API key works and produces a structured decision.
- [ ] Contract limits checked; uncertain transactions never blindly retried.
- [ ] Test payment confirmed with a real Arcscan transaction receipt.

## 6. Commands reference

| Command | Meaning |
|---|---|
| `npm run doctor` | Check repository location and required source files without reading secrets |
| `npm run dev` | Run demo or configured pilot locally |
| `npm run typecheck` | Check TypeScript declarations |
| `npm test` | Run deterministic consequence-model tests |
| `npm run build` | Produce the Next.js production build |
| `npm run db:init` | Initialize PostgreSQL schema (no fake customer/funds) |
| `npm run wallet:new -- owner` | Generate a new local EVM wallet key and address for Arc Testnet only |
| `npm run wallet:new -- agent` | Generate the separate limited agent signer |
| `npm run vault:deploy` | Deploy testnet policy vault with local owner key |
| `npm run vault:status` | Verify deployed vault onchain |
| `npm run vault:configure -- allow 0x…` | Authorize an intended payee |
| `npm run vault:configure -- pause` | Emergency stop |
| `npm run circle:bridge` | Optional Circle App Kit test USDC bridge |

**Operational security:** This is an unaudited testnet pilot. Do not add real mainnet USDC or valuable private keys. Do not share private environment variables in support messages or screenshots.


## 6. Verify Quorail integrations without transferring funds

After copying the new ZIP, the following checks run without sending any USDC, changing wallet policies or printing secret keys:

```bash
npm run verify:setup
```

The report shows PASS, WAIT or FAIL for PostgreSQL, Claude, Arc RPC, agent signing account and vault. `WAIT` is expected for components you have not configured yet. To make one small billable Claude API call and verify that both the key and model work:

```bash
npm run verify:setup -- --claude
```

It does not submit a payment. A funded wallet and deployed vault are required before a real payment receipt is possible.

### Step-by-step commissioning sequence

1. Create an isolated Neon PostgreSQL database, copy its **direct** connection URL into `.env.local` as `DATABASE_URL`, and run `npm run db:init`.
2. Generate an independent `ADMIN_PASSWORD` and `SESSION_SECRET`; keep them private. Run the read-only checker.
3. Create an Anthropic API key under **Claude Console → Settings → API keys**, make sure API billing/credits are enabled, and set `ANTHROPIC_API_KEY` and your available `ANTHROPIC_MODEL`. Use `npm run verify:setup -- --claude` to test authentication.
4. Generate `owner`, `agent` and optionally `recipient` testnet-only wallets using `npm run wallet:new -- <role>`. Put `DEPLOYER_PRIVATE_KEY` (owner) and `AGENT_PRIVATE_KEY` (agent) only in local `.env.local`; use no mainnet keys.
5. Add the **Arc Testnet** network in your wallet: chain ID 5042002, RPC `https://rpc.testnet.arc.network`, native gas unit USDC with 18 decimals, explorer `https://testnet.arcscan.app`. Use Circle's Arc Testnet faucet and, if needed, Arc's console faucet to fund owner deployment gas and agent execution gas. Test ERC-20 USDC uses 6 decimals at `0x3600000000000000000000000000000000000000`; the native gas balance and ERC-20 transfer balance are separate accounting interfaces.
6. Set conservative local caps such as `AUTONOMOUS_LIMIT_USDC=1`, `SINGLE_LIMIT_USDC=2`, `DAILY_LIMIT_USDC=5`. Run `npm run vault:deploy` **only after the owner address has gas funding**. Inspect the genuine transaction URL and set the output address as `VAULT_ADDRESS` and `NEXT_PUBLIC_VAULT_ADDRESS`.
7. Allowlist only the test recipient with `npm run vault:configure -- allow 0xRECIPIENT_ADDRESS`. Fund the **deployed vault contract address** with a small amount of testnet ERC-20 USDC. Keep the agent wallet funded for gas. Verify using `npm run verify:setup` and `npm run vault:status`.
8. For a faucet-funded pilot, lower the database reserve from the default 1,800 USDC to a suitable amount (e.g. 3 USDC = 300 cents) through the Neon SQL editor: `UPDATE treasury_settings SET reserve_cents=300, horizon_days=14 WHERE id=1;`. This prevents a false reserve shortfall. Only do this for the small testnet pilot.
9. In Vercel Production environment variables, set `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ARC_RPC_URL`, `AGENT_PRIVATE_KEY`, `VAULT_ADDRESS`, `NEXT_PUBLIC_VAULT_ADDRESS`, and `CRON_SECRET`. **Never set `DEPLOYER_PRIVATE_KEY` on Vercel**. Redeploy after changing settings.
10. Create a real test business obligation in `/console` (e.g. 0.25 USDC to the allowlisted test recipient) and click **Run agent cycle**. Verify the actual transaction receipt on Arcscan and the decision entry inside Quorail. Do not treat the demo UI as onchain evidence.

Do not expose private keys, passwords, the Neon connection URL or your Anthropic API key in screenshots or support chats. Quorail v1 is a testnet pilot, not audited custody infrastructure for real assets.
