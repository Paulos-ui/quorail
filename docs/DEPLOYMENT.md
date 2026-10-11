# Quorail V3 — Operations & Deployment

Quorail is a single-business Arc Testnet pilot. **Never use an everyday wallet private key or real mainnet funds.** A working deployed app does not establish an audited or secure mainnet treasury.

## Product & authentication

The visitor entry at `/console` shows available EVM browser wallets (EIP-6963 discovery and an injected-wallet fallback). Clicking a wallet requests accounts and a time-limited, server-generated challenge. The wallet signs a **message**, not a payment. The backend verifies the EIP-191 signature using `viem`, compares the address to `owner()` on the configured QuorailVault, and issues a short-lived signed, HttpOnly cookie. Owner access is rechecked against the onchain vault for protected API calls. Connecting a non-owner wallet **does not** authorize financial operations; those users may choose an isolated sandbox with example balances.

**No `ADMIN_PASSWORD` is required.** The old `/api/auth/login` password endpoint intentionally returns HTTP 410. A previous Vercel `ADMIN_PASSWORD` variable can be removed after upgrading. The owner keeps their deployment key out of Vercel; owner policy changes and larger approvals are signed in the browser wallet and verified by the contract.

## 1. Source and local checks

Prerequisite: Node 22+, npm and WSL/Git Bash. From your current repository:

```bash
cd "/mnt/c/Users/MY PC/quorail"
npm install
npm run typecheck
npm test
npm run build
```

A complete build requires an npm-registry connection; don't push if a check fails. No secrets or private keys belong in your git repository.

## 2. Public demo on Vercel

Import `paulos-ui/quorail` as a Next.js project. You can deploy without any environment variables to show the marketing website and illustrative sandbox. The public explorer **never performs a real USDC transfer**.

## 3. Neon via Vercel

Vercel → Quorail → Storage / Marketplace → Neon → Connect to Production. Copy `scripts/schema.sql` into Neon SQL Editor and execute once. Check the table `treasury_settings` was initialized. For a small testnet pilot you can change the reserve after evaluating your test balance:

```sql
UPDATE treasury_settings SET reserve_cents=300, horizon_days=14 WHERE id=1;
```

Neon may add `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct). **Quorail prefers `DATABASE_URL_UNPOOLED`**, falling back to `DATABASE_URL`. If the direct URL isn't provided, get it from the Neon connection details. Its agent cycle uses PostgreSQL session-level advisory locks, so a transaction-pooler is not appropriate for production agent runs. Direct database sessions may be constrained on serverless infrastructure; use low traffic for the pilot.

## 4. Arc testnet vault

Arc Testnet chain ID: `5042002` (hex `0x4cef52`). RPC `https://rpc.testnet.arc.network`. Explorer `https://testnet.arcscan.app`. Arc ERC-20 USDC token: `0x3600000000000000000000000000000000000000`.

Keep **two separate testnet keypairs**:

- `DEPLOYER_PRIVATE_KEY` — vault owner. LOCAL MACHINE ONLY. Must control the imported browser wallet for owner sign-in and policy actions.
- `AGENT_PRIVATE_KEY` — a dedicated low-value testnet wallet. Vercel secret for authorized `pay` transactions only. Does not grant contract owner powers.

The owner pays deployment/configuration gas. The agent needs native test USDC for gas. The deployed vault must hold ERC-20 test USDC. Arc gas funds and ERC-20 token funds are distinct assets. Fund from official supported testnet sources; don't fund mainnet accidentally.

