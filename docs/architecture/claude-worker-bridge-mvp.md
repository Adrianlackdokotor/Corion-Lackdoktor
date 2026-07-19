# Claude Worker Bridge MVP

## Goal

Build the smallest useful version of a real Claude worker integration for Corion Hub, so tasks can be dispatched to Claude without human copy-paste.

## MVP outcome

From inside Corion Hub or a local operator surface, we should be able to:
1. create a worker task
2. assign it to `claude_worker`
3. run Claude headless on the local machine
4. capture the result
5. store status, output, and changed-file summary back in Corion Hub
6. mark the task as ready for review

## What the MVP is not

Not yet:
- a full multi-agent orchestra
- not yet autonomous merge/deploy
- not yet full MCP mesh
- not yet role-perfect IAM
- not yet parallel worker scheduling at scale

This is a bridge MVP, not the final nervous system.

## MVP architecture

### 1. Task source
Corion Hub creates a task record.

Minimal task fields:
- `id`
- `title`
- `agent_type`
- `task_prompt`
- `working_directory`
- `status`
- `created_by`
- `created_at`

For MVP, `agent_type` can include:
- `claude_worker`
- later more agent types

### 2. Local bridge runner
A local Node service watches for tasks with:
- `agent_type = claude_worker`
- `status = queued`

It then runs Claude Code in headless mode.

Conceptually:
```bash
claude -p "worker prompt"
```

### 3. Worker prompt builder
The bridge converts Corion task data into a bounded Claude prompt.

The prompt should include:
- repo context
- task goal
- constraints
- required docs to read
- output format

### 4. Result capture
The runner captures:
- stdout
- stderr
- exit code
- duration

Then writes back to Corion Hub:
- `status = completed` or `failed`
- `result_summary`
- `result_payload`
- `finished_at`

### 5. Review state
Completed worker tasks should not be treated as automatically trusted.

Add review state:
- `pending_review`
- `approved`
- `needs_rework`

## Minimal data model

### `agent_tasks`
Fields:
- `id`
- `title`
- `agent_type`
- `task_type`
- `task_prompt`
- `working_directory`
- `status` (`queued`, `running`, `completed`, `failed`, `pending_review`)
- `created_by`
- `created_at`
- `started_at`
- `finished_at`

### `agent_task_results`
Fields:
- `id`
- `task_id`
- `summary`
- `raw_output`
- `structured_output_json`
- `exit_code`
- `changed_files_json`
- `risks_json`
- `verification_needed_json`
- `review_status`
- `review_notes`
- `created_at`

## MVP flow

### Step 1
User or supervisor creates a task in Corion.

Example:
- title: `Fix partner bottom nav persistence`
- agent_type: `claude_worker`
- task_prompt: bounded prompt

### Step 2
Bridge runner polls queued tasks.

### Step 3
Bridge runner locks task and marks:
- `status = running`

### Step 4
Bridge runner executes Claude locally with repo cwd.

### Step 5
Bridge runner parses result and stores it.

### Step 6
Task becomes:
- `pending_review`

### Step 7
Supervisor or operator reviews result.

## MVP worker output contract

Claude worker should return structured sections:
1. `Summary`
2. `Files changed`
3. `What changed`
4. `Risks`
5. `Needs live verification`

Later we can upgrade to strict JSON.

## Safe scope for MVP tasks

Allowed:
- docs work
- bounded UI tasks
- component extraction
- route cleanup in a defined area
- usage scans
- non-destructive repo organization

Avoid in MVP:
- auth rewrites
- password tooling
- broad schema migrations
- destructive cleanup
- autonomous deployment

## Suggested implementation files

Possible first implementation:
- `server/routes/agent-tasks.ts`
- `server/services/claudeWorkerBridge.ts`
- `server/services/agentTaskQueue.ts`
- `client/src/pages/AgentTasks.tsx` or a panel inside TaskBoard
- `shared/schema.ts` or future `shared/schema/agents.ts`

## Permissions for MVP

For MVP, Claude runs only on the local trusted machine and only against the configured repo path.

Constraints:
- explicit working directory
- bounded prompt
- review before trust
- no automatic merge/push/deploy

## Why this MVP matters

It converts Claude from:
- a manually operated coding assistant

into:
- a real worker endpoint inside Corion Hub

That is the first practical step toward the long-term agent orchestra.

## Immediate next implementation step

After this document:
1. create `agent_tasks` and `agent_task_results` model
2. create a tiny local bridge runner
3. create one admin UI surface to enqueue and inspect Claude tasks
4. test with one safe UI task end-to-end
