# Memory Fabric

## Purpose

Corion needs memory that behaves like infrastructure, not like a loose collection of notes, prompts, and ad hoc summaries.

This document defines the intended shape of the memory fabric that supports Corion, CORI, worker agents, future onboarding agents, finance intelligence, partner workflows, and future Hub+1 branches.

## Why “fabric”

The word fabric is useful because memory in Corion should not be one monolithic vault.
It should be a connected system of memory layers, scopes, and source relationships that can be reused safely across roles and agents.

The fabric should connect truth.
It should not flatten everything into one global blob.

## Core goals

The memory fabric should help the system:
- preserve continuity across sessions and agents
- reduce repeated human explanation
- support retrieval by role and task
- maintain source provenance
- remain inspectable and reversible
- avoid contextual leakage between domains and actors
- support both durability and recency

## Memory scopes

Memory should progressively support multiple scopes.

### Global doctrine scope
Shared durable knowledge about the system itself:
- constitutions
- architectural doctrine
- shared product principles
- reusable workflow rules

### Client scope
Memory specific to a client or business entity:
- client preferences
- client workflows
- client contacts
- client-specific learnings
- client integrations

### Domain/workspace scope
Memory specific to a domain such as:
- finance
- partner operations
- communications
- intake
- scheduling
- onboarding

### Entity scope
Memory tied to concrete work objects:
- client dossier
- order/Auftrag
- task
- appointment
- communication room
- payout issue

### Role scope
Memory slices filtered or shaped for:
- founder/admin
- partner
- CFO
- auditor
- validator
- worker agents
- onboarding agent

These scopes may overlap, but they should not collapse into one undifferentiated store.

## Memory layers inside the fabric

The fabric should distinguish between types of memory.

### Static doctrine layer
Versioned rules and stable reference material.

### Durable operational layer
Long-lived learnings and important history worth preserving beyond a single session or day.

### Recent operational layer
Short-horizon summaries, recent activity, current threads, and latest changes.

### Live state layer
Immediate truth derived from the current system state, current route, current entity, and current actor.

### Derived memory layer
Summaries, compactions, extracted patterns, and synthetic context artifacts produced from primary sources.

Derived memory should never fully replace access to primary sources.

## Canonical vs derived memory

This distinction matters.

### Canonical memory
Primary source or source-of-truth records such as:
- workshop orders
- payments
- files and attachments
- messages
- tasks
- calendar events
- role definitions
- validated architecture docs

### Derived memory
Secondary artifacts such as:
- summaries
- handoff notes
- compressed histories
- context packs
- extracted insights
- cached operational briefs

Derived memory is useful, but it must remain traceable back to canonical truth.

## Provenance requirements

A mature memory fabric should preserve:
- source id or path
- source type
- source owner/scope
- creation or sync time
- derivation chain where summaries exist
- last update time
- actor or system that produced the derivative artifact

If an agent uses a summary, the system should be able to trace that summary back to the source materials that informed it.

## Isolation requirements

Memory isolation is not optional.

The fabric should prevent inappropriate blending across:
- different clients
- different authority levels
- unrelated operational domains
- private versus shared rooms
- finance versus general operational visibility where needed

This reduces risk of:
- data leaks
- wrong decisions from mixed context
- hallucinated continuity
- role-inappropriate answers

## Role-aware access

Not every actor should access the same memory slice even when they operate on the same entity.

Examples:
- a partner may see operational next steps but not internal finance deliberation
- a CFO may see payout and receivable truth that a field partner should not
- an auditor may require raw logs and versions that an operator does not need day-to-day

This means memory retrieval should be governed by both relevance and permission.

## Versioning and rollback

Memory should be repairable.
That means the fabric should support, over time:
- versioned derived artifacts
- invalidation of corrupted summaries
- rebuild from canonical sources
- comparison between memory revisions
- rollback when compaction or extraction went wrong

Without this, memory becomes brittle and opaque.

## Compaction and compression stance

Compaction is necessary, but it should be governed carefully.

Useful dimensions for compression policy:
- operational relevance
- decision importance
- risk of losing nuance
- frequency of access
- source sensitivity
- legal or finance criticality

The fabric should allow different policies for:
- chat histories
- calendar state
- architecture docs
- invoices
- commitments made to customers
- files and image-derived notes

## Memory health and evaluation

A strong fabric should eventually support memory health checks.

Potential health signals:
- contradiction accumulation
- outdated summaries
- missing source backlinks
- duplicated memory artifacts
- unbounded recent-cache growth
- over-compression risk on sensitive material
- retrieval misses on known-important facts

This is important because broken memory can still produce superficially fluent agent behavior.

## Relationship to search

Search is one of the practical interfaces of the memory fabric.

Long term, search should work across:
- clients
- orders
- plates
- phone numbers
- files
- appointments
- tasks
- messages
- partner assignments
- finance signals
- derived summaries

But search results should respect scope and permissions.

## Relationship to context runtime

The memory fabric supplies the raw and derived material.
The context runtime assembles what is needed for a particular run.

A simple way to think about it:
- memory fabric stores and organizes truth over time
- context runtime selects, filters, shapes, and delivers that truth for action

These systems are linked, but not identical.

## First practical implementation direction

### 1. Preserve canonical docs and logs
Keep improving the current durable documentation and workflow logs rather than scattering ad hoc memory elsewhere.

### 2. Introduce explicit memory registry logic
A service such as `server/services/memoryRegistry.ts` should eventually resolve memory by:
- scope
- layer
- source type
- role visibility
- entity linkage

### 3. Introduce derived-artifact tracking
Summaries, handoff notes, and future context packs should carry source references and revision metadata.

### 4. Introduce audit-linked context assembly
When context is prepared for important agent runs, the memory sources included should be traceable.

### 5. Add health checks later
Periodic evaluation jobs should detect stale, contradictory, or low-trust memory regions.

## Open questions

Still unresolved and worth deciding carefully:
- exact storage strategy for durable memory artifacts
- whether some memory stays file-based while other parts move into DB-backed registries
- where revision history lives for derived summaries
- how much user-facing explainability to expose
- how to bridge local-first memory with future multi-device or cloud-backed operation

## Implementation stance

Do not try to create a perfect universal memory layer in one step.
Start from real Corion pain:
- repeated explanation
- fractured continuity
- poor cross-surface retrieval
- agent handoff friction
- missing auditability

Build the memory fabric as a disciplined extension of the spines already being created in the system.

The memory fabric succeeds when humans explain less, agents remain more coherent, and decisions become easier to trace and trust.
