# pi-sdlc

SDLC workflow extension for [Pi](https://pi.dev). Proven pipeline inspired by [pi-superagents](https://github.com/teelicht/pi-superagents) with rule-based guidance.

## Features

- **Phased Workflow**: spec → plan → execute → verify
- **Auto Model Switching**: Each phase uses appropriate model tier
- **Rule-Based Guidance**: AI loads relevant rules from `docs/rules/` per task type
- **Drift Detection**: Pre-check and post-check on every task
- **Verification Gates**: tests > checklist > build with hard stop on failure
- **Memory Integration**: Syncs specs and completions to pi-memctx

## Installation

```bash
pi install git:github.com/igun997/pi-sdlc
```

Requires [pi-memctx](https://github.com/example/pi-memctx) for durable memory.

## Commands

| Command | Phase | Purpose |
|---------|-------|---------|
| `/sdlc-spec <idea>` | Spec | Brainstorm and create feature specification |
| `/sdlc-plan` | Plan | Break spec into ordered tasks |
| `/sdlc-execute` | Execute | Implement tasks with verification gates |
| `/sdlc-verify` | Verify | Final verification with evidence report |
| `/sdlc-settings` | Config | Configure model tiers interactively |

## Model Tiers

Agents use abstract tiers mapped to concrete models:

| Tier | Phase | Default Model |
|------|-------|---------------|
| `reasoning` | Spec, Plan | anthropic/claude-opus-4-7 |
| `coding` | Execute | anthropic/claude-sonnet-4-6 |
| `fast` | Verify | openai/gpt-4o-mini |

Configure in `sdlc.config.json`:

```json
{
  "sdlc": {
    "modelTiers": {
      "reasoning": { "model": "local-llm/alibaba/qwen-max", "thinking": "high" },
      "coding": { "model": "local-llm/alibaba/qwen3-coder-plus" },
      "fast": { "model": "local-llm/alibaba/qwen-flash" }
    }
  }
}
```

## Rules

Rules are loaded by AI based on task type:

| Task Type | Rules |
|-----------|-------|
| Backend | `backend/tdd.md`, `backend/api-design.md` |
| Frontend | `frontend/anti-slop.md`, `frontend/components.md` |
| Go | `golang/patterns.md` |
| Rust | `rust/patterns.md` |
| Performance | `performance/low-latency.md` |

Rules live in `docs/rules/`. AI reads only relevant rules, minimizing token usage.

## Workflow

### 1. Spec Phase

```
/sdlc-spec Add user authentication with OAuth
```

- One question at a time
- Creates `docs/specs/YYYY-MM-DD-{feature}/spec.md`
- Syncs to memctx

### 2. Plan Phase

```
/sdlc-plan
```

- Breaks spec into ordered tasks
- Assigns task types: backend | frontend | mixed
- Initializes plan tracker

### 3. Execute Phase

```
/sdlc-execute
```

- Pre-check: confirm understanding
- Implement: follow rules by type
- Post-check: detect drift
- Gates: tests > checklist > build
- Hard stop on failure

### 4. Verify Phase

```
/sdlc-verify
```

- Full test suite
- Walk every acceptance criterion
- Generate verification report
- Mark spec complete

## Configuration

### Project Config

`sdlc.config.json` in project root:

```json
{
  "sdlc": {
    "commands": {
      "sdlc-execute": {
        "autoAdvance": false,
        "useTDD": true,
        "gates": ["tests", "checklist", "build"],
        "onFail": "stop"
      }
    },
    "modelTiers": {
      "reasoning": { "model": "anthropic/claude-opus-4-7" },
      "coding": { "model": "openai/gpt-4o" },
      "fast": { "model": "openai/gpt-4o-mini" }
    }
  }
}
```

### Design References

For frontend tasks, create `_references/` folder with:
- `README.md` - Brand voice, visual foundations
- `colors_and_type.css` - Design tokens
- `ui_kits/` - Component patterns

Anti-slop rules require AI to reference these before creating UI.

## Comparison with pi-superagents

| Feature | pi-superagents | pi-sdlc |
|---------|---------------|---------|
| Workflow | Superpowers | SDLC (spec→plan→execute→verify) |
| Agents | sp-recon, sp-implementer, etc. | Phase-based entrypoints |
| Rules | Skills injection | Rule files loaded by task type |
| Subagents | Bounded role delegation | Single agent per phase |
| Review | Plannotator integration | Verification gates |

## Credits

- [pi-superagents](https://github.com/teelicht/pi-superagents) for the proven architecture pattern
- [Pi](https://pi.dev) for the foundation