Locally copy `.env.example` to `.env.local`. Configure `ARC_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `AGENT_PRIVATE_KEY`, and contract deployment policy limits. **If you have already deployed, do not deploy a second vault.** Record that first `VAULT_ADDRESS` under both `VAULT_ADDRESS` and `NEXT_PUBLIC_VAULT_ADDRESS`.

```bash
npm run vault:status
```

If no vault has been deployed, after funding the owner wallet:

```bash
npm run vault:deploy
```

Never paste private keys in support chats. Import the owner address into your browser wallet using a safe local wallet mechanism. Prefer a completely new test-only wallet rather than importing a main wallet key.

## 5. Vercel production environment variables

| Name | Treatment | Required |
| --- | --- | --- |
| `DATABASE_URL` | Neon auto-provisioned secret; direct preferred | Yes for live |
| `DATABASE_URL_UNPOOLED` | Neon direct URL, if available | Highly recommended |
| `SESSION_SECRET` | Private 32+ random bytes (`openssl rand -hex 32`) | Yes for live |
| `VAULT_ADDRESS` | Public deployed contract address | Yes for live |
| `NEXT_PUBLIC_VAULT_ADDRESS` | Same public vault address | For client explorer links |
| `ANTHROPIC_API_KEY` | Anthropic API secret | For Claude decisions |
| `ANTHROPIC_MODEL` | Supported model ID | For Claude decisions |
| `ARC_RPC_URL` | `https://rpc.testnet.arc.network` | For live reads and payment |
| `AGENT_PRIVATE_KEY` | Separate agent-only testnet private key, **secret** | For payment |
| `CRON_SECRET` | Separate secret; **leave unset until manual tests pass** | Optional scheduler |

**Never** put `DEPLOYER_PRIVATE_KEY` or `BRIDGE_PRIVATE_KEY` in Vercel. `ADMIN_PASSWORD` is no longer used. After changing variables, redeploy Production.

`/api/health` shows `demo` or `live-configured`, but **does not prove payment readiness**. Protected endpoints return 401 to unauthenticated clients.

## 6. Owner sign-in

Open `/console` after the live environment has redeployed. In a browser with MetaMask, Rabby, Coinbase Wallet or another detected injected EVM wallet, click the wallet you want to use. Select the wallet which owns the **deployed vault** and approve the authentication *signature*. No gas is charged for signing. If the wallet does not match `owner()` on the vault, private access is denied; use the visitor sandbox instead. Only owner-signed operations can manage the vault allowlist. A wallet connection alone is not authorization.

## 7. Real USDC test transaction

1. Fund the vault with a small ERC-20 USDC test balance (for example 5 USDC), and the agent with native testnet gas.
2. In `/console` → **Vault & access**, sign an **Allow recipient** operation with the owner wallet. Wait for the Arc receipt.
3. In **Obligations**, enter a genuine purpose, amount (for example 0.25 USDC), due date and that recipient.
4. In **Decision ledger**, run a real agent cycle. A Claude `hold` or `escalate` is a valid decision; do not force payment contrary to reserve constraints.
5. If a permitted payment executes, inspect the **actual** hash, vault event and ERC-20 transfer on Arcscan. The record must match the corresponding decision and invoice.
6. Capture the receipt and genuine business usage for hackathon evidence. Testnet USDC and demo illustrations must never be confused.

If the RPC times out after broadcast, don't immediately retry. Use the reconcile mechanism only after inspecting a matching confirmed event.

## 8. Security limits

The agent itself is a server-side EVM signer controlled by a testnet-only key and cannot change the contract's owner policy. Owner approval signs exact payment IDs. Wallet EIP-191 login proves control of the onchain owner address; it is **not a smart-account integration nor a replacement for contract limits**. Session challenges are bound to the site host and expire after five minutes. Mutation APIs enforce same-origin checks and signed sessions. This pilot is not a comprehensive compliance, fraud-detection, invoice-verification or audited custody solution.

## 9. Circle integration scope

Arc ERC-20 USDC movement is integrated through the viem payment adapter and a custom Solidity vault. A separate optional Circle App Kit bridge script exists in `scripts/bridge-to-arc.ts`, but **the core signer is not Circle-hosted Wallets**. Do not claim otherwise. See `docs/ARC-OSS-SUBMISSION.md` for reusable pieces and current limitations.
