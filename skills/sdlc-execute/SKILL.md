---
name: sdlc-execute
description: Execute tasks with pre/post drift checks and verification gates. Use after sdlc-plan to implement with accuracy guarantees.
---

> **Related skills:** Create plan first with `/skill:sdlc-plan`. Final verification with `/skill:sdlc-verify`.
>
> **Rules:** Backend tasks follow `docs/rules/BACKEND.md`. Frontend tasks follow `docs/rules/FRONTEND.md`. All code follows `docs/rules/GENERAL.md`.

# SDLC Execute

## Overview

Execute tasks one by one with drift prevention (pre-check), drift detection (post-check), and verification gates (tests > checklist > build). Hard stop on any failure.

**Announce at start:** "I'm using the sdlc-execute skill to implement the plan with verification gates."

**Dependency:** Requires pi-memctx for context recall.

**Before starting:** Read the rules documents:
- `docs/rules/GENERAL.md` - applies to all code
- `docs/rules/BACKEND.md` - for backend tasks (TDD mandatory)
- `docs/rules/FRONTEND.md` - for frontend tasks (anti-slop mandatory)

## The Loop

For each task in plan:

```
┌─────────────┐
│  PRE-CHECK  │ ← Confirm understanding before coding
└──────┬──────┘
       ▼
┌─────────────┐
│  IMPLEMENT  │ ← Code the task
└──────┬──────┘
       ▼
┌─────────────┐
│ POST-CHECK  │ ← Compare result vs criteria
└──────┬──────┘
       ▼
┌─────────────┐
│   GATES     │ ← tests > checklist > build
└──────┬──────┘
       ▼
┌─────────────┐
│  COMPLETE   │ ← Update tracker, advance
└─────────────┘
```

## Step 1: Load Context

1. Read config from `docs/specs/{feature}/config.json`
2. Get current task from plan tracker:

```
plan_tracker_ide:
  action: status
```

3. Read task file from `docs/specs/{feature}/tasks/NN-{name}.md`
4. If task not found locally, recall from memctx:

```
memctx_search:
  query: "{feature} task {N}"
  mode: keyword
```

## Step 2: PRE-CHECK (Drift Prevention)

**Purpose:** Confirm understanding before coding.

1. Summarize task in one paragraph
2. List acceptance criteria
3. State what files will be touched
4. Ask: "Task {N}: {summary}. Proceed?"

**If `autoAdvance: false`:**
- Wait for user "yes" / "proceed" / "go"
- If user has concerns, address them first

**If `autoAdvance: true`:**
- Show summary, proceed without waiting
- User can interrupt with "stop" or "wait"

## Step 3: IMPLEMENT

1. Update tracker:

```
plan_tracker_ide:
  action: update
  index: {N-1}
  status: in_progress
```

2. Follow task steps exactly
3. **Backend code: TDD required** (see TDD Rules below)
4. **UI code: Anti-slop required** (see Anti-Slop Rules below)
5. Implement minimal code to satisfy criteria
6. **Do NOT claim completion yet**

---

## TDD Rules (Backend)

**Mandatory for all backend/API/service/logic code.**

```
RED    → Write failing test first
GREEN  → Minimal code to pass
REFACTOR → Clean up, tests still pass
```

**The law:**
1. Write test BEFORE implementation
2. Run test, confirm it FAILS (red)
3. Write minimal code to pass
4. Run test, confirm it PASSES (green)
5. Refactor if needed, tests still green
6. Commit

**Violations:**
- Writing implementation before test = violation
- Skipping red phase = violation
- "I'll add tests later" = violation

**Evidence required:**
```
# Show red:
$ npm test
FAIL: expected X but got undefined

# Show green:
$ npm test  
PASS: 1/1 tests
```

---

## Anti-Slop Rules (UI/Frontend)

**Mandatory for all UI/component/styling code.**

### What is AI Slop?

Low-quality AI-generated UI with:
- Generic patterns (Inter font, purple gradients, glassmorphism)
- Cookie-cutter layouts
- Buzzword-heavy copy
- No project personality

### The Rules

**1. Reference existing codebase first**
- Find 3+ existing components before creating new
- Match existing patterns, tokens, conventions
- If no existing pattern, ask user for direction

**2. No generic AI aesthetics**

| Slop Pattern | Instead |
|--------------|--------|
| Purple-blue gradients | Use project color tokens |
| Glassmorphism cards | Match existing card style |
| Inter/default fonts | Use project typography |
| "Modern" buzzwords | Clear, specific copy |
| Excessive animations | Match existing motion |

