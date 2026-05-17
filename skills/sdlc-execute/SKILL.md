---
name: sdlc-execute
description: Execute tasks with pre/post drift checks and verification gates. Use after sdlc-plan to implement with accuracy guarantees.
---

> **Model auto-switch:** Extension switches to execute-tier model automatically.
>
> **Rules:** Load from `docs/rules/` based on task type. See README.md for index.
>
> **Previous:** `/skill:sdlc-plan` | **Next:** `/skill:sdlc-verify`

# SDLC Execute

## Overview

Execute tasks automatically via subagents. Worker implements, reviewer verifies. **No confirmation needed** unless critical failure.

**Dependencies:** Requires pi-memctx, pi-subagents.

## MANDATORY: Use Subagent Tool

**🚨 CRITICAL: YOU MUST USE the `subagent` tool for task execution.**

❌ DO NOT implement tasks directly yourself
❌ DO NOT write code in main session  
❌ DO NOT call edit_ide or write_ide for task implementation
✅ ALWAYS call `subagent` tool with chain for each task
✅ ALWAYS delegate to `worker` subagent
✅ ALWAYS verify via `reviewer` subagent

**First action after loading tasks: call `subagent` tool**

```
subagent({
  "chain": [
    {"agent": "worker", "model": "...", "task": "..."},
    {"agent": "reviewer", "model": "...", "task": "..."}
  ]
})
```

This ensures:
- Proper model assignment per task
- Isolation between tasks
- Consistent verification flow

## Auto-Flow

```
FOR EACH TASK (1..N):
  sdlc-worker → implement (coding tier model)
       ↓
  sdlc-reviewer → verify (fast tier model)
       ↓
  PASS → next task (auto)
  FAIL → HARD STOP (needs user)
```

**Example: 6 tasks**
```
Task 1: worker(coding) → reviewer(fast) → ✓ PASS
Task 2: worker(coding) → reviewer(fast) → ✓ PASS
Task 3: worker(coding) → reviewer(fast) → ✗ FAIL → STOP
[user fixes]
Task 3: worker(coding) → reviewer(fast) → ✓ PASS
Task 4: worker(coding) → reviewer(fast) → ✓ PASS
Task 5: worker(coding) → reviewer(fast) → ✓ PASS
Task 6: worker(coding) → reviewer(fast) → ✓ PASS
→ Phase complete
```

**Model assignment** (from `.sdlc/config.json` or `default-config.json`):
| Subagent | Tier | Example Model |
|----------|------|---------------|
| worker | `coding` | claude-sonnet-4, gpt-4o, gemma-4 |
| reviewer | `fast` | gpt-4o-mini, qwen2.5-32b |

**Note:** Uses pi-subagents built-in `worker` and `reviewer` agents.

## Guardrail: Stuck Detection

If subagent appears stuck (no progress for 60+ seconds, looping, or anomalies):

**1. Check status:**
```json
{"action": "status", "id": "<run-id>"}
```

**2. If stuck/anomaly detected, interrupt:**
```json
{"action": "interrupt", "id": "<run-id>"}
```

**3. Report to user:**
```
⚠️ Subagent stuck on Task {N}
Status: {status from check}
Last progress: {last output}
Action: Interrupted chain

Options:
1. Retry task: say "retry"
2. Skip task: say "skip"
3. Manual fix: implement yourself then "continue"
```

**Anomaly signs:**
- Worker output says "done"/"complete"/"implemented" but status still "running"
- No new output for 30+ seconds (LLM hung/no response)
- Same output repeated 3+ times
- No file changes after implementation claim
- Reviewer loops without verdict
- Error messages in progress

**Detection logic:**
```
IF status == "running" AND (
  output contains "done" or "complete" or "implemented" or "finished"
  OR
  no new output for 30 seconds
)
THEN
  → Anomaly detected
  → Interrupt chain
  → Check actual file changes
  → If files changed correctly → mark complete, continue
  → If not → report to user
```

## Step 0: Check Approval

```
plan_tracker_ide:
  action: check_approval
  phase: execute
```

If **APPROVED**, skip to verify handoff.

