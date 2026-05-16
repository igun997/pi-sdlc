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

**Model assignment** (from `sdlc.config.json` or `default-config.json`):
| Subagent | Tier | Example Model |
|----------|------|---------------|
| sdlc-worker | `coding` | claude-sonnet-4, gpt-4o, gemma-4 |
| sdlc-reviewer | `fast` | gpt-4o-mini, qwen2.5-32b |

## Step 0: Check Approval

```
plan_tracker_ide:
  action: check_approval
  phase: execute
```

If **APPROVED**, skip to verify handoff.

## Step 1: Load Context

1. Read `docs/specs/{feature}/config.json`
2. Get tasks: `plan_tracker_ide(action: "status")`
3. Identify pending tasks

## Step 2: Execute All Tasks (Auto-Loop)

For each pending task, run worker → reviewer chain automatically:

### 2a. Spawn Worker

```
plan_tracker_ide:
  action: update
  index: {N-1}
  status: in_progress
```

```
subagent:
  agent: sdlc-worker
  model: {coding tier from config}
  task: |
    Implement Task {N}: {task name}
    
    Acceptance Criteria:
    {criteria from task file}
    
    Files to modify:
    {files from task file}
    
    Rules:
    - Backend: Read docs/rules/backend/tdd.md (TDD mandatory)
    - Frontend: Read docs/rules/frontend/anti-slop.md (anti-slop mandatory)
    - Check _references/ folder if frontend
```

### 2b. Spawn Reviewer (auto after worker)

```
subagent:
  agent: sdlc-reviewer
  model: {fast tier from config}
  task: |
    Verify Task {N}: {task name}
    
    Check against criteria:
    {criteria from task file}
    
    Run: {testCommand}
    Build: {buildCommand}
    
    Return PASS or FAIL with evidence.
```

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
