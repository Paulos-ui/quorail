# Quorail V4.4 — OKX Wallet and onchain ownership

Quorail does **not** let every connected EVM wallet administer the treasury. The onchain owner of the existing deployed QuorailVault is the only account that can sign into the private business workspace.

## Direct wallet flow

1. On the landing page, select **Connect your treasury**.
2. Choose **OKX Wallet**, **MetaMask**, **Rabby**, or another injected EVM wallet. Quorail discovers providers through EIP-6963 and OKX's dedicated browser injection as a fallback.
3. Select the EVM account that deployed/owns the vault. The connection modal displays the **public onchain owner address** from Arc and checks for an exact match.
4. Confirm a switch to **Arc Testnet (5042002)** when your wallet asks. If the network is not installed, approve the request to add it.
5. Sign the free message. This is *not* a transfer approval. The signed challenge is checked server-side again against the owner of the deployed vault.
6. Successful authentication takes you **directly to `/console`**. No additional login page.

### When you see “wallet is not the onchain vault owner”

The selected OKX/MetaMask account differs from `owner()` in the deployed vault. **This is a correct security refusal**, not a reason to disable the owner check. Read the public owner address in the connection dialog or visit `/api/auth/owner` (a public read-only diagnostic). Change to that exact owner account in the wallet extension. Do not use the `AGENT_PRIVATE_KEY` for owner sign-in; the agent address is a different wallet with limited payment permission.

If the owner was created through the terminal and has never been imported into any browser wallet, use the wallet extension's own secure account import flow *only for a dedicated testnet key*. Never paste your private key into Quorail, a web form, GitHub, Vercel logs, or a message. Importing an account into a browser wallet changes its security exposure; ideally use a hardware owner wallet for anything beyond a testnet pilot.

### When OKX Wallet is missing

Use the **Get OKX Wallet** link in the dialog and activate its browser extension, then refresh the wallet list. Mobile users can open Quorail through OKX's in-app DApp browser. This release supports injected providers and EIP-6963; **it does not implement WalletConnect QR-code pairing**.

### Refreshed console / policy changes

Owner-authorized contract actions (recipient allowlist changes and approvals) now rediscover a provider holding the onchain owner's account instead of blindly using `window.ethereum`. The wallet must switch to Arc Testnet before signing. If the browser has no connected owner account, reconnect with the **Select owner wallet** button in the console.

## Environment and contract safety

No new environment variables or Solidity deployment are needed. Existing `VAULT_ADDRESS`, `NEXT_PUBLIC_VAULT_ADDRESS`, `ARC_RPC_URL`, `SESSION_SECRET`, `AGENT_PRIVATE_KEY`, Claude and Neon settings remain unchanged. Keep `DEPLOYER_PRIVATE_KEY` local. The `GET /api/auth/owner` route publishes only the vault and its onchain owner address, both already visible on the Arc block explorer. It never returns credentials.

For Tameion testing, first verify wallet sign-in. Then separately authorize the recipient and run a small testnet transaction, checking the receipt on Arcscan. Wallet sign-in success is **not** evidence of successful autonomous settlement.
