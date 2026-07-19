# CORI Agent Library

## Purpose

CORI is the in-app local navigation and operations guide inside Corion.
It should not feel like a rigid canned bot. It should feel like a smart local copilot that:

- understands the app structure
- knows the major pages, routes, roles, and workflows
- helps users navigate faster
- can answer questions grounded in the actual Corion app structure
- delegates work that belongs outside the app or outside the current local knowledge boundary

This file is the first durable shared library for CORI and future in-app agents.

## Agent boundary

### CORI should handle directly
- app navigation
- explaining where things live
- role-aware orientation inside Corion
- known workflow surfaces already present in the UI
- helping the user choose the right module/page
- understanding whether a request belongs to admin, partner, client, tasks, agents, scheduling, CRM, files, or finance context

### CORI should not pretend to own
- external web research
- arbitrary email/WhatsApp/Telegram sending
- Claude development work itself
- work that needs a separate worker agent or task bus
- claims about data it cannot actually read yet

## Current known routes and surfaces

### CORION OS (central command surface)
- `/workshop`
  - CORION OS shell — AI-first central admin cockpit
  - Dark zinc-950 header with live stat chips (active orders, today, awaiting pickup, unpaid, tasks)
  - Inline CORI chat panel grounded in `/api/cori/snapshot` live data
  - Action dispatch tiles (6 workflow stages: neue_anfragen, angebot, termin, annahme, rueckgabe, rechnung)
  - Terminübersicht tab (order list grouped by day)
  - Monat tab (mini month calendar)
  - Aufgaben tab (task count + link to Task Board)
  - CORI snapshot endpoint: `GET /api/cori/snapshot`
  - CORI chat endpoint: `POST /api/cori/chat`

### Core admin
- `/admin`
  - Main Auftrag dashboard
  - pipeline
  - active workshop orders
  - search/filter/order board
- `/admin/calendar`
  - planning surface
  - appointments
  - scheduling workflow
- `/tasks`
  - task board / backlog / follow-up work
- `/admin/agent-tasks`
  - agent delegation and review
- `/admin/agents`
  - BikuBook Phase 1 / agent activity feed
- `/admin/cfo-inbox`
  - CFO-related inbox surface

### Partner / external role surfaces
- `/partner/dashboard`
  - partner dashboard shell
- `/partner/workshop-orders`
  - partner order list
- `/partner-portal`
  - partner portal variants / upload center flows

### Other important app areas
- `/hub/dashboard`
  - hub-facing dashboard surface
- `OrderCrmModal`
  - dossier / CRM overlay connected to order workflows
- `FixicoCalendar`
  - scheduler/calendar-connected order planning view

## Important data/workflow concepts CORI should know

### Canonical spine
- `workshop_orders` is the canonical Auftrag spine
- appointment, partner, files, drive links, local library, and later finance should converge here
- `repair_requests` is legacy and should not be the mental default

### Known real workflow entities
- customer
- vehicle
- plate number
- partner
- appointment
- drive folder
- local folder
- attachment
- task
- agent event
- delegation

### Known live cases in the system
- Roswitha / WI RH 210
- Sonja / MTK HN 101
- Helmut / Passat

## Current role model

### Admin
- sees full operations
- uses `/admin`, calendar, tasks, agents, CRM overlays

### Partner
- sees assigned operational slice
- uses partner dashboard / my orders / uploads / calendar-related partner views

### CORI local role
- first-line local app guide
- should help the user orient quickly
- should translate vague requests into the right app surface
- should escalate/delegate when a request leaves the app boundary

## Desired response style for CORI

CORI should:
- answer naturally, not like a static FAQ list
- use the library below as knowledge, not as a script to repeat verbatim
- infer the most likely target page when possible
- be concise first
- offer the next likely action
- only mention delegation when truly needed

Bad behavior:
- always giving the same intro paragraph
- dumping the same route list every time
- sounding like a placeholder bot

Good behavior:
- “Pentru Auftragele active, intră în /admin. Acolo vezi pipeline-ul și order cards.”
- “Dacă vrei planificare, mergi în /admin/calendar. Dacă vrei dosarul comenzii, intră pe Auftrag din dashboard.”
- “Asta nu e despre UI-ul Corion. Pentru asta trebuie delegat către alt agent sau workflow.”

## Library seed for future expansion

### Pages CORI should learn next
- exact nav labels from the top bar and side rail
- which cards/actions open dossier vs calendar vs partner views
- finance/CFO surfaces
- intake and document flows
- file attachment flows
- workshop/mobile/partner-facing differences

### Capabilities CORI should gain later
- route directly from chat actions
- open specific pages from suggestions/buttons
- open a real order by plate/reference/name
- search known entities from app data
- read a structured app map instead of hardcoded route snippets
- hand off to bus/supervisor/Claude when request leaves local app scope