## Step 1: Load Context

1. Read `docs/specs/{feature}/config.json` for feature settings
2. Read `.sdlc/config.json` (project root) for model tiers:
   ```json
   {
     "sdlc": {
       "modelTiers": {
         "coding": { "model": "<CODING_MODEL>" },
         "fast": { "model": "<FAST_MODEL>" }
       }
     }
   }
   ```
3. Get tasks: `plan_tracker_ide(action: "status")`
4. Identify pending tasks

**Extract models for subagent calls:**
- `worker` uses: `sdlc.modelTiers.coding.model`
- `reviewer` uses: `sdlc.modelTiers.fast.model`

## Step 2: Execute All Tasks (Auto-Loop)

**IMPORTANT: Call `subagent` tool for EACH task. Do NOT implement yourself.**

For each pending task, run worker → reviewer chain automatically:

### 2a. Spawn Worker

```
plan_tracker_ide:
  action: update
  index: {N-1}
  status: in_progress
```

Use `subagent` tool with chain:

```json
{
  "chain": [
    {
      "agent": "worker",
      "model": "<CODING_MODEL from .sdlc/config.json>",
      "task": "Implement Task {N}: {task name}\n\nAcceptance Criteria:\n{criteria}\n\nFiles: {files}\n\nRULES (read before coding):\n- Backend: Read docs/rules/backend/tdd.md - TDD MANDATORY (red→green→refactor)\n- Frontend: Read docs/rules/frontend/anti-slop.md - check _references/ first\n- All: Read docs/rules/general/git.md - security review before commit"
    },
    {
      "agent": "reviewer",
      "model": "<FAST_MODEL from .sdlc/config.json>",
      "task": "Verify Task {N}: {task name}\n\nCriteria:\n{criteria}\n\nRun: {testCommand}\nBuild: {buildCommand}\n\nReturn PASS or FAIL with evidence."
    }
  ]
}
```

**Example with real models (async for monitoring):**
```json
{
  "async": true,
  "chain": [
    {
      "agent": "worker",
      "model": "local-llm/openrouter/google/gemma-4-26b-a4b-it:free",
      "task": "Implement Task 1: Create Hello Module..."
    },
    {
      "agent": "reviewer", 
      "model": "local-llm/alibaba/qwen2.5-32b-instruct",
      "task": "Verify Task 1: Create Hello Module..."
    }
  ]
}
```

Chain runs worker → reviewer automatically. No manual spawn needed.

### 2b. Monitor Progress (if async)

If using `async: true`, monitor the run:

```json
{"action": "status", "id": "<returned-run-id>"}
```

Check every 30-60 seconds. Look for:
- `status: "completed"` → proceed to 2c
- `status: "running"` → wait, check progress output
- `status: "paused"` or errors → investigate
- No progress change for 60s → possible stuck, use guardrail

### 2c. Handle Result

**PASS** (reviewer says ✓):
```
plan_tracker_ide:
  action: update
  index: {N-1}
  status: complete
```
→ Auto-proceed to next task. No confirmation.

**FAIL** (reviewer says ✗):
→ **HARD STOP**
→ Show failure details
→ Wait for user to fix
→ After fix: re-run from 2a

### 2d. Commit (per task)

```bash
git add -A && git commit -m "feat({feature}): task {N} - {name}"
```

## Critical Failures (Require User)

Only stop and ask user when:
- Test failures
- Build failures  
- Drift detected (criteria mismatch)
- Worker reports blocker
- Ambiguous requirements

**NOT critical** (auto-continue):
- Lint warnings (if tests pass)
- Minor style issues
- Optional improvements suggested

## Step 3: Phase Complete

After all tasks pass:

```
plan_tracker_ide:
  action: approve
  phase: execute
  summary: "{N} tasks complete, all verified"
```

Sync to memctx:
```
memctx_save:
  type: action
  title: {feature} Execute Phase Complete
  tags: [sdlc, execute, {feature}]
```

## Handoff

> All {N} tasks implemented and verified.
>
> → `/skill:sdlc-verify` for final spec verification
