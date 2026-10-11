# Quorail V4.3 — Signature Return / Tameion Proof

## Why restore this direction

This release deliberately returns to the earlier Quorail V2 visual language requested by the project owner. Dark aubergine canvas, warm metallic headings, kinetic branching obligation paths, editorial scroll-chapters, and the original animated consequence graph are restored from the archived V2 source. V4.2's contrasting deep Atlantic sidebar is retained for the operational dashboard. Visual interactions are illustrative and never presented as settlement receipts.

## Wallet entry (no extra page)

- Landing CTAs open a small **in-place wallet dialog**. EIP-6963 injected wallet discovery and browser-wallet fallback are supported.
- A chosen wallet connects through `eth_requestAccounts`; Quorail requests a one-time server challenge, and the wallet signs that text with `personal_sign`.
- The backend recovers the signer and requires it to match `owner()` of the deployed vault on Arc Testnet. Only then is a signed HttpOnly owner session issued.
- On success, the browser navigates directly to `/console`. The owner's **private key is never entered or uploaded**.
- Navigating directly to `/console` without signing shows a **sandbox dashboard** with explicitly illustrative figures. It makes no authenticated API calls for private data, and no sandbox operation pays USDC. The owner can sign in using the top-bar button without leaving this page.
- An unrelated wallet cannot read private data, alter the vault, or authorize agent payments. WalletConnect QR protocol is not part of this release: use an EIP-1193/EIP-6963 browser wallet.

## Settlement proof and Tameion

- Dedicated **Settlement proof** page inside the dashboard appears in navigation for all, but live records require the owner session.
- It lists only decision records marked `executed` with an actual valid transaction hash; amounts are derived from their registered obligations.
- Each link opens Arcscan; judges should validate the successful receipt, the token and event, the recipient and the amount. Displayed totals are Quorail database records, not a fresh independent blockchain audit.
- Testnet funds are not mainnet funds. The Tameion hackathon does **not** require connecting a Tameion API: submission remains an external form, with evidence from a legitimate business workflow.
- The existing vault spending contract, Cloud database, agent reasoning and execution code were left untouched. No new contract deployment, database schema or Vercel secrets are needed.

## Verification sequence

1. `npm run typecheck`, `npm test`, `npm run build`.
2. Deploy to Vercel and open the landing; check desktop/mobile and reduced-motion behavior.
3. Click Connect on landing with the vault-owner injected wallet. Sign the free challenge and confirm immediate `/console` access.
4. Open `/console` in a private browser session: it must show demo-only data and **Connect owner wallet**.
5. Check that unknown wallets cannot sign in to the private treasury.
6. Use local `npm run vault:status` to confirm the correct existing vault, agent and ERC-20 test USDC balance.
7. Authorize a genuine test recipient onchain, register an authentic small business obligation, run agent cycle once, and inspect PAY/HOLD/ESCALATE. A confirmed PAY should appear in Settlement proof and on Arcscan.
8. Do not retry an uncertain or timed-out broadcast until reconciled onchain. Do not count demo actions as traction.

Never post owner/agent private keys, Claude API keys or Neon connection strings.
