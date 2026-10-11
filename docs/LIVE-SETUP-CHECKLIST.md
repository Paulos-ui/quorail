# Quorail V3 — Live Testnet Checklist

The newest step-by-step live instructions are in [DEPLOYMENT.md](DEPLOYMENT.md). This is a short status checklist for the Arc Testnet pilot.

- [ ] `npm run typecheck`, `npm test` and `npm run build` all pass locally.
- [ ] Vercel public site and `/docs` load without oversized blank sections.
- [ ] Vercel Neon is connected; `scripts/schema.sql` has run; direct `DATABASE_URL_UNPOOLED` is preferred.
- [ ] `SESSION_SECRET` and the deployed `VAULT_ADDRESS` are saved in Vercel Production.
- [ ] `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` are configured.
- [ ] `ARC_RPC_URL` uses Arc Testnet (chain `5042002`).
- [ ] The *separate* testnet agent key is in Vercel, not the owner key.
- [ ] The owner wallet signs a non-transaction login message successfully at `/console`.
- [ ] An unrelated wallet cannot access private treasury state.
- [ ] Public visitors can explore local-only sandbox simulations without wallet or financial data access.
- [ ] The owner wallet authorizes a test recipient and sees its Arc receipt.
- [ ] The vault holds ERC-20 test USDC; the agent holds native Arc test gas.
- [ ] The ledger records an actual AI assessment (pay / hold / escalate).
- [ ] A permitted payment has a confirmed Arc hash and corresponding vault event.
- [ ] Reconciliation and liquidity-reserve behavior have been checked.
- [ ] `CRON_SECRET` remains unset until manual testing is complete.

Do not publish or screenshot API keys, private keys, direct Neon database URLs, or session secrets. **No production/mainnet funds.**
