# Quorail V4.1 — The Human Ledger

This release treats financial software as a legible, useful working document. It should not resemble a generated AI landing page, a Web3 orbital visualizer or a luxury-fintech brochure.

## Principles

1. **A white working surface:** the landing page, dashboard, wallet gate, and docs all share a white canvas. Structure is defined through rules, whitespace that serves a purpose, and exact financial labels.
2. **A single identity color:** deep Atlantic ink `#143957` is used for typography, decision states and primary actions. Secondary information uses muted slate `#5F7587` and hairline borders `#D7DFE6`. Muted oxide `#A45448` appears only for financial risk.
3. **No decorative diagrams:** the public hero uses a full-width financial ledger, not a contained orbit or particle scene. The operational dashboard uses the same row-and-balance mental model.
4. **Language before slogans:** copy begins with the user problem and explains actual capabilities without claiming an AI model controls custody. Illustrative money is identified as such.
5. **Interaction with consequence:** selecting an obligation and switching Pay All / Defer Selected changes the projected discretionary balance, never the actual vault. The decision sequence responds to scrolling and direct interaction.
6. **Accessible roles:** the vault owner signs in with a browser wallet and proves ownership through server verification. Visitors get an isolated sandbox. The public demo is never authorized to send funds.

## Surface tokens

| Token | Hex | Purpose |
|---|---|---|
| Base | `#FFFFFF` | Page, panel, document and wallet backgrounds |
| Deep Atlantic | `#143957` | Headings, controls, graph commitments |
| Ledger ink | `#152D45` | Default text |
| Secondary slate | `#5F7587` | Metadata and supporting labels |
| Rule | `#D7DFE6` | Table rows and architecture dividers |
| Faint surface | `#EEF1F4` | Deliberately selected rows, bar tracks |
| Muted oxide | `#A45448` | Financial shortfall, errors, never decoration |

## Type and content

DM Sans is used for body and display text; Space Mono appears only in operational labels, dates, and identifiers. Display italics are removed. Figures use tabular numerals where appropriate. Headings should sound like a helpful business operator, not an AI startup pitch.

## Page structure

The homepage opens with the thesis and a full-width capital ledger. Its row selections and defer controls form the actual hero demonstration. The following chapters explain the real pain point, reasoning stages, onchain guardrails, operator interface, and implementation. There is no decorative blank hero spacer or false live transaction claim.

## Engineering and safety boundary

This is a UI and interaction release. `lib/server/`, `lib/core/`, `contracts/`, API routes and DB schema are not modified. No vault redeploy or Neon migration is required. The V4.1 owner wallet remains verified against the deployed vault. A connected wallet alone is never trusted as a privileged session.

## Testing

Run `npm install && npm run typecheck && npm test && npm run build`. Test wallet owner access and visitor sandbox separately in the deployed environment. Also confirm the consequences widget on narrow screens and with reduced motion enabled.
