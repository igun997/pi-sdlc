---
name: sdlc-choose
description: Configure SDLC model tiers. Use /sdlc-choose command for interactive TUI or /sdlc-tier for quick switching.
---

# SDLC Choose

> **This skill documents the `/sdlc-choose` extension command.**
>
> The actual interactive UI is provided by `extensions/sdlc-choose.ts`.

## Commands

### Interactive Configuration

```bash
/sdlc-choose              # Open interactive TUI menu
/sdlc-choose show         # Show current config
/sdlc-choose high         # Quick set tier to high
/sdlc-choose budget       # Quick set tier to budget
/sdlc-choose list         # List available models
```

### Quick Tier Switch

```bash
/sdlc-tier                # Show current tier
/sdlc-tier high           # Set to high tier
/sdlc-tier medium         # Set to medium tier
/sdlc-tier budget         # Set to budget tier
```

## Interactive Menu

When running `/sdlc-choose` without arguments:

1. **Set tier** - Choose high/medium/budget presets
2. **Customize models** - Pick specific models per phase
3. **Show current** - Display current configuration
4. **Save as custom tier** - Save current models as named tier

## Default Tiers

| Tier | Spec/Plan | Execute | Verify |
|------|-----------|---------|--------|
| 💎 `high` | claude-opus-4-7 | claude-sonnet-4-6 | claude-sonnet-4-6 |
| ⚡ `medium` | gemini-2.5-pro | gpt-4o | gpt-4o-mini |
| 💰 `budget` | deepseek-r1 | deepseek-coder-v3 | gemini-flash |

## Configuration File

Saves to `sdlc.config.json` in project root:

```json
{
  "tier": "medium",
  "models": {
    "high": {
      "spec": "claude-opus-4-7",
      "plan": "claude-opus-4-6",
      "execute": "claude-sonnet-4-6",
      "verify": "claude-sonnet-4-6"
    },
    "medium": {
      "spec": "gemini-2.5-pro",
      "plan": "gemini-2.5-pro",
      "execute": "gpt-4o",
      "verify": "gpt-4o-mini"
    },
    "budget": {
      "spec": "deepseek-r1",
      "plan": "deepseek-r1",
      "execute": "deepseek-coder-v3",
      "verify": "gemini-flash"
    }
  }
}
```

## Environment Variable

Override config with `SDLC_TIER`:

```bash
export SDLC_TIER=budget
SDLC_TIER=high pi "/skill:sdlc-spec"
```

## Status Bar

Shows current tier in footer when `sdlc.config.json` exists.
