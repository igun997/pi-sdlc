# AGENTS.md

Instructions for AI agents working in this repository.

## Overview

pi-sdlc is a pi extension providing SDLC skills: spec → plan → execute → verify.

## Key Files

- `skills/*/SKILL.md` - skill definitions (read these for behavior)
- `docs/rules/` - development rules (MUST READ)
  - `GENERAL.md` - universal rules for all code
  - `BACKEND.md` - TDD, SOLID, API design, security
  - `FRONTEND.md` - anti-slop, components, a11y, security
- `templates/` - spec, task, config templates
- `package.json` - pi extension manifest
- `docs/plans/` - design documents

## Skill Flow

```
sdlc-spec → sdlc-plan → sdlc-execute → sdlc-verify
```

Each skill hands off to the next. Follow the flow.

## Dependencies

- **pi-memctx** - required for memory sync
- **plan_tracker_ide** - built into pi, wrap don't replace

## Conventions

- Specs go in `docs/specs/YYYY-MM-DD-{feature}/`
- Tasks numbered `01-`, `02-`, etc.
- Config per feature in `config.json`
- All criteria must be testable
- Hard stop on any verification failure

## Code Quality Rules

### Backend: TDD Mandatory

```
RED → GREEN → REFACTOR
```

- Write test BEFORE implementation
- Show failing test (red) before writing code
- Show passing test (green) after implementation
- Never skip the red phase
- "I'll add tests later" = violation

### Frontend: Anti-Slop Mandatory

**AI Slop = generic AI-generated UI patterns:**
- Purple-blue gradients
- Glassmorphism cards
- Inter font defaults
- Cookie-cutter layouts
- Buzzword copy

**Rules:**
1. Find 3+ existing components before creating new
2. Use project design tokens, not defaults
3. Match existing patterns exactly
4. No invented aesthetics
5. When unsure, ASK user

**Violations:**
- Ignoring existing codebase patterns
- Inventing new design language
- Generic placeholder copy
- "Looks modern" without reference

## Testing Changes

After modifying skills:
1. Test in real pi session with `-e pi-sdlc`
2. Walk through full flow: spec → plan → execute → verify
3. Verify memctx sync works
4. Verify plan_tracker updates correctly

## Commit Style

```
feat(skill): add feature
fix(skill): fix bug
docs: update documentation
```
