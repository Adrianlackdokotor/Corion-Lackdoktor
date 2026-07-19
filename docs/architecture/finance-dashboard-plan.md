# Finance Dashboard — Architecture Plan

Last updated: 2026-05-19
Status: Step 2 complete (shell live at /finanzen)

---

## Purpose

Replace the existing light-mode FinancialDashboard with a premium dark-mode
"Finance OS" overview layer. The dashboard is the entry point into the Corion
finance surface — high signal, low noise, instantly scannable.

It is NOT a replacement for the existing detail pages. It is a command center
on top of them.

---

## Dashboard URL and nav

| Route | Component | Purpose |
|---|---|---|
| `/finanzen` | `FinanceDashboard.tsx` | New dark-mode overview (canonical) |
| `/finanzen/detail` | `FinancialDashboard.tsx` | Legacy cashflow detail (preserved) |
| `/cfo-inbox` | `CFOInbox.tsx` | Supplier invoice approval (preserved) |
| `/contabil-ai` | `ContabilAI.tsx` | AI accounting assistant (preserved) |
| `/admin` (Finanzen tab) | `AdminDashboard.tsx` | Partner daily entries, fixed costs, break-even |

Admin nav "Finanzen" links to `/finanzen` (Finance OS). The detail level is
reachable from Finance OS via explicit drilldown links.

---

## Widget categories

### Tier 1 — Always visible (KPI row)
- Revenue (6-month rolling)
- Expenses (6-month rolling)
- Net profit (6-month rolling)
- Open orders count

### Tier 2 — Main grid (configurable show/hide)
- `cashflow` — Cashflow trend chart (monthly, 6-month window)
- `operations` — Operative signals (unpaid, unassigned, in-progress, overdue)
- `intelligence` — AI analysis panel (heuristic + Gemini advice)
- `agent` — Finance Agent conversation panel (Step 6)

### Tier 3 — Detail drilldown (linked, not embedded)
- Monthly transaction drill-down (`MonthDrilldownModal`)
- Partner-level cashflow breakdown
- Supplier invoice inbox
- Partner break-even calculator
- Material KPI per partner

---

## What belongs on the dashboard vs detail pages

### On the dashboard
- Aggregate KPI numbers (revenue, expenses, profit, order counts)
- Trend chart (direction, not raw data)
- Operational alerts (unpaid orders, missing partner, overdue)
- AI-generated anomaly/advice summaries (titles + severity, not full tables)
- Finance agent input area (query + single response)

### Moves to detail pages
- Daily financial entry tables
- Fixed cost management
- Partner break-even calculators (already in /admin Finanzen tab)
- Full transaction history (drilldown from cashflow chart)
- Supplier invoice management (CFO inbox)
- Partner payout ledger

---

## Widget system

Widget visibility is persisted in `localStorage` under key
`finance-dashboard-widgets`. Widget order persistence will use the same key
in a future step (Step 3 extension).

Widget registry is a typed constant `WIDGET_REGISTRY` in `FinanceDashboard.tsx`.
Each widget entry has: `id`, `label`, and `defaultVisible`.

To add a new widget: add to registry, add to render tree. No other wiring.

---

## Intelligence / proactive layer (Step 5)

The intelligence panel calls `/api/cfo/ai-advice` with the cashflow snapshot
as context. This returns a list of `AdviceItem` objects with severity levels:
`critical`, `warning`, `info`, `positive`.

Future expansion:
- Surface "needs attention" items computed from real order states (unpaid > 7d,
  overdue > 14d, partner payout gap)
- Feed these as structured context into the finance agent
- Each signal includes a `data` payload that the agent can reference

---

## Finance agent integration (Step 6)

The agent panel is a chat input wired to a finance-aware context.
The agent must be widget-aware — it should be able to answer:
- "What is our revenue this month?"  → reads from `snapshot.totals.incomeCents`
- "How many orders are unpaid?"      → reads from operative signals
- "Why did expenses go up?"          → uses AI advice from CFOAdvisor

Design constraint: the agent receives a `DashboardContext` object containing
the current snapshot, operative signals, and visible widget values. This
context is injected at query time so the agent is always grounded in visible
data.

Backend endpoint for agent: `/api/cfo/agent-query` (Step 6, not yet built).
The endpoint accepts `{ question, dashboardContext }` and returns a grounded
answer.

---

## Data sources

| Signal | Source | API |
|---|---|---|
| Revenue / expenses / profit | `dailyFinancialEntries` aggregated | `GET /api/cfo/cashflow?months=6` |
| Cashflow trend | same | same |
| Open orders | `workshopOrders` | `GET /api/admin/workshop-orders` |
| Unpaid (fertig+completed) | `workshopOrders.paymentStatus` | same |
| Operative signals | computed from workshop orders | same |
| AI advice | Gemini via cached heuristic | `POST /api/cfo/ai-advice` |
| Supplier invoices | `supplierInvoices` | `GET /api/invoices` |
| Material KPI | `workshopOrders.materialBdePercent` | `GET /api/admin/materials-kpi` |

---

## Step completion tracker

| Step | Status | Notes |
|---|---|---|
| 1 — Map existing surfaces | Done | This document |
| 2 — Dark-mode shell | Done | `/finanzen` live with KPIs + chart + signals + intelligence + agent placeholder |
| 3 — Widget system | Done (basic) | show/hide via registry + localStorage |
| 4 — Real data wiring | Done (primary) | cashflow API + orders API; materials KPI deferred |
| 5 — Intelligence panel | Partial | AI advice wired; structured signal model pending |
| 6 — Finance agent | Placeholder | Architecture defined; endpoint not built |
| 7 — Preserve + separate detail | Done | legacy routes kept; drilldown links added |
