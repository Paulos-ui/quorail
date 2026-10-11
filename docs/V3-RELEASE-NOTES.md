# Quorail V3 — The Pelagic Ledger release

## Scope

V3 is an in-place frontend and documentation upgrade for the already deployed single-business Arc Testnet pilot. It does not need a new Solidity vault, Neon migration, Claude API key, owner wallet or agent key.

### Experience updates

1. Replaces saffron/gold-oriented V2 branding with porcelain, tidal slate, cobalt current and sea-glass surfaces.
2. Rebuilds the financial consequence SVG with selectable nodes and a PAY ALL / DEFER SELECTED hypothetical scenario switch, plus keyboard support.
3. Eliminates the mistaken display of sample obligations on a live treasury with no recorded pending obligations.
4. Reworks the initial scroll experience as a filled two-column editorial/instrument spread with a functional field visible immediately.
5. Reworks the decision chapters, proof diagram, landing product preview, docs and wallet gate into a unified light-first visual system.
6. Makes the wallet entry sequence explicit: connect → sign a one-time message → access if the wallet is the current vault owner.
7. Preserves the public isolated demo without exposing private business records.

### Operations kept untouched

- Arc Testnet RPC, token, vault address and Solidity policy logic.
- Claude decision tool, treasury arithmetic and payout executor.
- Neon PostgreSQL tables, wallet-signed login API, owner session and protected endpoints.
- Existing environment variable names and deployment commands.

### Deployment

Unzip `quorail-v3-upgrade.zip` at the root of the existing `paulos-ui/quorail` repo. Preserve `.git` and `.env.local`. Run `npm install`, `npm run typecheck`, `npm test`, `npm run build` before committing and pushing. Vercel should rebuild from GitHub. No new environment variables are required beyond the existing V2 live config; `ADMIN_PASSWORD` remains retired.

### Practical acceptance checklist

- Public `/` shows the light-first hero and usable map without a giant empty region.
- Both simulation buttons alter the projected discretionary buffer and never broadcast USDC.
- `/console` shows a wallet entry screen on the live configured deployment, with an isolated visitor sandbox.
- Non-owner wallet signing is rejected; vault-owner signing enters the live treasury.
- A live treasury without pending obligations shows an empty field, not fabricated nodes.
- Existing obligation creation, agent decision history, owner-recipient configuration and verified Arc settlement work as they did in V2.
- `/docs` renders with scroll progress, legible code examples and complete technical limitations.

### Validation

Source syntax and CSS parsing are checked in the release environment; the full Next.js dependency-backed typecheck and build must be run in the user's local repository or Vercel. Do not claim contract security was audited or that test payments succeeded without an Arc receipt.
