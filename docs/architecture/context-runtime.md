# Context Runtime

## Purpose

Corion is moving beyond prompt-centric agent behavior toward a real context runtime.

The goal is to stop treating prompts as the place where identity, memory, permissions, role behavior, and decision policy are all stuffed together. Instead, Corion should assemble context deliberately from modular, auditable components.

This document defines the implementation direction for that runtime.

## Why this matters

Agent quality in production depends less on raw model capability and more on:
- what the agent knows
- what it is allowed to know
- which role it is acting under
- which memory layers are active
- how context is compressed before model use
- how decisions can be audited later

This is especially important in Corion because the same system must support:
- founder/admin views
- partner views
- finance/CFO views
- future auditor/validator views
- in-app CORI assistance
- worker agents
- cross-channel communication
- future external specialist connectors

## Design principles

### 1. Prompt is not infrastructure
Prompts may still exist, but they should not be the sole carrier of:
- identity
- role behavior
- permissions
- memory
- compliance
- decision rules
- auditability

### 2. Context must be assembled, not dumped
The runtime should attach only the context that is necessary for the current run.

### 3. Shared truth, filtered perspective
Corion should converge around shared canonical truth, but expose different context slices depending on role, authority, workspace, and task.

### 4. Auditability matters
For important actions, the system should be able to explain what context was used, from which source, under which role and policy assumptions.

### 5. Compression must be policy-aware
Different sources require different compression behavior. Legal, finance, commitment, and edge-case information should be compressed conservatively.

## Runtime building blocks

### Role packs
Role packs define the perspective, emphasis, and decision posture of a run.

Examples:
- founder/admin role pack
- partner role pack
- CFO role pack
- worker agent role pack
- validator/auditor role pack

A role pack influences what matters in the resulting context.

### Policy packs
Policy packs define the operational rules under which a run happens.

Examples:
- access policy
- external messaging policy
- finance sensitivity policy
- compression policy
- validation/escalation policy
- source handling policy

### Context packs
Context packs are the assembled per-run payloads built from role pack, policy pack, memory layers, live state, and source excerpts.

A context pack should be:
- scoped
- source-linked
- minimal but sufficient
- versionable
- inspectable

## Memory layers

The runtime should separate memory into multiple layers.

### Layer 0: runtime base
Minimal core runtime instructions and identity.

### Layer 1: static doctrine/config
Stable, versioned material such as:
- constitutions
- role definitions
- architecture doctrine
- client or domain profiles
- workflow rules
- authority expectations

### Layer 2: durable structured memory
Longer-lived operational knowledge such as:
- important decisions
- client-specific learnings
- case patterns
- historical summaries worth preserving
- reusable operational truths

### Layer 3: recent operational cache
Recent events and short-horizon state such as:
- latest messages
- recent appointments
- new blockers
- current day activity
- temporary summaries

### Layer 4: live operational context
Just-in-time context such as:
- current order/task/client
- current route/workspace
- current user role
- linked files
- payment/payout state
- current coordination room state

## Isolation model

Memory must not behave like one global pool.

Corion should progressively support isolation across:
- client
- workspace/domain
- order/case
- role
- authority level

This protects against:
- contextual leakage
- incorrect decisions from mixed data
- inappropriate disclosure
- low-trust agent behavior

## Role-aware retrieval

Retrieval should be filtered by more than semantic relevance.

It should also consider:
- the current actor
- current role pack
- permissions
- current entity scope
- source sensitivity
- task intent

This allows the same underlying truth to be interpreted differently for partner, admin, CFO, or auditor workflows without creating separate incompatible realities.

## Compression policy

Context compression should be explicit and source-aware.

Compression policy should consider:
- source type
- decision relevance
- risk of losing meaning
- frequency of access
- authority sensitivity

### Conservative compression candidates
- legal text
- payment promises
- client commitments
- finance-critical fields
- unusual case history
- source-of-truth summaries used for approval or audit

### Aggressive compression candidates
- repetitive low-risk operational chatter
- redundant status notes
- duplicate descriptions
- bulky HTML or external web formatting

## Audit trail expectations

The system should evolve toward recording, at minimum:
- run id
- actor/user/agent id
- role pack id/version
- policy pack id/version
- context pack id/version
- included sources
- excluded/denied sources
- compression mode
- timestamp
- resulting action/result id where relevant

This does not need to be fully exposed at first, but it should become structurally possible.

## Rollback and versioning

Memory and context artifacts should become reversible and inspectable over time.

Desired direction:
- versioned memory summaries
- source backlinks from summaries
- revision history for context pack logic
- ability to invalidate or rebuild bad summaries
- ability to compare older and newer memory states

## Evaluation beyond output

Corion should eventually evaluate not only whether an agent answer “looks good,” but whether the memory and context selection process is healthy.

Potential evaluation signals:
- contradiction rate
- stale context usage
- source omission errors
- over-compression risk
- irrelevant retrieval rate
- memory drift
- missing critical fields in context packs

## First practical implementation slice

### 1. Add canonical architecture docs
This file plus related memory/compression docs should define the system before the runtime spreads ad hoc.

### 2. Introduce a context pack builder service
Potential path:
- `server/services/contextPackBuilder.ts`

Responsibilities:
- accept role, actor, route, entity ids, and intent
- gather relevant layer inputs
- apply policy-aware filtering
- return a structured context pack

### 3. Introduce a memory registry service
Potential path:
- `server/services/memoryRegistry.ts`

Responsibilities:
- separate static doctrine, durable memory, recent cache, and live context
- resolve sources by domain/entity/role
- preserve source provenance

### 4. Add context audit logging
Potential path:
- DB table or append-only log for context runs

Responsibilities:
- store which pack composition was used for important runs
- support future debugging, review, and governance

### 5. Connect first consumers
Recommended first consumers:
- CORI in-app chat
- `/api/cori/chat`
- worker-agent dispatch paths
- future onboarding assistant
- selected `/admin/comms` room intelligence

## Relationship to existing architecture

This direction extends, rather than replaces, the current Corion spine work.
It should integrate with existing canonical spines around:
- client
- order
- communication
- files
- calendar
- task
- finance
- memory
- search

The runtime should become the assembly layer that helps agents and assistant surfaces consume these spines coherently.

## Open questions

Still to be decided over time:
- exact storage shape for durable memory beyond current docs/logs
- whether context packs are materialized or ephemeral only
- how much of audit trail becomes user-visible
- which parts run locally vs cloud-backed
- how compression logic is configured and tested
- how cross-agent shared memory is bounded safely

## Implementation stance

Do not attempt to solve the whole runtime at once.
Build it in slices.
Keep it grounded in real Corion workflows.
Prefer improvements that reduce human relay burden, page switching, and context reconstruction.

The runtime is successful when agents become more coherent, more trustworthy, and less dependent on giant prompts or fragile manual handoff.
