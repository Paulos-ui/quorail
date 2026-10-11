# Quorail V1 — TypeScript repair release

This release is a complete project ZIP for extracting at the root of the **existing** `paulos-ui/quorail` repository. It includes all prior source files and deployment documentation. No standalone hotfix is needed.

## Fixes

- **Decision persistence (`lib/server/db.ts`):** encode typed `Option[]` alternatives and financial snapshots with `JSON.stringify` and pass them as bound, explicitly `::jsonb` cast query parameters. Postgres.js's `JSONValue` type does not accept the `Option` interface as a generic JSON object.
- **Arc vault ABI (`lib/core/abi.ts`):** add missing `setPaused(bool)` function used by the owner-only pause/unpause commands. Include other missing implemented owner setters and `vaultBalance()` to keep contract operations synchronized.
- **Regression coverage (`tests/vault-abi.test.ts`):** tests to detect accidentally omitting Solidity's public/external functions or giving the pause and allowlist functions the wrong ABI argument types.
- **Operator guide (`docs/DEPLOYMENT.md`):** update the ZIP filename and exact Windows WSL extraction/push command.

## Verification and limitations

- The ZIP was validated for archive integrity, correct root layout, TypeScript/TSX **syntax** using the TypeScript compiler parser, and Solidity-source/ABI function-name parity.
- **Dependency-backed `npm run typecheck`, `npm test` and `npm run build` were not executable here**, because the npm registry was unreachable. Run them on the developer workstation; a successful build and deployment cannot be claimed until they succeed.
- This is an **Arc testnet-only** financial prototype; live payments require your own funded testnet vault, environment variables, database, and Anthropic API key. Do not use it for valuable funds or assume audited smart-contract security.

## Where to start

See [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) for the one-block WSL command. On error, send the first failure and its surrounding terminal lines rather than continuing to Git push.
