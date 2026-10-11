# Quorail V2 · Treasury Cartography / The Living Ledger

## Creative strategy

The product makes otherwise invisible consequences inspectable. A distinct **aubergine ink + saffron + parchment** palette was selected to avoid the default green-fintech and neon crypto motifs. The interface behaves like a financial instrument. All visual motion communicates a relationship between capital, commitments, decisions and proof.

| Token | Hex | Purpose |
| --- | --- | --- |
| Deep Ledger | `#272332` | main storytelling backdrop, owner-side high-trust surfaces |
| Fumed Ink | `#1d1a27` | depth and structural contrast |
| Smoked Parchment | `#f1e9d9` | readable editorial surface |
| Saffron Circuit | `#e8b67d` | signal / highlighted capital paths / selected payment |
| Saltwater | `#a7d2c6` | reserve and protected capacity |
| Burnt Vermilion | `#cc715b` | liquidity risk and intervention |
| Lavender Graphite | `#494353` | hierarchy and low-salience financial connections |

Typographic logic: `DM Sans` for operational legibility, `Newsreader` for thesis and explanatory moments, `Space Mono` for system labels and trace metadata.

## Signature interactions

1. **The opening consequence field:** live SVG graph of a central capital supply, obligation satellites and selectable relation paths. Each obligation changes the active forecast inspector. Data is illustrative and labelled.
2. **Scroll-driven decision stages:** four-stage sticky instrument with selectable steps and discrete progress states, but without the huge empty first viewport in V1. Native reduced-motion fallback restores a normal continuous reading experience.
3. **Counterfactual control:** the app's `What if?` view adjusts proposed spending and hypothetical incoming capital. It shows discretionary capital after registered commitments and reserve. There is no transaction button here, and simulated revenue is not counted as real treasury balance.
4. **Proof-led activity:** decision list retains actual transaction hashes and the Activity view presents the audit trail, rather than fake blockchain activity.
5. **Wallet-first authority:** EIP-6963 injected wallet discovery, signed message challenge, vault owner verification, HttpOnly cookie, optional visitor sandbox. Permission changes still require onchain owner signature.
6. **Docs reading progress:** persistent, slim scroll progress line and sticky index. The page has the same editorial tokens as the marketing site.

## Layout

Desktop: full narrative split hero; financial instrument fills the right half of the first screen. Mobile: thesis above the entire consequence graph; no off-screen hidden content needed for understanding. The dashboard maintains dense but readable operating controls and adaptive viewport grids. All data views distinguish live from illustrative values.

## Accessibility / performance

SVG nodes support keyboard activation. Focus states, descriptive graph role/labels, and `prefers-reduced-motion` are included. No expensive WebGL or three-dimensional rendering is needed; animated paths, transform-only scroll response and self-contained SVG capture the physical idea with less GPU load. Never couple an animation's state to an onchain payment decision or its security validation.

## Security boundaries / honest positioning

A connected wallet alone does not grant owner access. The server verifies a fresh signature against the vault's current `owner()` on Arc; reads and mutations are revalidated. Testnet agent execution and vault policy are distinct. The native agent uses viem and an EVM test signer, not Circle-hosted Wallets; Circle App Kit bridging remains optional. All monetary figures in the publicly accessible simulator are sample data. This is an unaudited single-business testnet pilot.
