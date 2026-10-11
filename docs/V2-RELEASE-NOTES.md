# Quorail V2 — Frontend + Authority Upgrade

## A / Wallet-first
- Removed the password sign-in screen. `/api/auth/login` intentionally returns HTTP 410.
- Added server-generated five-minute EIP-191 challenges, signed message verification, onchain vault `owner()` checks, signed HttpOnly sessions and same-origin mutation protection.
- Added support for detected injected EVM wallets (EIP-6963), with an injectable fallback; WalletConnect deep-link support is not included.
- Visitor sandbox remains accessible without privileged live business data.

## B / Bespoke visual identity
- New `Treasury Cartography / Living Ledger` aesthetic with deeply bespoke saffron, aubergine, parchment, saltwater and vermilion surfaces.
- Complete first-screen hero visualization with an interactive consequence field; avoids V1's disproportionate blank sticky area.
- Rebuilt editorial story, proof pipeline, product preview and call to action.

## C / Meaningful motion
- Scroll-informed chapter state, graph paths, orbital reserve motion, selected payment node and controlled scenario interactions.
- Reduced-motion and smaller-screen paths provide an accessible reading layout.

## D / Operating console and docs
- Added What-if simulator, Vault & access, and Activity to the existing Overview / Obligations / Decision Ledger / Policy & Trust.
- Added owner-signed recipient allow/revoke from the application, without giving the AI owner permissions.
- Added documentation scroll progress and re-themed technical pages.

## Preserved deliberately
- `contracts/QuorailVault.sol` — unchanged; existing deployed address and policies continue to work.
- `scripts/schema.sql` — unchanged; no mandatory Neon migration.
- `lib/server/agent.ts`, `execute.ts`, `arc.ts` — existing payment pipeline and transaction reconciliation preserved.
- Existing Vercel values for `DATABASE_URL`, `SESSION_SECRET`, `AGENT_PRIVATE_KEY`, `ANTHROPIC_API_KEY`, `VAULT_ADDRESS` remain valid. Delete optional obsolete `ADMIN_PASSWORD` after deploying.

## Gate before production

`npm install && npm run typecheck && npm test && npm run build`. Resolve any check failure before pushing or enabling autonomous payments. Run the wallet sign-in test with the actual *vault owner*, and reject another address. Execute only low-value Arc Testnet payments. Never reuse owner key as agent key.
