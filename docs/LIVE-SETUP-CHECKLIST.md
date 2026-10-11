# Quorail · Connect Claude + Arc Testnet

Quorail's live application is a **single-business Arc Testnet pilot**, not an audited treasury for mainnet funds. Never paste keys, passwords, or Neon connection URLs into ChatGPT, screenshots, GitHub, or public issue reports.

## A. Apply the source ZIP to an existing WSL repository

Save `quorail-v1-live-ready.zip` onto your Windows Desktop. In WSL:

```bash
cd "/mnt/c/Users/MY PC/quorail" &&
unzip -oq "/mnt/c/Users/MY PC/Desktop/quorail-v1-live-ready.zip" -d . &&
npm install &&
npm run typecheck &&
npm test &&
npm run build &&
git add . &&
git commit -m "Fix vault ABI test and add integration diagnostics" &&
git push -u origin HEAD
```

The ZIP is flat; no new folder is created and `.git` remains untouched. The `&&` chain stops on error. For a local demo use `npm run dev` without any environment variables.

## B. Create the environment file locally

In the repo directory:

```bash
cp .env.example .env.local
notepad.exe .env.local
```

Fill in your own values. Do **not** paste this file into chat. A sample of the required *names*:

```dotenv
DATABASE_URL=postgresql://...DIRECT_CONNECTION_STRING_FROM_NEON...
ADMIN_PASSWORD=YOUR_UNIQUE_LONG_LOGIN_PASSWORD
SESSION_SECRET=YOUR_RANDOM_SESSION_SECRET
ANTHROPIC_API_KEY=YOUR_KEY_FROM_CLAUDE_CONSOLE
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
ARC_RPC_URL=https://rpc.testnet.arc.network
DEPLOYER_PRIVATE_KEY=0xOWNER_TESTNET_KEY_LOCAL_ONLY
AGENT_PRIVATE_KEY=0xAGENT_TESTNET_KEY
AUTONOMOUS_LIMIT_USDC=1
SINGLE_LIMIT_USDC=2
DAILY_LIMIT_USDC=5
VAULT_ADDRESS=
NEXT_PUBLIC_VAULT_ADDRESS=
CRON_SECRET=YOUR_DIFFERENT_RANDOM_SCHEDULER_SECRET
```

Generate separate secrets with `openssl rand -hex 32`. Keep **DEPLOYER_PRIVATE_KEY** local, never on Vercel. **ANTHROPIC_API_KEY** and **AGENT_PRIVATE_KEY** are backend-only Vercel secrets and must never use `NEXT_PUBLIC_`.

## C. Database: Neon

1. At https://console.neon.tech/ create a **separate** Quorail database/project. Select its direct PostgreSQL connection URL (not transaction-pooled for Quorail v1).
2. Put that URL into local `.env.local` under `DATABASE_URL`.
3. Run `npm run db:init`.
4. In the Neon SQL editor, lower the demo-pilot minimum cash reserve. For example, if the new vault will contain about 10 test USDC, use:

```sql
UPDATE treasury_settings SET reserve_cents = 300, horizon_days = 14 WHERE id = 1;
```

`reserve_cents=300` is a **3 USDC reserve**. The initial 1800 USDC reserve would prevent small faucet-funded payments. Choose a reserve appropriate to the test business.

## D. Claude API

1. Open https://console.anthropic.com/ and sign in. Under **Settings → API keys**, create a key for Quorail. Ensure the API account has billing/credits; a Claude subscription is not the same as API credits.
2. Paste the new key only into local `.env.local` as `ANTHROPIC_API_KEY`.
3. Use a model available to your API account. The project defaults to `claude-sonnet-4-5-20250929`; update `ANTHROPIC_MODEL` if your account provides another supported model.
4. Run `npm run verify:setup -- --claude`. This makes **one small, billable API call**, testing the key and chosen model without moving any USDC.

## E. Arc Testnet wallets and contract

**Arc Testnet network:** chain ID `5042002` (`0x4cef52`), RPC `https://rpc.testnet.arc.network`, explorer `https://testnet.arcscan.app`. The network's native transaction gas currency is USDC (18 decimals); the ERC-20 USDC transfer interface is at `0x3600000000000000000000000000000000000000` (6 decimals).

