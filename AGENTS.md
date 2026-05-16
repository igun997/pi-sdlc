# AGENTS.md

Instructions for AI agents working in this repository.

## Overview

pi-sdlc is a pi extension providing SDLC skills: spec → plan → execute → verify.

## Key Files

- `skills/*/SKILL.md` - skill definitions (read these for behavior)
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
