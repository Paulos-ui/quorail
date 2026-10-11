# Quorail V4.2 — White Canvas, Deep Atlantic

This release refines the Human Ledger rather than replacing working treasury infrastructure.

## Experience

- Pure white across the public story, dashboard and documentation.
- Deeper Atlantic blue (`#071E36` / `#0B3054`) used for meaningful structural emphasis.
- A financial route notation animates subtly behind the landing hero. Capital branches to obligations, time and reserve. Scroll changes path completeness, with reduced-motion support.
- Updated editorial hero copy, tighter information hierarchy and ledger navigation.
- Distinct deep-blue dashboard sidebar, visibly separate from the white operational workspace, with better active states and contrasting liquidity summary.
- Wallet-first owner access and public sandbox remain unchanged.
- Docs version updated, with explicit settlement evidence instructions.

## Backend: intentionally unchanged

No database migration. No new deployed vault. No new environment variables. No changes to Arc, Anthropic, Neon, authentication endpoints, financial calculations, execution, or contract policy.

## Pre-push validation

Run `npm install`, `npm run typecheck`, `npm test`, `npm run build` and confirm each passes before committing/pushing. Use Vercel deployment preview after the push. No real USDC payment is claimed in this release.
