---
name: sdlc-plan
description: Break specs into ordered tasks with acceptance criteria. Use after sdlc-spec to create executable task breakdown.
---

> **Related skills:** Create spec first with `/skill:sdlc-spec`. Execute with `/skill:sdlc-execute`.
>
> **Rules:** Read `docs/rules/BACKEND.md` and `docs/rules/FRONTEND.md` to understand task type requirements.

# SDLC Plan

## Overview

Transform spec into ordered tasks with testable acceptance criteria, dependencies, and scope estimates. Initialize plan tracker for progress visibility.

**Announce at start:** "I'm using the sdlc-plan skill to break down the spec into tasks."

**Dependency:** Requires pi-memctx for durable memory sync.

## The Process

### Step 1: Load Spec

1. If path provided: read from `docs/specs/{path}/spec.md`
2. If not provided: search memctx for recent specs

```
memctx_search:
  query: "spec {feature}"
  mode: keyword
```

3. Confirm spec found: "Found spec: {title}. Proceed with breakdown?"

### Step 2: Analyze Requirements

1. Read spec requirements and acceptance criteria
2. Identify natural task boundaries
3. Map dependencies between tasks
4. Estimate scope per task (S/M/L)

### Step 3: Create Task Breakdown

For each task, create `docs/specs/{feature}/tasks/NN-{name}.md`:

```markdown
# Task NN: {Task Name}

**Scope:** S | M | L
**Type:** backend | frontend | mixed
**Dependencies:** [Task numbers that must complete first]

## Description

[What this task accomplishes]

## Acceptance Criteria

- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]

## Files

- Create: `exact/path/to/new/file.ts`
- Modify: `exact/path/to/existing.ts`
- Test: `tests/path/to/test.ts`

## Steps

1. [Step 1 - specific action]
2. [Step 2 - specific action]
3. [Step 3 - specific action]

## Verification

- Test command: `npm test -- {pattern}`
- Expected: All tests pass
```

### Task Type Rules

**Type: backend** (API, services, logic, data)
- TDD mandatory
- Steps must include: write test → red → implement → green
- Test file required in Files section

**Type: frontend** (UI, components, styling)
- Anti-slop rules apply
- Steps must include: find existing patterns → reference → implement
- Must list 3+ existing components to reference

**Type: mixed** (full-stack features)
- Backend portions: TDD
- Frontend portions: anti-slop
- Split steps clearly by type

### Step 4: Sync to memctx

```
memctx_save:
  type: observation
  title: {feature} Tasks
  path: 60-observations/{feature}-tasks.md
  content: |
    # {Feature} Task Index
    
    Spec: [[20-context/{feature}-spec]]
    
    ## Tasks
    
    1. [[#task-01]] - {name} (S/M/L)
    2. [[#task-02]] - {name} (S/M/L)
    ...
    
    ## Task Details
    
    ### task-01
    {summary + criteria}
    
    ### task-02
    {summary + criteria}
  tags: [sdlc, plan, {feature}]
```

### Step 5: Initialize Plan Tracker

```
plan_tracker_ide:
  action: init
  tasks: [
    "Task 01: {name}",
    "Task 02: {name}",
    ...
  ]
```

### Step 6: Commit

```bash
git add docs/specs/{feature}/tasks/
git commit -m "docs: add task breakdown for {feature}"
```

## Task Granularity

**Good task size:**
- 15-60 minutes of work
- Single responsibility
- Clear done state
- Independently testable

**Split if:**
- Multiple unrelated changes
- More than 3 files created
- More than 2 hours estimated

**Merge if:**
- Trivially small (<5 min)
- Tightly coupled changes

## Dependency Rules

- Tasks with no dependencies come first
- Parallel tasks have same dependency set
- Circular dependencies = design problem, resolve first

## Plan Tracker Rules

**Trigger only on:**
- `init` - once after task breakdown complete
- Never during planning

## Handoff

After plan saved and committed:

**"Plan complete with {N} tasks. Saved to `docs/specs/{feature}/tasks/`.**

**Plan tracker initialized. Check status anytime with:**
```
plan_tracker_ide(action: "status")
```

**Ready to execute?**
- **Yes:** Use `/skill:sdlc-execute`
- **No:** Plan is ready for later execution"
