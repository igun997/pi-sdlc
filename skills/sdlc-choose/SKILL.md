---
name: sdlc-choose
description: Configure SDLC model tiers. Interactive TUI via /sdlc-choose, quick switch via /sdlc-tier.
---

# SDLC Choose

> **This skill documents extension commands.** The TUI is in `extensions/sdlc-choose.ts`.

## Commands

### /sdlc-choose

Interactive TUI for model configuration:

```
/sdlc-choose              # Open menu
/sdlc-choose show         # Show current
/sdlc-choose high         # Quick set tier
/sdlc-choose list         # List available models
```

### /sdlc-tier

Quick tier switch:

```
/sdlc-tier                # Show current
/sdlc-tier high           # Set tier
/sdlc-tier budget
```

### /sdlc-model

Direct model switch:

```
/sdlc-model local-llm/alibaba/qwen-max
/sdlc-model anthropic/claude-sonnet-4-6
```

## Auto Model Switch

Extension auto-switches model when SDLC skills invoked:

| Skill | Config Key | Purpose |
|-------|------------|---------|
| `/skill:sdlc-spec` | `models.{tier}.spec` | Reasoning, planning |
| `/skill:sdlc-plan` | `models.{tier}.plan` | Task breakdown |
| `/skill:sdlc-execute` | `models.{tier}.execute` | Coding |
| `/skill:sdlc-verify` | `models.{tier}.verify` | Review, testing |

## Config File

`sdlc.config.json` in project root:

```json
{
  "tier": "medium",
  "models": {
    "high": {
      "spec": "anthropic/claude-opus-4-7",
      "plan": "anthropic/claude-opus-4-6",
      "execute": "anthropic/claude-sonnet-4-6",
      "verify": "anthropic/claude-sonnet-4-6"
    },
    "medium": {
      "spec": "google/gemini-2.5-pro",
      "plan": "google/gemini-2.5-pro",
      "execute": "openai/gpt-4o",
      "verify": "openai/gpt-4o-mini"
    },
    "budget": {
      "spec": "deepseek/deepseek-r1",
      "plan": "deepseek/deepseek-r1",
      "execute": "deepseek/deepseek-coder-v3",
      "verify": "google/gemini-flash"
    }
  }
}
```

## Model ID Format

Use **full provider/model ID** to avoid conflicts with proxies:

```
# Format: provider/model-id
local-llm/alibaba/qwen-max
anthropic/claude-sonnet-4-6
google/gemini-2.5-pro
openai/gpt-4o
```

Run `/sdlc-choose list` or `pi --list-models` to see available IDs.

## Environment Override

```bash
export SDLC_TIER=budget
SDLC_TIER=high pi "/skill:sdlc-spec"
```

## Status Bar

Shows `SDLC: {tier}` when `sdlc.config.json` exists.
