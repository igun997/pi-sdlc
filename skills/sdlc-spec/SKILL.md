---
name: sdlc-spec
description: Create feature specs through collaborative brainstorming. Use when starting new features, writing requirements, or defining acceptance criteria.
model: opus, sonnet
---

> **Related skills:** After spec complete, use `/skill:sdlc-plan` to break down into tasks.
>
> **Recommended model:** Opus (complex reasoning, architecture). Sonnet OK for simple specs.

# SDLC Spec

## Overview

Turn raw ideas into fully formed specs with acceptance criteria. Brainstorm one question at a time, then write structured spec with testable requirements.

**Announce at start:** "I'm using the sdlc-spec skill to create a feature specification."

**Dependency:** Requires pi-memctx for durable memory sync.

## The Process

### Step 1: Understand the Idea

1. Check current project state (files, docs, recent commits)
2. **Check for `_references/` folder** - if exists, read README.md for brand context
3. Ask questions **one at a time** to refine the idea
4. Prefer multiple choice when possible
5. Focus on: purpose, constraints, success criteria, out of scope

**For features with UI, ask:**
- Does `_references/` folder exist? If yes, we use those design tokens.
- If no, which existing components should we match?

### Step 2: Explore Approaches

1. Propose 2-3 different approaches with trade-offs
2. Lead with your recommendation and reasoning
3. Get user alignment before proceeding

### Step 3: Write the Spec

Present in sections (200-300 words each), validate after each:

1. **Goal** - one sentence describing what this builds
2. **Requirements** - numbered list of what must be true
3. **Acceptance Criteria** - testable conditions for "done"
4. **Out of Scope** - explicitly excluded features (YAGNI)
5. **Technical Approach** - high-level architecture

### Step 4: Create Config

Create `config.json` with execution settings:

```json
{
  "autoAdvance": false,
  "gates": ["tests", "checklist", "build"],
  "gateOrder": "tests > checklist > build",
  "onFail": "stop",
  "testCommand": "npm test",
  "buildCommand": "npm run build"
}
```

Ask user about `autoAdvance` preference.

### Step 5: Save and Sync

1. Create spec directory: `docs/specs/YYYY-MM-DD-{feature}/`
2. Write `spec.md` using template
3. Write `config.json`
4. Sync summary to memctx:

```
memctx_save:
  type: context
  title: {feature} Spec
  path: 20-context/{feature}-spec.md
  content: [spec summary + acceptance criteria]
  tags: [sdlc, spec, {feature}]
```

5. Commit to git:

```bash
git add docs/specs/YYYY-MM-DD-{feature}/
git commit -m "docs: add {feature} specification"
```

## Spec Template

Use template from `templates/spec.md`:

```markdown
# {Feature Name} Specification

**Created:** YYYY-MM-DD
**Status:** Draft | Ready | In Progress | Complete

## Goal

[One sentence describing what this builds]

## Requirements

1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

## Acceptance Criteria

- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]

## Out of Scope

- [Explicitly excluded 1]
- [Explicitly excluded 2]

## Technical Approach

[2-3 paragraphs on architecture, key decisions, dependencies]

## Dependencies

- [External dependency 1]
- [Internal dependency 1]

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk 1] | High/Med/Low | [Mitigation] |
```

## Key Principles

- **One question at a time** - don't overwhelm
- **Multiple choice preferred** - easier to answer
- **YAGNI ruthlessly** - remove unnecessary features
- **Testable criteria** - every criterion must be verifiable
- **Incremental validation** - validate each section

## Handoff

After spec saved and committed:

**"Spec complete and saved to `docs/specs/YYYY-MM-DD-{feature}/spec.md`.**

**Ready to break down into tasks?**
- **Yes:** Use `/skill:sdlc-plan`
- **No:** Spec is ready for later planning"
