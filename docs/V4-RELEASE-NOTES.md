# Quorail V4.1 — Human Ledger release

This build changes the presentation without replacing the live financial engine.

## Landing
- Replaces the two-column oversized headline and boxed orbit with a compact editorial introduction and full-width capital ledger.
- Financial commitments are interactive. Selecting a row and switching between paying and deferring shows the projected effect on discretionary capital.
- No simulated payment is described as a real transaction.
- Scroll-linked decision walkthrough remains available, but the stages look like annotations in a working financial record rather than animated marketing cards.

## Control room
- Replaces the orbital consequence visualization with a row-based financial comparison.
- White surfaces, ink-blue hierarchy, sharp table rules, readable statuses, and more disciplined spacing.
- Retains the same backend requests, agent execution logic, Arc explorer links, onchain permissions, and demo/live isolation.

## Wallet access
- No decorative orbital gate. The wallet entry explains connect, sign, and enter.
- Does not ask for a private key. Server-side signed owner verification is unchanged.
- Non-owner visitors have the sample treasury, never the business ledger.

## Documentation
- Same white reading canvas, minimal rules, no colored hero blocks.
- New `docs/V4-DESIGN-SYSTEM.md` documents the visual decisions and constraints.

## Deploy
- Extract at the existing repository root. This source ZIP contains no `.git`, `.env`, `.env.local`, `.next` or `node_modules`.
- No contract redeployment, SQL migration, or environment-variable changes are required solely for V4.1.
- Run `npm install`, `npm run typecheck`, `npm test`, `npm run build` locally. Push only when checks succeed.
- After Vercel deploys, manually test owner-wallet login, read-only sandbox, and financial decision flow before attempting live testnet payments.

## Validation status
- TypeScript/TSX syntax and CSS PostCSS parsing checked.
- Eight core finance and ABI tests run through a dependency-free transpilation harness, all passed.
- Full npm installation and production build were unavailable in the packaging environment; the user must run the standard scripts on their machine.
