# Corion Lackdoktor — AI-first workshop operating system

Corion is an operational prototype for an auto-body repair business. It turns a customer request — text, photos, contact details and follow-up — into an accountable workshop workflow instead of a disconnected form submission.

The project is being built with a simple product doctrine: let people focus on physical work and decisions; let the system absorb more of the repetitive digital work.

## Live surfaces

- [corion.app](https://corion.app) — public, mobile-first conversational intake
- [corion-lackdoktor.de](https://corion-lackdoktor.de) — business, trust and service website
- [app.corion.app](https://app.corion.app) — authenticated Corion application

The application runtime is hosted on a Mac mini and exposed through Cloudflare Tunnel. The static public landing is deliberately separate from the application runtime.

## What is implemented

- Public intake that creates a canonical `workshop_orders` record and returns a real reference number.
- Photo/file intake routed to the canonical attachment flow.
- Admin pipeline, workshop dossier, partner assignment, scheduling and task surfaces.
- `workshop_orders` as the canonical Auftrag spine; `file_attachments` as structural file linkage.
- Partner-facing order feed direction through `/api/partner/my-orders`.
- Finance and operational dashboards built around real data where available.
- CORI, an authenticated admin assistant with canonical search, dossier navigation, bounded task creation and confirmation-gated sensitive mutations.
- OpenClaw-backed CORI session continuity, while Corion remains the authority for canonical data and actions.

## Deliberate boundaries

This is a live operational MVP, not a finished SaaS platform.

- `repair_requests` remains legacy; new workflow work belongs on the `workshop_orders` spine.
- Sensitive actions are intentionally confirmation-gated.
- CORI does not claim a mutation, QA result or business metric unless the Corion backend has supplied the relevant canonical result.
- Runtime credentials, OAuth tokens, production state, customer uploads, internal notes and historical prompt archives are intentionally excluded from this public snapshot.

## Architecture

```text
public landing / channels
        ↓
canonical intake → workshop_orders → files / calendar / partner / finance
        ↓
admin dashboard + CORI operational assistant
```

The dashboard is an observability and approval surface. Canonical operational truth lives in the backend records, not in chat memory or a dashboard card.

## Stack

- React + TypeScript + Vite
- Express + Node.js
- PostgreSQL + Drizzle ORM
- Google Drive / Calendar integrations
- Cloudflare Tunnel for the live app runtime
- Gemini / OpenClaw integration for bounded agent continuity

## Local development

```bash
npm install
npm run dev
```

Create local environment values from `.env.production.example`; never commit populated environment files or OAuth credentials.

## Repository note

This Build Week branch is a curated, publishable source snapshot. It excludes customer data, local runtime state, credentials, internal archives, deployment copies and other non-source artifacts. The active production runtime and internal operational history remain private.

## Status

The public intake, app surface and authenticated operational prototype are live. Several advanced capabilities — fully autonomous mutations, complete business intelligence and exhaustive app telemetry — remain intentionally bounded or in progress.

© Corion GmbH. All rights reserved.
