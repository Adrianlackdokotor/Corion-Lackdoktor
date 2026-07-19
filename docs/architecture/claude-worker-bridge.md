# Claude Worker Bridge Architecture

## Purpose

This document defines how Claude Code should be integrated into Corion Hub as a real worker agent, so humans are not forced into copy-paste coordination between many agents.

The goal is not "Claude in a terminal window" as the final operating model.
The goal is a supervised worker bridge where Corion Hub can dispatch work, receive results, and track status.

## Problem statement

Interactive local Claude sessions are useful for setup and one-off work, but they are not the target architecture for Corion OS.

Limitations of the interactive-only model:
- requires human copy-paste
- requires human visibility into the terminal
- makes multi-agent scaling painful
- makes status tracking inconsistent
- does not create a clean orchestration bus inside Corion Hub

## Target model

Corion Hub should become the orchestration layer.

### Roles
- **Supervisor agent**
  - plans work
  - chooses the right worker
  - defines constraints
  - reviews results
  - decides whether to merge, retry, or escalate
- **Claude worker**
  - performs bounded coding or analysis tasks
  - returns structured results
  - does not decide source-of-truth architecture alone
- **Other workers**
  - file/doc worker
  - finance worker
  - intake worker
  - partner UX worker
  - future external model workers

## Architectural principle

No human clipboard should be required for normal agent-to-agent work.

## Recommended implementation phases

## Phase 1: Local Claude Worker Bridge MVP

Use Claude Code headless from Corion Hub.

### Mechanism
Corion Hub creates a task record, then a local bridge service runs something like:

```bash
claude -p "bounded worker prompt"
```

The bridge captures:
- stdout
- exit status
- changed files summary
- optional structured JSON output

Then it writes the result back into Corion Hub.

### Components
1. **Task queue**
   - local DB table or structured queue file
2. **Bridge runner**
   - Node service that launches Claude CLI tasks
3. **Result collector**
   - stores output, status, timestamps, and artifact links
4. **Supervisor surface**
   - lets a lead agent or human inspect and approve

### Suggested task schema
- `id`
- `agent_type`
- `task_type`
- `prompt`
- `context_refs`
- `working_dir`
- `status`
- `result_summary`
- `result_payload`
- `changed_files`
- `started_at`
- `finished_at`
- `review_status`
- `review_notes`

## Phase 2: Structured output mode

Move Claude worker runs toward structured output.

Possible directions:
- `claude --print --output-format json`
- prompt Claude to return strict JSON
- parse fields such as:
  - `summary`
  - `files_changed`
  - `risks`
  - `verification_needed`
  - `next_recommended_action`

This makes the bridge much easier to automate.

## Phase 3: Shared bus via MCP or local service API

Introduce a real control bus.

### Recommended options
#### Option A: MCP server
Corion exposes tools/resources like:
- `enqueue_task`
- `claim_task`
- `write_result`
- `read_context`
- `update_status`

#### Option B: local HTTP bridge
A lightweight local service exposes endpoints like:
- `POST /agent-tasks`
- `POST /agent-results`
- `GET /agent-tasks/:id`
- `POST /agent-tasks/:id/cancel`

#### Option C: shared SQLite-backed queue
Fast MVP for local-only orchestration.

## Phase 4: Multi-agent orchestration

Once the bridge is stable, supervisor logic can dispatch work to multiple workers in parallel.

Example:
- Claude worker for UI task
- Cora worker for architecture review
- file worker for attachment verification
- finance worker for payout logic review

Supervisor collects all outputs and merges them into one decision flow.

## Worker rules

Claude worker should receive bounded tasks only.

### Good worker tasks
- component extraction
- route cleanup inside one bounded area
- UI fixes
- docs updates
- controlled file quarantine after verification
- tests/build verification

### Bad worker tasks without explicit review
- source-of-truth redesign
- broad schema migration
- destructive cleanup
- password/account tooling changes
- uncontrolled repo-wide refactors

## Required worker bootstrap

Every Claude worker session should inherit:
- `CLAUDE.md`
- `docs/architecture/corion-spine-map.md`
- `docs/architecture/junk-preservation-policy.md`
- `docs/architecture/agent-constitution-and-iam.md`
- `docs/architecture/tooling-classification.md`

## Permission model direction

Corion should evolve to role-aware worker permissions.

Example future worker caps:
- `partner-ux-worker`
  - can edit partner UI files
  - cannot edit auth or finance
- `file-ops-worker`
  - can modify file-routing/linkage surfaces
  - cannot edit user-account tooling
- `finance-worker`
  - can inspect finance state
  - cannot confirm payments without evidence

## Minimal first build recommendation

Build a `claude-worker-bridge` service that:
1. receives a task from Corion Hub
2. maps it into a bounded Claude prompt
3. runs Claude headless in the repo
4. captures stdout and exit code
5. writes structured result back to a Corion task/result table
6. marks task as pending_review or completed

## Why this matters

This bridge turns Claude from a manual terminal helper into a real member of the Corion agent workforce.

That is the path from:
- copy-paste between humans and agents

to:
- a real operational agent orchestra inside Corion Hub.