1. In the Quorail project terminal run:

```bash
npm run wallet:new -- owner
npm run wallet:new -- agent
npm run wallet:new -- recipient
```

2. Record the three **public addresses**. Add the owner private key to `DEPLOYER_PRIVATE_KEY` locally and the agent private key to `AGENT_PRIVATE_KEY` locally. Never use a main wallet private key. The recipient wallet may be an external real-business payee or a test wallet for a technical rehearsal.
3. Use the official [Circle testnet faucet](https://faucet.circle.com/) and, when necessary, the Arc Console faucet described in [the official Arc funding guide](https://docs.arc.network/app-kit/quickstarts/bridge-tokens-across-blockchains) to fund owner deployment gas and agent execution gas. A wallet must have the right native balance for gas; the vault later needs its own ERC-20 USDC funding.
4. Check the Arc chain and identities without spending anything:

```bash
npm run verify:setup
```

5. With a funded owner wallet and the caps set, deploy:

```bash
npm run vault:deploy
```

This **sends a real Arc Testnet deployment transaction** and uses test gas. If successful, the script prints the vault address and transaction link. Copy the vault address into `VAULT_ADDRESS` and `NEXT_PUBLIC_VAULT_ADDRESS` in `.env.local`.
6. Allowlist **only** your chosen test recipient:

```bash
npm run vault:configure -- allow 0xYOUR_RECIPIENT_WALLET_ADDRESS
```

7. Transfer a small amount of **testnet ERC-20 USDC** to the deployed `VAULT_ADDRESS`. The wallet that actually signs agent `pay()` also needs enough **native USDC for gas**. Do not send any mainnet assets to these addresses.
8. Check funding and policy read-only:

```bash
npm run verify:setup
npm run vault:status
```

## F. Configure Vercel Production

In Vercel → Quorail → **Settings → Environment Variables**, enter these values manually. Use your own secrets, not the placeholders above.

| Variable | Source | Secret? |
|---|---|---|
| DATABASE_URL | Neon direct connection URL | Yes |
| ADMIN_PASSWORD | Unique login password | Yes |
| SESSION_SECRET | `openssl rand -hex 32` | Yes |
| ANTHROPIC_API_KEY | Anthropic Console | Yes |
| ANTHROPIC_MODEL | API-supported model name | No |
| ARC_RPC_URL | `https://rpc.testnet.arc.network` | No |
| AGENT_PRIVATE_KEY | Dedicated testnet agent signer | **Yes** |
| VAULT_ADDRESS | Vault deployment output | No |
| NEXT_PUBLIC_VAULT_ADDRESS | Same contract address | Public by design |
| CRON_SECRET | Different random secret | Yes |

**Never put `DEPLOYER_PRIVATE_KEY`, `BRIDGE_PRIVATE_KEY` or wallet recovery phrases in Vercel**. Note `AUTONOMOUS_LIMIT_USDC`, `SINGLE_LIMIT_USDC`, `DAILY_LIMIT_USDC` are constructor inputs for local vault deployment; changing Vercel variables does **not** change deployed onchain limits. The owner must change policy onchain.

Redeploy Vercel after saving the variables. Check `/api/health` for `live-configured`; this indicates configuration flags are present, **not** proof of a functioning database, AI or funded vault.

## G. Verify a real test transaction

1. Sign in at `/console` using `ADMIN_PASSWORD`.
2. Add a genuine, small obligation for your allowlisted recipient (for example, 0.25 USDC). The recipient and amount must satisfy all onchain limits and the database reserve.
3. Click **Run agent cycle**. The model may choose `pay`, `hold` or `escalate`; do not force a payment to fabricate a result. Its reasons should match actual facts.
4. If the agent executes, copy the real transaction hash from Quorail's decision ledger. Open `https://testnet.arcscan.app/tx/YOUR_REAL_TX_HASH` and confirm the receipt, token transfer and recipient.
5. Record the decision, resulting real transaction hash, problem solved and any genuine user feedback for your hackathon submission. A demo decision with no hash is not a successful settlement.

**Safety:** Do not repeat an uncertain or timed-out payment. Reconcile its existing transaction hash first. The app has a testnet-only pilot security posture; get the vault independently audited and change server-side key custody before enabling valuable funds.
