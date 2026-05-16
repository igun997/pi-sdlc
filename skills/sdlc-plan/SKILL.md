---
name: sdlc-plan
description: Break specs into ordered tasks with acceptance criteria. Use after sdlc-spec to create executable task breakdown.
---

> **Model auto-switch:** Extension switches to plan-tier model automatically.
>
> **Rules:** Assign task types so executor loads correct rules from `docs/rules/`.
>
> **Previous:** `/skill:sdlc-spec` | **Next:** `/skill:sdlc-execute`

# SDLC Plan

## Overview

Transform spec into ordered tasks with testable criteria, dependencies, and scope estimates.

**Dependency:** Requires pi-memctx.

## Process

### Step 1: Load Spec

```
memctx_search:
  query: "spec {feature}"
  mode: keyword
```

Or read from `docs/specs/{path}/spec.md`.

### Step 2: Create Tasks

For each task, create `docs/specs/{feature}/tasks/NN-{name}.md`:

```markdown
# Task NN: {Name}

**Scope:** S | M | L
**Type:** backend | frontend | mixed
**Dependencies:** [Task numbers]

## Description
[What this accomplishes]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Files
- Create: `path/to/new.ts`
- Modify: `path/to/existing.ts`
- Test: `tests/path.ts`

## Steps
1. [Specific action]
2. [Specific action]

## Verification
- Test: `npm test -- {pattern}`
```

### Task Types

| Type | Executor Rules |
|------|----------------|
| `backend` | TDD mandatory (red→green→refactor) |
| `frontend` | Anti-slop mandatory, reference existing |
| `mixed` | Backend: TDD, Frontend: anti-slop |

### Step 3: Sync to memctx

```
memctx_save:
  type: observation
  title: {feature} Tasks
  path: 60-observations/{feature}-tasks.md
  tags: [sdlc, plan, {feature}]
```

### Step 4: Init Tracker

```
plan_tracker_ide:
  action: init
  tasks: ["Task 01: {name}", "Task 02: {name}"]
```

### Step 5: Commit

```bash
git add docs/specs/{feature}/tasks/
git commit -m "docs: add task breakdown for {feature}"
```

## Task Granularity

**Good:** 15-60 min, single responsibility, independently testable.

**Split if:** Multiple unrelated changes, >3 files, >2 hours.

**Merge if:** <5 min, tightly coupled.

## Handoff

> Plan complete: {N} tasks in `docs/specs/{feature}/tasks/`
>
> Ready to execute? → `/skill:sdlc-execute`
