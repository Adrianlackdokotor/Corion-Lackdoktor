# Context Compression Policy

## Purpose

Corion should not send raw, bloated, repetitive context into models when that context can be reduced safely.
At the same time, Corion must not compress away the information that protects decision quality, trust, auditability, or legal and financial correctness.

This document defines the intended policy direction for compressing context before model use.

## Why compression is a policy problem

Compression is often treated as a cost-saving trick.
That is too shallow.

In production, compression changes what the agent knows and how it reasons.
If done badly, it creates:
- false confidence
- omitted facts
- degraded decisions
- broken auditability
- loss of commitments and constraints

Compression should therefore be treated as a governed transformation of context, not as an invisible optimization.

## Compression objectives

A good compression policy should aim for:
- lower token usage
- lower latency
- less redundancy
- less noise
- preserved actionability
- preserved source traceability where needed
- minimal loss of decision-critical meaning

## Main decision axes

Compression policy should consider at least these axes:

### 1. Operational relevance
How much does this information matter to the current task, role, or workspace?

### 2. Decision value
Has this information historically changed decisions, approvals, routing, or risk assessment?

### 3. Risk of loss
How dangerous would it be if the information were over-summarized or partially lost?

### 4. Frequency of access
How often is this information used?
Frequently used stable rules may tolerate tighter summaries if canonical source remains available.
Rarely accessed but critical material may need fuller preservation.

### 5. Source sensitivity
How sensitive is the source from a legal, financial, privacy, or authority perspective?

## Compression classes

### Class A: conservative compression
Use minimal summarization and preserve closeness to source.

Typical candidates:
- legal text
- explicit customer promises
- finance-critical facts
- payout/payment commitments
- approval decisions
- edge cases
- dispute history
- audit-facing evidence
- unusual technical constraints

### Class B: balanced compression
Summarize carefully, preserving structure and key facts.

Typical candidates:
- order histories
- workflow state changes
- task progress
- relevant email threads
- operational meeting notes
- partner coordination summaries

### Class C: aggressive compression
Remove redundancy and collapse low-risk repetitive material.

Typical candidates:
- duplicate status chatter
- repetitive notifications
- low-signal coordination noise
- bulky HTML wrappers
- repeated route/navigation hints
- redundant fetch results

## Source-type guidance

### Chat and coordination messages
Guidance:
- preserve decisions, instructions, blockers, promises, and ownership changes
- compress repetitive acknowledgements and duplicate status chatter
- keep enough chronology to understand what changed

### Task data
Guidance:
- preserve task title, owner, linked entity, status, due signal, and blockers
- compress repetitive checklist commentary or low-value update noise

### Calendar and scheduling data
Guidance:
- preserve actual dates, time windows, location, participants, attachments, and scheduling commitments
- compress redundant reminders or repeated descriptive text

### Finance data
Guidance:
- preserve amounts, status, payer/payee meaning, evidence references, due state, and unresolved ambiguity
- do not aggressively summarize payout blockers, payment commitments, or disputed values

### Legal / contractual material
Guidance:
- compress conservatively
- preserve wording where promises, obligations, liability, or constraints matter
- maintain clear source links

### Customer communication
Guidance:
- preserve commitments made to the customer, changes of expectation, approvals, disputes, and deadlines
- compress greetings, low-value repetition, and redundant channel noise

### Architecture and doctrine docs
Guidance:
- preserve key principles, rules, role definitions, and implementation constraints
- compress repetition, scaffolding text, and explanatory redundancy where the canonical doc remains available

### HTML / web content
Guidance:
- aggressively strip presentation noise
- preserve semantic structure, key data fields, and linked commitments or facts

### Image-derived notes
Guidance:
- preserve what was actually observed versus inferred
- do not over-compress safety, damage, compliance, or evidence-relevant findings

## Role-aware compression

Compression policy should also vary by role.

Examples:
- a partner-facing pack may compress internal finance deliberation away entirely
- a CFO-facing pack should preserve payment and payout nuance
- an auditor-facing pack should keep provenance and version details stronger than a normal operator pack
- a worker-agent pack may receive operationally useful summaries while retaining links to canonical source for escalation

## Compression must preserve provenance

Whenever practical, compressed artifacts should preserve or reference:
- source id/path
- source type
- scope/entity linkage
- last update time
- derivation timestamp
- producing agent/system if machine-generated

Compressed context should remain traceable back to canonical truth.

## Compression and omission are different

The runtime should distinguish between:
- compression: source kept, but reduced
- omission: source intentionally excluded
- denial: source unavailable due to permission/policy

This matters because audit and debugging require understanding not only what was shortened, but also what was not included at all.

## Safety cases for refusing aggressive compression

The system should prefer conservative handling when context contains:
- unresolved money questions
- legal ambiguity
- conflicting commitments
- sensitive authority decisions
- incomplete evidence for action
- unusual edge-case operational history
- audit or dispute risk

In such cases, lower token cost is not worth higher decision fragility.

## Evaluation and quality control

Compression quality should eventually be tested, not assumed.

Potential checks:
- did key commitments survive compression?
- did payout/payment meaning survive compression?
- were blockers preserved?
- did chronology remain understandable?
- was source traceability retained?
- was risk material over-compressed?
- did the compressed context support the same decision as the full source?

## First implementation direction

### 1. Define compression policy in docs first
This file should guide implementation before silent ad hoc compression appears in many places.

### 2. Introduce compression modes in context pack assembly
Potential modes:
- conservative
- balanced
- aggressive
- audit-heavy
- finance-safe

### 3. Attach compression metadata to context packs
Each important run should eventually know:
- which compression mode was used
- which sources were compressed
- which were omitted
- which were preserved close to source

### 4. Start with a few domains
Recommended first domains:
- `/api/cori/chat`
- worker-agent dispatch
- onboarding flows
- coordination room intelligence
- finance agent queries

## Relationship to the broader architecture

This policy is part of the larger move toward:
- context runtime
- memory fabric
- role-aware retrieval
- agent constitution and IAM

Compression should not be implemented as an isolated technical trick.
It should be one governed layer inside the full context system.

## Implementation stance

Prefer correctness over impressive compression ratios.
If forced to choose, preserve trust and decision quality first, then optimize cost.

Corion should aim to become efficient without becoming lossy in dangerous ways.