## Strategic note

Corion is now large enough that it needs a durable internal library / map for agents and humans.
This file is the first layer of that map.
Next layers should likely include:

1. app route map
2. entity/data model map
3. workflow map
4. role/permission map
5. agent responsibility map


## Finance OS dashboard knowledge (from recent Claude implementation reports)

### Finance OS routes and preservation model
- `/finanzen`
  - new Finance OS overview dashboard
  - dark-mode main finance home
  - should act as overview + intelligence layer
- `/finanzen/detail`
  - preserved legacy finance detail dashboard
  - should remain available, not deleted
- admin navigation now points Finance / Finance OS toward `/finanzen`

### Finance OS dashboard purpose
The finance dashboard is intended to be:
- KPI-first
- dark mode
- modular via widgets
- finance + operations aware
- grounded in real data where available
- progressively agent-aware

It should not try to contain every finance detail on one screen.
Detail-heavy areas should stay in deeper pages.

### Current known real finance dashboard capabilities
- dark-mode shell at `/finanzen`
- legacy dashboard preserved at `/finanzen/detail`
- top KPI row with real data from `/api/cfo/cashflow`
- KPI delta vs previous period using `snapshot.previous` when available
- cashflow trend chart using existing `CashFlowChart`
- operational signals computed from `/api/admin/workshop-orders`
- intelligence panel using `/api/cfo/ai-advice` with Gemini/heuristic advice
- widget show/hide with localStorage persistence
- widget order persistence in localStorage
- drilldown links into real existing app surfaces

### Current known finance KPI set
Current or recently reported KPI widgets include:
- Revenue / Umsatz
- Expenses / Kosten
- Profit / Gewinn
- Receivables / Forderungen

Known supporting details:
- delta vs previous period is intended to be real
- receivables widget includes amount + count
- revenue widget may show partner payout sub-line

### Current known widget system direction
The dashboard widget system is evolving toward:
- widget registry
- widget descriptions
- widget `colSpan: 1 | 2`
- show/hide widget toggles
- persisted widget order
- future reorder/edit mode

CORI should know this means the finance dashboard is modular, not one hardcoded page.

### Current known real finance/operations signals
Reported live signals include:
- finished orders unpaid
- missed scheduled orders / overdue appointments
- orders without partner assignment
- partner payout amount missing
- incoming invoices waiting for review
- active orders without scheduling

These are grounded in live DB/app data, not decorative placeholders.

### Current known attention layer structure
The dashboard now has a structured attention layer with cards that can include:
- severity accent bar
- severity badge (`Kritisch`, `Achtung`, `Hinweis`)
- category tag
- count and/or amount
- title
- short explanation of why it matters
- action link / drilldown target

Known category language:
- urgent
- overdue
- blocked
- payout
- finance
- timing

Known empty-state pattern:
- if no issues, show green state like `Alles im Griff`

### Current known attention drilldowns
Known real drilldown/action mappings:
- unpaid finished orders -> `/admin`
- overdue schedule issues -> `/admin/calendar`
- missing partner assignment -> `/admin`
- missing partner payout amount -> `/admin`
- CFO incoming invoices -> `/cfo-inbox`
- active without scheduling -> `/admin/calendar`

CORI should use these as the current best available drilldown targets unless better dedicated routes are introduced later.

### Finance Agent direction
The finance dashboard is being prepared for a real finance agent panel.
Expected next architecture direction:
- backend endpoint such as `POST /api/cfo/agent-query`
- grounded in current dashboard snapshot + attention items
- should answer KPI and attention questions
- should explain why a metric or signal is flagged
- should distinguish real facts vs heuristic interpretation vs AI-generated explanation

CORI should treat the finance dashboard as a serious evolving intelligence surface, not just a reporting page.

### How CORI should answer about finance right now
Good examples:
- “Pentru overview financiar, intră în `/finanzen`. Acolo ai KPI-urile, cashflow trendul și attention signals.”
- “Dacă vrei suprafața veche mai detaliată, folosește `/finanzen/detail`.”
- “Pentru facturi care trebuie verificate, cel mai bun drilldown actual este `/cfo-inbox`.”
- “Pentru probleme care afectează revenue timing, verifică signals din Finance OS și apoi `/admin/calendar` sau `/admin` în funcție de caz.”

### Important truthfulness note for finance answers
CORI must not overclaim finance certainty.
If a finance insight is:
- directly data-backed -> say it confidently
- heuristic -> say it is an interpretation
- not yet implemented -> say that clearly



### Additional Finance OS implementation knowledge from later Claude reports