**3. Component checklist**

Before writing UI component:
- [ ] Found 3+ similar components in codebase?
- [ ] Using project design tokens?
- [ ] Matches existing spacing/layout patterns?
- [ ] Copy reviewed (no generic AI text)?
- [ ] Accessibility considered?

**4. When unsure, ASK**

```
"I see two patterns in codebase for cards:
- Pattern A: src/components/Card.tsx (shadow, rounded)
- Pattern B: src/components/Panel.tsx (border, square)

Which should I follow for this feature?"
```

**Violations:**
- Inventing new design patterns = violation
- Ignoring existing components = violation
- Generic placeholder copy = violation
- "Looks modern" without codebase reference = violation

## Step 4: POST-CHECK (Drift Detection)

**Purpose:** Compare what was built vs what spec said.

For each acceptance criterion:
1. Check if implementation satisfies it
2. If drift detected:
   - **HARD STOP**
   - Report: "Drift detected in Task {N}:"
   - Show: criterion vs actual implementation
   - Ask: "How to resolve?"

**No drift = proceed to gates.**

## Step 5: VERIFICATION GATES

Execute in order: **tests > checklist > build**

### Gate 1: Tests

```bash
{testCommand from config, or auto-detect}
```

**Pass criteria:**
- Exit code 0
- 0 failures in output
- Show actual output as evidence

**If fail: HARD STOP**
- Show test output
- Report which tests failed
- Do not proceed

### Gate 2: Checklist

Walk through task acceptance criteria:

```
Acceptance Criteria:
- [x] Criterion 1 - VERIFIED: {evidence}
- [x] Criterion 2 - VERIFIED: {evidence}
- [ ] Criterion 3 - FAILED: {what's missing}
```

**If any unchecked: HARD STOP**

### Gate 3: Build

```bash
{buildCommand from config, or auto-detect}
```

**Pass criteria:**
- Exit code 0
- No errors in output

**If fail: HARD STOP**

## Step 6: COMPLETE

All gates passed:

1. Update tracker:

```
plan_tracker_ide:
  action: update
  index: {N-1}
  status: complete
```

2. Save to memctx:

```
memctx_save:
  type: action
  title: {feature} Task {N} Complete
  path: 40-actions/YYYY-MM-DD-{feature}-task-{N}.md
  content: |
    # Task {N}: {name}
    
    Spec: [[20-context/{feature}-spec]]
    Tasks: [[60-observations/{feature}-tasks#task-{N}]]
    
    ## What was built
    {summary of changes}
    
    ## Files changed
    - {file1}
    - {file2}
    
    ## Verification
    - Tests: PASS
    - Checklist: PASS
    - Build: PASS
  tags: [sdlc, task, {feature}]
```

3. Commit:

```bash
git add .
git commit -m "feat({feature}): complete task {N} - {name}"
```

4. Advance:

**If `autoAdvance: true` and more tasks:**
- "Task {N} complete. Advancing to Task {N+1}..."
- Go to Step 2 (PRE-CHECK) for next task

**If `autoAdvance: false`:**
- "Task {N} complete. Say 'next' to continue."
- Wait for user

**If no more tasks:**
- "All tasks complete. Ready for final verification."
- Suggest: `/skill:sdlc-verify`

## Plan Tracker Rules

**Trigger only on state changes:**
- `in_progress` - when starting implementation (Step 3)
- `complete` - when all gates pass (Step 6)

**Never trigger:**
- During coding
- During verification
- On partial progress

## Hard Stop Protocol

On any failure:

1. **Stop immediately** - no further tasks
2. **Report clearly:**
   - Which gate failed
   - Exact error/output
   - Which criterion unmet
3. **Wait for resolution** - do not guess or retry automatically
4. **After fix:** Re-run failed gate, then continue

## Config Reference

```json
{
  "autoAdvance": false,    // wait for user between tasks
  "gates": ["tests", "checklist", "build"],
  "gateOrder": "tests > checklist > build",
  "onFail": "stop",        // hard stop on failure
  "testCommand": "npm test",
  "buildCommand": "npm run build"
}
```

## Handoff

After all tasks complete:

**"All {N} tasks complete and verified.**

**Ready for final verification?**
- **Yes:** Use `/skill:sdlc-verify`
- **No:** Review changes first, then verify"
