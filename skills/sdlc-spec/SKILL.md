---
name: sdlc-spec
description: Create feature specs through collaborative brainstorming. Use when starting new features, writing requirements, or defining acceptance criteria.
---

> **Model auto-switch:** Extension switches to spec-tier model automatically.
>
> **Configure:** `/sdlc-choose` to set models. `/sdlc-tier` for quick switch.
>
> **Next:** After spec complete, use `/skill:sdlc-plan` to break down into tasks.

# SDLC Spec

## Overview

Turn raw ideas into specs with testable acceptance criteria. One question at a time.

**Dependency:** Requires pi-memctx.

## Process

### Step 0: Check Approval

First, check if spec phase already approved:

```
plan_tracker_ide:
  action: check_approval
  phase: spec
```

If **APPROVED**, skip questioning and proceed directly to Step 5 (Save) or handoff. Do not re-ask questions for approved phases.

### Step 1: Understand

1. Check project state (files, docs, commits)
2. **Check for `_references/`** - if exists, read for brand context
3. Ask questions **one at a time**, prefer multiple choice
4. Focus: purpose, constraints, success criteria, out of scope

### Step 2: Explore Approaches

1. Propose 2-3 approaches with trade-offs
2. Lead with recommendation
3. Get alignment before proceeding

### Step 3: Write Spec

Present in sections (200-300 words), validate each:

1. **Goal** - one sentence
2. **Requirements** - numbered list
3. **Acceptance Criteria** - testable conditions
4. **Out of Scope** - YAGNI
5. **Technical Approach** - high-level architecture

### Step 4: Create Config

```json
{
  "autoAdvance": false,
  "gates": ["tests", "checklist", "build"],
  "onFail": "stop",
  "testCommand": "npm test",
  "buildCommand": "npm run build"
}
```

### Step 5: Save

1. Create `docs/specs/YYYY-MM-DD-{feature}/`
2. Write `spec.md` and `config.json`
3. Sync to memctx:

```
memctx_save:
  type: context
  title: {feature} Spec
  path: 20-context/{feature}-spec.md
  tags: [sdlc, spec, {feature}]
```

4. **Approve phase** (prevents re-asking):

```
plan_tracker_ide:
  action: approve
  phase: spec
  summary: "{feature} spec complete with N criteria"
```

5. Commit:

```bash
git add docs/specs/YYYY-MM-DD-{feature}/
git commit -m "docs: add {feature} specification"
```

## Spec Template

```markdown
# {Feature Name} Specification

**Created:** YYYY-MM-DD
**Status:** Draft | Ready | In Progress | Complete

## Goal
[One sentence]

## Requirements
1. [Requirement 1]
2. [Requirement 2]

## Acceptance Criteria
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]

## Out of Scope
- [Excluded 1]

## Technical Approach
[Architecture, decisions, dependencies]
```

## Principles

- **One question at a time**
- **Multiple choice preferred**
- **YAGNI ruthlessly**
- **Testable criteria only**

## Handoff

After save:

> Spec complete: `docs/specs/YYYY-MM-DD-{feature}/spec.md`
>
> Ready to plan? → `/skill:sdlc-plan`
