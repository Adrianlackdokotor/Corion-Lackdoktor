# Constitutional agent substrate

## Status

MVP foundation, active in code.

The substrate makes the Hub+1 doctrine executable without pretending that all
future policy, memory, entitlement and billing infrastructure already exists.

## Source layers

1. `base-agent-constitution.ts`
   - mandatory identity, truth, authority, memory, workflow and economics rules
   - inherited by every compiled constitutional prompt
2. `agent-constitution.ts`
   - role-specific mission, goals, guardrails, escalation and response patterns
3. `agent-registry.ts`
   - surfaces, action allowlist, forbidden actions and output contract
4. `agent-runtime-contracts.ts`
   - execution mode per action, write targets, runtime state and logging events
5. `agent-substrate.ts`
   - compiler joining the four layers into one runtime definition
   - factory for a dedicated per-user agent
6. `agentUsage.ts`
   - append-only operational usage events
   - optional bridge to the financial token ledger, disabled by default

## Mandatory inheritance

New agents must be added to the constitution, registry and runtime contract,
then instantiated through `compileConstitutionalAgent()`.

Do not create new production agents from a standalone prompt blob.

The compiler defaults actions without an explicit execution rule to
`human_review`. Missing allowlist entries are denied.

## Dedicated user agents

Use `createUserSpecificAgent()` with:

- `userId`
- user role
- template agent key
- allowed surfaces

The resulting definition has:

- user ownership and beneficiary attribution
- private user memory scope
- explicit entity/data scope
- inherited constitutional rules
- inherited and bounded action policy
- measure-only economics by default

The factory creates a runtime definition, not a database identity. Persistence
of per-user agent profiles is a later phase and must include lifecycle,
entitlement, memory retention and account deletion rules before a schema is
introduced.

## Usage and token accounting

`agent_events` is the MVP operational usage ledger. Usage events record:

- agent key and slug
- owner user
- beneficiary user
- surface
- operation
- weighted units
- provider/model and model token counts when available
- canonical order/task linkage
- billable/debit status

Usage measurement is not billing.

`token_ledger` remains the financial utility-credit ledger. It is touched only
when both `billable` and `debitCredits` are explicitly true. Current Cora and
CORI integrations use measure-only mode and do not debit balances.

## Current production integration

- Admin Cora compiles from `ADMIN_CORA`.
- Admin Cora operations record usage after each classified operation.
- Gemini-grounded CORI chat receives the compiled constitutional prompt and
  records measure-only usage.
- Existing registered role prompts inherit the base constitution through
  `buildAgentSystemPrompt()`.

## Next phases

1. Persist per-user agent profiles and entitlements.
2. Add policy-aware memory retrieval with tenant/entity filters.
3. Add pending-action confirmation records with expiry and idempotency keys.
4. Capture provider-reported input/output token counts.
5. Add aggregated usage queries per owner, beneficiary, surface and agent.
6. Introduce quotas only after plan and exception policy are defined.
7. Enable credit debit only for explicitly priced operations.

No crypto or speculative token behavior is part of this substrate.
