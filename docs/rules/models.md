# Model Selection Guide

SDLC extension auto-switches models based on skill phase and configured tier.

## Quick Start

```bash
# Configure interactively
/sdlc-choose

# Quick tier switch
/sdlc-tier high

# Direct model switch
/sdlc-model anthropic/claude-sonnet-4-6
```

## Model ID Format

**Always use full `provider/model` format** to avoid conflicts with proxies:

```
anthropic/claude-opus-4-7
google/gemini-2.5-pro
openai/gpt-4o
deepseek/deepseek-r1
local-llm/alibaba/qwen-max
```

Run `pi --list-models` to see exact IDs for your setup.

## Default Tiers

| Phase | 💎 High | ⚡ Medium | 💰 Budget |
|-------|---------|----------|-----------|
| Spec/Plan | anthropic/claude-opus-4-7 | google/gemini-2.5-pro | deepseek/deepseek-r1 |
| Execute | anthropic/claude-sonnet-4-6 | openai/gpt-4o | deepseek/deepseek-coder-v3 |
| Verify | anthropic/claude-sonnet-4-6 | openai/gpt-4o-mini | google/gemini-flash |

## Phase Requirements

### Spec/Plan (Reasoning)

Needs: long-context, strong reasoning, architecture understanding.

Best: Claude Opus, Gemini 2.5 Pro, DeepSeek R1, o1/o3.

### Execute (Coding)

Needs: code generation, tool use, fast iteration.

Best: Claude Sonnet, GPT-4o, DeepSeek Coder, Qwen Coder.

### Verify (Review)

Needs: fast, accurate, checklist verification.

Best: Claude Sonnet, GPT-4o-mini, Gemini Flash.

## Priority Order

```
--model flag > SDLC_TIER env > sdlc.config.json > default (medium)
```

## Configuration

### Environment Variable

```bash
export SDLC_TIER=budget
```

### Project Config

`sdlc.config.json`:

```json
{
  "tier": "medium",
  "models": {
    "medium": {
      "spec": "google/gemini-2.5-pro",
      "plan": "google/gemini-2.5-pro",
      "execute": "openai/gpt-4o",
      "verify": "openai/gpt-4o-mini"
    }
  }
}
```

### Custom Tiers

Create custom tiers via `/sdlc-choose` → "Save as custom tier", or edit config directly:

```json
{
  "tier": "local",
  "models": {
    "local": {
      "spec": "local-llm/alibaba/qwen-max",
      "plan": "local-llm/alibaba/qwen-max",
      "execute": "local-llm/alibaba/qwen3-coder-plus",
      "verify": "local-llm/alibaba/qwen-flash"
    }
  }
}
```
