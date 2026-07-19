# Agent Task Approval Policy

Defines when the supervisor (Cora) may call `approveTask()` or `requestRework()`
autonomously and when a human must review before any action is taken.

---

## Guiding principle

The review gate exists because Claude output can be subtly wrong, and some wrong
outputs are cheap to fix while others cause real damage. The policy below is risk-
stratified: low blast radius → auto-approve is fine; high blast radius or sensitive
domain → human eyes first.

---

## Safe for auto-approve

The supervisor may call `approveTask()` without human review when **all** of the
following hold:

- Task type is `docs` or `analysis`
- No files were written or modified (result `changedFilesJson` is empty)
- No schema, auth, finance, or credential paths appear in the output
- Output length is within reason (summary present, not suspiciously blank or truncated)
- Exit code is 0

These tasks produce read-only artifacts (summaries, reports, plans) that a human can
read at any time. Approving them does not change system state.

---

## Safe for auto-rework (no human needed)

The supervisor may call `requestRework()` autonomously in all cases where the
result is clearly incomplete or malformed:

- Exit code is non-zero
- `summary` is blank or missing
- `rawOutput` contains known bridge error markers (e.g. `[bridge] error`, `Claude CLI exited`)
- Task timed out (result written by a timeout handler, not Claude itself)

These indicate execution failure, not a judgment call about content quality.
Requesting rework on a failed execution is mechanical, not evaluative.

---

## Requires human review — do not auto-approve

Human review is mandatory before `approveTask()` for any task where:

| Condition | Reason |
|---|---|
| `changedFilesJson` is non-empty | Files were written; changes must be inspected |
| Task type is `coding` or `cleanup` | Code changes carry correctness and regression risk |
| Any changed file matches `shared/schema.ts`, `server/routes/auth*`, `server/routes/admin-finance*`, `*password*`, `*credentials*`, `*.env*` | Sensitive areas per CLAUDE.md |
| `risksJson` is non-empty | Worker flagged its own concerns |
| `verificationNeededJson` is non-empty | Worker explicitly asked for verification |
| Task prompt included the words `delete`, `drop`, `migrate`, `force`, `rm`, or `reset` | Destructive intent — always inspect |
| Task type is `coding` and touched `PartnerDashboard`, `PartnerPortal`, or any finance route | Live customer-facing or revenue-critical surfaces |

When any of the above conditions apply: the supervisor surfaces the result to the
operator for review and waits. It must not call `approveTask()` until a human
has explicitly confirmed.

---

## What to do with the result while waiting for human review

1. Leave the task in `pending_review` state — do not reset or re-run.
2. Surface a notification to the operator (Telegram, admin UI, log entry) with:
   - task title
   - `summary` from the result
   - list of `changedFilesJson`
   - list of `risksJson`
3. Await explicit operator instruction before calling `approveTask()` or `requestRework()`.

---

## Policy for `needs_rework` + re-dispatch loop

When a task reaches `needs_rework` and the supervisor intends to re-dispatch:

- Auto re-dispatch is permitted at most **2 times** for any single original task intent.
- On the third attempt, escalate to human: the problem may not be solvable by
  re-running with the same prompt.
- The re-dispatch prompt should include the previous `reviewNotes` as context so
  the worker has feedback to act on.

---

## Summary table

| Scenario | Supervisor action |
|---|---|
| `docs`/`analysis`, no files changed, exit 0 | Auto-approve |
| Execution failed (non-zero exit, blank output) | Auto-requestRework |
| Any files changed | Wait for human |
| Auth / schema / finance path touched | Wait for human |
| `risksJson` or `verificationNeededJson` non-empty | Wait for human |
| Destructive keywords in prompt | Wait for human |
| `coding` or `cleanup` type | Wait for human |
| `needs_rework` after 2 re-tries | Escalate to human |
