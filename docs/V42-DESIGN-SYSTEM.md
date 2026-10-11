# Quorail 4.2 — Deep Atlantic ledger

## The editorial premise

Quorail should look like a financial working surface that belongs to a business, not an illustration of artificial intelligence. One white canvas hosts the landing experience, live dashboard and technical documentation. The deep-blue column at the left marks the private operating area; the rest stays naturally lit.

### Core color tokens

| Role | Token | Value |
| --- | --- | --- |
| Pure working white | `--paper` | `#FFFFFF` |
| Near-black Atlantic ink | `--q42-deep` | `#071E36` |
| Primary structural blue | `--q42-blue` | `#0B3054` |
| Secondary operational blue | `--q42-middle` | `#214D70` |
| Very light rules | `--q42-rule` | `#D6E2EA` |
| Quiet annotations | `--q42-muted` | `#5B7285` |

Muted risk indicators remain deliberately reserved for negative balances and failed states, with labels as well as color.

### Animated background: financial paths, not payments

`components/FinancialCurrent.tsx` uses a lightly printed SVG route from **capital** to **obligations**, **time**, and **reserve**. Framer Motion ties route completeness to the hero's scroll position. CSS moves a dashed line slowly along the financial routes and applies a restrained heartbeat to the nodes. This is a *conceptual guide*, not a live balance chart or settlement animation. It is noninteractive, `aria-hidden`, and does not capture pointer events.

The live interactive feature remains the `CapitalSheet`, where a reader chooses an obligation and adjusts the scenario with immediate changes to projected discretionary liquidity. This is explicitly illustrative and cannot send payments.

### Product UI decisions

- Deep-blue sidebar, white working area and white top bar; no gradient or gold.
- Active navigation is legible and high contrast on the dark sidebar.
- Data stays in editorial rows and ledgers rather than floating dashboards.
- One dark liquidity panel anchors operational metrics; the rest of the dashboard is luminous and uncluttered.
- Typed financial amounts and onchain evidence retain explicit **testnet**, **live** and **illustrative** labels.
- Primary access is owner-wallet signature verification; no password gate or request for private keys in the browser.

### Motion rules

Motion follows the financial metaphor and never suggests fake onchain activity. Continuous animations stop when `prefers-reduced-motion: reduce` is active. The underlying capital ledger and decision process remain useful without movement. Mobile rendering reduces background intensity and keeps the content legible.

### Preserved integrations

No changes to database schema, Anthropic agent, Arc contract, payment executor, authentication APIs, or live wallet credentials. This visual release does not assert an onchain payment has been executed.
