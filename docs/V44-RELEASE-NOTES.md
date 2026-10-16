# Quorail V4.4 — OKX Wallet + Owner Access Fix

Quorail V4.4 improves the wallet connector and owner-verification diagnostics without modifying the deployed Arc vault, financial engine, Neon database, Claude configuration, or chosen cinematic theme.

## Changes

- **OKX Wallet** appears when its injected EVM provider is available, whether through EIP-6963, `window.okxwallet`, or multiple providers under `window.ethereum.providers`.
- **Vault owner visibility:** a new read-only `/api/auth/owner` endpoint returns the **public** onchain owner and vault addresses on Arc Testnet. This helps explain why the connected account may not be authorized.
- **Safe refusal:** attempting owner access from an agent or third-party wallet shows both the selected account and the expected owner in the wallet dialog. The site never lets a different wallet bypass authentication.
- **Automatic network request:** Quorail asks OKX (or another wallet) to switch to Arc Testnet (5042002) and only offers to add the network if missing. Cancelled network switches receive clear feedback.
- **No extra login screen:** Connect → Sign → Dashboard remains in the landing-page overlay.
- **Owner actions after refresh:** recipient allowlist and payment-approval operations rediscover the provider with the verified owner account instead of blindly using the default `window.ethereum`.
- **Read-only diagnostics:** `npm run wallet:check-owner` prints public vault, onchain owner, agent, and (if configured) locally derived public deployer addresses. No private keys and no payments.
- **4 regression tests** for OKX wallet discovery and duplicate provider selection.

## Deployment

Unzip into the **existing** `quorail` repository, then run the typecheck, tests, and production build before committing or deploying. No new environment variables or Solidity migrations are needed. Your Vercel config continues to use the existing `VAULT_ADDRESS`, `NEXT_PUBLIC_VAULT_ADDRESS`, `ARC_RPC_URL`, `SESSION_SECRET`, Neon variables, `ANTHROPIC_API_KEY`, and `AGENT_PRIVATE_KEY`. The owner private key stays local.

## Test steps

1. Run `npm run wallet:check-owner` locally to read the owner address recorded onchain. It must match the EVM address selected in OKX or another wallet.
2. After Vercel deployment, visit `/api/auth/owner`. It should show the same public owner address, vault, and Arc Testnet chain ID. Do not share any private keys.
3. On Quorail's landing page, click **Connect wallet**. If OKX extension is installed and enabled, select **OKX Wallet**. On mobile, open the site through OKX Wallet's DApp browser. If no provider appears, try **Refresh wallets**.
4. If OKX has the correct owner account, accept the Arc Testnet switch and sign the free challenge message. Quorail should navigate to `/console` with live data.
5. Try a **different test wallet account**; it must refuse live owner access and offer the sandbox.
6. In the live dashboard, verify recipient allowlisting uses the selected owner wallet, not an unrelated browser extension. Such a call is an onchain owner transaction, so it costs testnet gas. Do not create new recipients or execute payments unless intended.

## Important limits

This is an **injected-browser-wallet** connector; it does not provide WalletConnect QR-code pairing. `owner()` of the deployed vault stays authoritative and cannot be replaced by an environment variable or by connecting OKX. The current app remains a single-owner treasury pilot, not a multi-business wallet account system.

If the sign-in dialog says the connected account is not owner, switch accounts **inside the wallet extension**. A wallet selected as Quorail's server-side agent is not the onchain owner. If the deployed owner's key exists only locally, import it into a wallet **through that wallet's own secure interface**, only if it is a dedicated testnet key and you understand the security implications. Never enter a private key on Quorail's website.