#### Current attention drilldowns (refined)
Updated known mappings:
- `Fertige Aufträge unbezahlt` -> action `Auftragsliste öffnen` -> `/auftraege`
- `Aufträge haben Termin verpasst` -> action `Kalender prüfen` -> `/admin/calendar`
- `Aufträge ohne Partnerzuweisung` -> action `Partner zuweisen` -> `/admin`
- `Partnerauszahlungen nicht definiert` -> action `Aufträge prüfen` -> `/auftraege`
- `Eingangsrechnungen zur Prüfung` -> action `CFO-Eingang öffnen` -> `/cfo-inbox`
- `Aktive Aufträge ohne Terminplanung` -> action `Termin planen` -> `/admin/calendar`

All of these are reported as real registered routes in `App.tsx`.

#### Known fallback caveat
- `Partnerauszahlungen nicht definiert` currently uses `/auftraege` as the best available real drilldown.
- Reason: there is no dedicated payout-management view yet.
- CORI should treat this as a real but imperfect surface, not a purpose-built payout tool.

#### Dashboard context richness for future Finance Agent
Reported grounded dashboard context includes:
- KPI snapshot: revenue, expenses, profit, deltas vs prior period
- receivables amount and count
- typed attention items with severity/category/amount/why-it-matters/action target
- cashflow trend via `byMonth`
- operational state including overdue orders, open without partner, missing payout, unscheduled active
- CFO invoices via `openInvoicesCount` and `openInvoicesCents`

This is considered strong enough to support a first grounded Finance Agent.

#### Expected first Finance Agent architecture
Expected implementation path described in reports:
- backend endpoint: `POST /api/cfo/agent-query`
- accepts `{ question, context: { attentionItems, signals, snapshot } }`
- builds structured system prompt from dashboard context
- returns:
  - `answer: string`
  - `relevantItemIds?: string[]`
  - `drilldown?: string`

#### Finance Agent UX direction
The first version should be:
- one question -> one grounded answer
- not a full freeform chatbot yet
- dashboard-aware
- able to highlight relevant attention cards
- able to surface a useful drilldown target

#### What Finance Agent should answer reliably in first version
- what needs attention today
- why something is flagged
- why profit is down
- how revenue is trending
- which orders are blocking partner payouts
- where the user should go to fix an issue
- what changed compared to the previous period

#### Finance answer truthfulness rule
For finance answers, CORI and future finance agents should distinguish:
- direct facts from dashboard/app data
- heuristic interpretation
- AI-generated explanation

They must not present all three as the same certainty level.


### Additional payout and multilingual implementation knowledge

#### Dedicated payout management surface
A newer application improvement added a dedicated payout-gap surface:
- route: `/admin/partner-payouts`
- page/component: `client/src/pages/AdminPayoutGaps.tsx`

Purpose:
- show completed partner orders where payout amount is still zero / undefined
- allow direct inline payout entry and saving
- replace the weaker generic `/auftraege` fallback for payout fixing

Known UX characteristics reported:
- dark-mode Finance OS aesthetic
- row list of affected orders
- shows order ref, customer, partner, order value
- inline euro input + save button
- success feedback after save
- empty healthy state when no payout gaps remain
- count badge in header
- breadcrumb back to Finance OS

#### Payout gap endpoints
Reported backend endpoints:
- `GET /api/cfo/payout-gaps`
  - returns completed partner orders with payout gap
- `PATCH /api/cfo/payout-gaps/:id`
  - validates input and updates `partner_payout_net_cents`

CORI should know this means payout issues now have a dedicated operational fix surface.

#### Updated payout drilldown truth
The previous fallback caveat is partially superseded:
- old imperfect fallback: `/auftraege`
- better current route: `/admin/partner-payouts`

If the question is specifically about missing partner payout amounts, CORI should prefer `/admin/partner-payouts` as the best current drilldown.

#### Shared multilingual behavior utility
A reusable server-side language utility now exists:
- file: `server/lib/agentLanguage.ts`

Reported exports:
- `detectLanguage(text)`
- `buildLanguageInstruction(userText, fallbackLang)`

Purpose:
- detect likely language of current user input
- produce a reusable system-prompt instruction line for agents
- allow multiple server-side agents to inherit the same language-alignment behavior

#### Current language behavior rule in implementation
The shared utility is intended to support:
1. current input language first
2. known/default user language second
3. system default only as fallback

This matches the constitution rule and should be reused by future agents whenever possible.

#### Finance Agent language implementation detail
Reported finance-agent update:
- `buildAgentSystemPrompt(...)` in finance routing now injects `buildLanguageInstruction(userQuestion, "de")`
- this replaced a more generic hardcoded multilingual instruction

This means the Finance Agent is no longer relying only on a static language reminder; it now uses shared reusable language guidance.

#### Current best-known payout and language answers for CORI
Good examples:
- “Pentru sume de payout lipsă, mergi în `/admin/partner-payouts`. Acolo poți completa direct valorile lipsă pentru parteneri.”
- “Agentul financiar răspunde în limba întrebării și folosește acum o logică reutilizabilă de language alignment.”

