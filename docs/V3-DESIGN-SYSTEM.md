# Quorail V3 — Pelagic Ledger

**Design thesis:** Financial decisions are currents. Money moves through a field of responsibilities, deadlines, reserve protection and owner authority. Every visible movement should explain an economic relationship.

## Identity: porcelain, tidal ink, sea-glass and cobalt

This is neither a dark crypto terminal nor luxury-gold finance branding. The working metaphor is a scientific ocean-current atlas: exceptionally legible surfaces, topographic contours, measurement grids and clear risk signals.

| Design token | Color | Meaning |
| --- | --- | --- |
| Porcelain | `#f6f8f6` | Page backgrounds and reading space |
| Ink | `#143246` | Financial labels and typography |
| Tidal slate | `#173e56` | Trust, persistent navigation and serious controls |
| Cobalt current | `#365bc5` | Active selection, wallet actions and focus |
| Sea-glass | `#d1eae5` | Protected liquidity and supporting surfaces |
| Mineral frost | `#e3f2f0` | Instrument and diagram surfaces |
| Signal coral | `#b64d66` | Financial pressure, warnings and errors only |

The high-contrast, light-first experience is intentional. The palette is carried across the landing, `/console`, wallet entry and documentation using `app/v3.css` layered over the existing stylesheet. `app/v2.css` remains as the stable responsive layout foundation; V3 overrides its visual identity and key compositions.

## The capital instrument

`components/ConsequenceField.tsx` renders a responsive SVG model of the treasury as a network of obligations. Users can select nodes with a mouse, keyboard Enter or Space, then toggle PAY ALL versus DEFER SELECTED to compare hypothetical liquidity within the displayed planning horizon. The adjustment never edits obligations, executes an agent, or changes onchain funds.

When live data contains no recorded pending obligations, the instrument shows no fabricated obligations. The public homepage uses explicitly illustrative financial values. This distinction is essential to credibility with businesses and hackathon reviewers.

The field is not a decorative 3D object: node selection and scenario changes communicate actual financial arithmetic. The graphics include a grid, coordinate rails, reserve rings, routing curves and an inspector instead of arbitrary particles.

## Narrative motion

- **Hero:** a small scroll-coupled physical drift using Framer Motion spring values, without forcing interaction beneath the fold.
- **Decision engine:** a sticky, scroll-progress-driven staged explanation (Observe → Compare → Decide → Prove) that can also be controlled directly.
- **Field:** connection paths write in once, selection rotates a measured contour, and financial amounts update immediately on scenario selection.
- **Reader:** docs show a progress indicator; motion-sensitive users receive static alternatives.

The site uses Lenis for smooth scroll except when reduced-motion preferences are active.

## Wallet experience

`/console` is wallet-first when a server-side live treasury is configured. Browsers advertising EIP-6963 providers can present a selection; an injected EVM provider remains a fallback. The user signs a short-lived, domain-bound message; the API recovers the signer and checks the Arc vault's current `owner()` before issuing an HttpOnly owner session. Signing this message is not a blockchain transaction.

A visitor without owner access can enter an explicitly isolated, browser-only illustrative environment. The agent private key is never sent to the client. Live spending limits still reside in `QuorailVault.sol`; signed access alone cannot relax them.

This version does not implement WalletConnect QR pairing, role-separated multi-business accounts, or automatic wallet-network switching on initial login. Owners switch to Arc Testnet when signing onchain vault policy changes.

## Operational surfaces

Overview, Obligations, Decision Ledger, What If, Policy, Vault & Access, and Activity share the same typography, token palette, status semantics and edge treatments. `ConsequenceField` works in both homepage and console without duplicate mock UI.

## Accessibility and performance

- Meaningful labels on interactive field nodes and wallet controls.
- Reduced-motion preference disables nonessential transitions.
- Layout collapses to single-column on narrow viewports without introducing extra page-length spacers.
- SVG diagrams avoid an additional heavy 3D runtime or unbounded particle loop.
- UI clearly distinguishes illustrative, configured and verified onchain states.

## Authorship

Designed and developed by Jayking · GitHub `paulos-ui` · X `@__official__1`.
