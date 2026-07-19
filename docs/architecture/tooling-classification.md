# Tooling Classification, Preservation, and Move Policy

## Purpose

Not all non-runtime root files are junk.

Some files are:
- local runtime helpers
- account/bootstrap tools
- migration seeds
- scenario replay tools
- admin-sensitive utilities

This document prevents accidental movement of operational tooling into `Junk/` just because it is not imported by the main app runtime.

## Categories

### 1. Protected admin tools
These are sensitive and should later live in a protected tooling area, not in Junk.

Current examples:
- `create_accounts.ts`
- `setup_partners.ts`
- `update_admin_pwd.ts`

Rules:
- do not move casually
- do not expose credentials in chat or docs unnecessarily
- later move into a protected admin-tools folder with stricter handling notes

### 2. Local runtime helpers
These support local startup, packaging, or launcher behavior.

Current examples:
- `start-local.sh`
- `make_app.sh`
- `create_chrome_app.sh`
- `create_desktop_shortcut.scpt`

Rules:
- keep in place during stabilization
- later move into a dedicated local-tools or runtime-tools folder
- do not treat as junk

### 3. Legacy seed and migration reference files
These may not be part of active runtime, but they preserve important scenario logic and historical flow assumptions.

Current examples:
- `seed_grok_tasks.ts`
- `seed_jobs.ts`
- `seed_repair_requests.ts`
- `seed_tasks.ts`
- `seed_taxi_accident.ts`
- `seed_taxi_task.ts`
- `seed_vision_tasks.ts`

Rules:
- classify as legacy-active or migration-reference
- do not delete
- move only after creating a dedicated seeds/migrations/reference area

### 4. True junk candidates
These are files with no active import graph and no clear operational or sensitive role.

Typical examples:
- one-off patch scripts
- abandoned hotfix helpers
- loose assets in root
- stale patch artifacts

Rules:
- safe to quarantine into `Junk/` after usage verification

## Current move policy

### Move to Junk now
Allowed for:
- unused patch helpers
- loose inactive assets
- orphan patch artifacts
- clearly abandoned utilities with no operational sensitivity

### Do not move to Junk yet
Not allowed for:
- password/account utilities
- startup/runtime helpers
- migration seeds and scenario seeds
- any tool still plausibly used in manual operations

## Next target structure later

When stabilized, introduce clearer folders such as:
- `tools/admin/`
- `tools/local-runtime/`
- `tools/migration/`
- `tools/seeds/`
- `tools/probes/`

This should happen after source-of-truth behavior is more stable.
