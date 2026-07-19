# Corion Spine Map

## Purpose

This document defines the current and target source-of-truth structure for Corion OS so humans and agents can work safely without reintroducing dual-system bugs.

## Core rule

Until explicitly replaced, `workshop_orders` is the canonical Auftrag spine.

That means all major operational surfaces should converge on:
- order identity
- partner assignment
- appointment linkage
- file attachment linkage
- finance linkage

## Canonical spines

### 1. Auftrag spine
Source of truth:
- `workshop_orders`

Must own:
- order id / reference number
- customer + vehicle summary
- partner assignment
- scheduled date / linked appointment
- status flow
- file linkage
- drive/local/library linkage
- finance hooks

Current key files:
- `server/routes/auftrag.ts`
- `server/routes/workshop.ts`
- `server/routes/admin-finance.ts`
- `client/src/pages/AdminCalendar.tsx`
- `client/src/pages/WorkshopOrderDetail.tsx`
- `client/src/pages/PartnerDashboard.tsx`
- `client/src/pages/PartnerPortal.tsx`

### 2. Calendar spine
Canonical linkage:
- `appointment ↔ workshop_order`

Current key files:
- `client/src/pages/AdminCalendar.tsx`
- `client/src/components/FixicoCalendar.tsx`
- `server/routes/scheduler.ts`
- `server/routes/admin-finance.ts`

### 3. File spine
Canonical linkage:
- `file_attachments`
- Drive metadata
- local file path
- library key/path

Current key files:
- `server/routes/uploads.ts`
- `server/routes/admin-finance.ts`
- `server/lib/google-drive.ts`
- `server/lib/google-drive-oauth.ts`
- `scripts/link-roswitha-local-files-to-order.mjs`
- `uploads/workshop-orders/`

### 4. Partner spine
Canonical feed source:
- `/api/partner/my-orders`

Current key files:
- `client/src/pages/PartnerDashboard.tsx`
- `client/src/pages/PartnerPortal.tsx`
- `server/routes/partner-portal.ts`

### 5. Finance spine
Should link to Auftrag, not float separately.

Current key files:
- `client/src/pages/CFOInbox.tsx`
- `client/src/pages/FinancialDashboard.tsx`
- `server/routes/cfo-finance.ts`
- `server/routes/cfo-inbox.ts`

### 6. AI/task spine
Current key files:
- `client/src/components/TaskBoard.tsx`
- `client/src/pages/TaskBoard.tsx`
- `server/routes/task-board.ts`
- `server/ai-skills/*`
- `client/src/agents/CorionAgent.ts`

## Transitional / mixed zones

These are still useful, but should be split later:
- `server/routes/admin-finance.ts`
- `client/src/pages/PartnerPortal.tsx`
- `client/src/components/FixicoCalendar.tsx`
- `server/routes/scheduler.ts`

## Legacy zones

These must not be treated as canonical for new Auftrag behavior:
- `repair_requests`
- `client/src/pages/NewRepairRequest.tsx`
- `seed_repair_requests.ts`
- `seed_jobs.ts`

## Current active migration policy

1. Do not delete legacy files yet.
2. Do not build new operational features on `repair_requests`.
3. If code is uncertain but potentially useful, move or mirror it into a clearly marked preservation zone instead of deleting it.
4. All meaningful source-of-truth decisions must be written into docs before broad refactors.
5. Live behavior beats purely structural completion.

## Recommended execution order

1. Stabilize Auftrag spine behavior end-to-end.
2. Unify partner experience around one shell and one order feed source.
3. Keep bottom navigation persistent in partner mobile shell.
4. Split mixed backend routes by domain.
5. Split shared schema by spine.
6. Re-home old scripts and patch files into categorized preservation folders.
