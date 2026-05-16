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

Execute tasks with drift prevention (pre-check), drift detection (post-check), and gates (tests > checklist > build). Hard stop on failure.

**Dependency:** Requires pi-memctx.

## The Loop

```
PRE-CHECK  → Confirm understanding
    ↓
IMPLEMENT  → Code the task
    ↓
POST-CHECK → Compare vs criteria
    ↓
GATES      → tests > checklist > build
    ↓
COMPLETE   → Update tracker, advance
```

## Load Rules

**Before coding, read relevant rules:**

| Task Type | Rules to Load |
|-----------|---------------|
| Frontend | `docs/rules/frontend/anti-slop.md`, `components.md` |
| Backend | `docs/rules/backend/tdd.md`, `api-design.md` |
| Go | `docs/rules/golang/patterns.md` |
| Rust | `docs/rules/rust/patterns.md` |
| All | `docs/rules/general/verification.md` |

## Step 1: Load Context

1. Read `docs/specs/{feature}/config.json`
2. Get current task: `plan_tracker_ide(action: "status")`
3. Read task file

## Step 2: PRE-CHECK

1. Summarize task in one paragraph
2. List acceptance criteria
3. State files to touch
4. Ask: "Task {N}: {summary}. Proceed?"

**autoAdvance: false** → Wait for confirmation.
**autoAdvance: true** → Show summary, proceed.

## Step 3: IMPLEMENT

```
plan_tracker_ide:
  action: update
  index: {N-1}
  status: in_progress
```

Follow task steps. Apply rules by type:

### Backend: TDD Required

```
RED    → Write failing test
GREEN  → Minimal code to pass
REFACTOR → Clean, tests pass
```

Evidence: show red output, then green output.

### Frontend: Anti-Slop Required

1. Check for `_references/` folder first
2. Find 3+ existing components to reference
3. Use project design tokens
4. No generic AI aesthetics

**Do NOT claim completion yet.**

## Step 4: POST-CHECK

Compare implementation vs criteria. If drift:

- **HARD STOP**
- Report: "Drift detected: {criterion} vs {actual}"
- Ask: "How to resolve?"

## Step 5: GATES

Execute in order: **tests > checklist > build**

### Gate 1: Tests

```bash
{testCommand from config}
```

Pass: exit 0, 0 failures. Show output.
Fail: **HARD STOP**, show failures.

### Gate 2: Checklist

```
Acceptance Criteria:
- [x] Criterion 1 - VERIFIED: {evidence}
- [x] Criterion 2 - VERIFIED: {evidence}
```

Any unchecked: **HARD STOP**

### Gate 3: Build

```bash
{buildCommand from config}
```

Pass: exit 0. Fail: **HARD STOP**

## Step 6: COMPLETE

```
plan_tracker_ide:
  action: update
  index: {N-1}
  status: complete
```

Sync to memctx:

```
memctx_save:
  type: action
  title: {feature} Task {N} Complete
  path: 40-actions/YYYY-MM-DD-{feature}-task-{N}.md
  tags: [sdlc, task, {feature}]
```

Commit:

```bash
git commit -m "feat({feature}): complete task {N} - {name}"
```

**autoAdvance: true** → Proceed to next task.
**autoAdvance: false** → "Say 'next' to continue."

## Hard Stop Protocol

1. Stop immediately
2. Report: which gate, exact error
3. Wait for resolution
4. After fix: re-run failed gate

## Handoff

> All {N} tasks complete.
>
> Ready for final verification? → `/skill:sdlc-verify`
