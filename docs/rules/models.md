# Model Selection Guide

> Three tiers: **High** (best quality), **Medium** (balanced), **Budget** (cost-effective).

## Set Tier

```bash
# Environment variable (session)
export SDLC_TIER=medium   # high | medium | budget

# Per-command
SDLC_TIER=budget pi "/skill:sdlc-execute"

# Project config (sdlc.config.json)
{
  "tier": "high"
}

# Override with specific model (ignores tier)
pi --model deepseek-coder "/skill:sdlc-execute"
```

**Priority:** `--model` flag > `SDLC_TIER` env > `sdlc.config.json` > default (medium)

---

## Quick Reference

| Phase | High 💎 | Medium ⚡ | Budget 💰 |
|-------|---------|----------|-----------|
| **Spec/Planning** | claude-opus | gemini-2.5-pro | deepseek-r1 |
| **Execute** | claude-sonnet | gpt-4o | deepseek-coder |
| **Review** | claude-opus | gemini-2.5-pro | qwen-coder |
| **Verify** | claude-sonnet | gpt-4o-mini | gemini-flash |

---

## Tier Details

### 💎 High Tier (Best Quality)

**When:** Production features, complex architecture, security-critical code.

| Phase | Primary | Fallback |
|-------|---------|----------|
| Spec/Plan | `claude-opus-4-7` | `claude-opus-4-6` |
| Execute | `claude-sonnet-4-6` | `claude-sonnet-4-5` |
| Review | `claude-opus-4-6` | `claude-sonnet-4-6` |
| Verify | `claude-sonnet-4-6` | `claude-haiku-4-5` |

**Strengths:**
- SWE-bench: Opus 80.8%, Sonnet 79.6%
- Best coherence across multi-file changes
- Superior code review (catches subtle issues)

**Cost:** $$$$

---

### ⚡ Medium Tier (Balanced)

**When:** Regular development, good quality without premium cost.

| Phase | Primary | Fallback |
|-------|---------|----------|
| Spec/Plan | `gemini-2.5-pro` | `gpt-4o` |
| Execute | `gpt-4o` | `gemini-2.5-flash` |
| Review | `gemini-2.5-pro` | `gpt-4o` |
| Verify | `gpt-4o-mini` | `gemini-2.5-flash` |

**Strengths:**
- Gemini: 1M+ context window, fast
- GPT-4o: Strong coding, good ecosystem
- Good balance of speed and quality

**Cost:** $$

---

### 💰 Budget Tier (Cost-Effective)

**When:** Prototyping, high-volume tasks, learning projects.

| Phase | Primary | Fallback |
|-------|---------|----------|
| Spec/Plan | `deepseek-r1` | `qwen-max` |
| Execute | `deepseek-coder-v3` | `qwen-coder-plus` |
| Review | `qwen-coder-plus` | `deepseek-r1` |
| Verify | `gemini-flash` | `deepseek-coder` |

**Strengths:**
- DeepSeek R1: Strong reasoning, very cheap
- DeepSeek Coder V3: Excellent for code generation
- Qwen Coder: Good multi-language support
- Gemini Flash: Fast verification

**Cost:** $

---

## Model IDs by Provider

### Anthropic (Claude)
```
claude-opus-4-7, claude-opus-4-6, claude-opus-4-5
claude-sonnet-4-6, claude-sonnet-4-5
claude-haiku-4-5
```

### Google (Gemini)
```
gemini-2.5-pro, gemini-2.5-flash
gemini-2.0-flash, gemini-2.0-flash-lite
```

### OpenAI
```
gpt-4o, gpt-4o-mini
gpt-4-turbo, gpt-3.5-turbo
o1, o1-mini, o3-mini
```

### DeepSeek
```
deepseek-r1, deepseek-r1-lite
deepseek-coder-v3, deepseek-v3
```

### Alibaba (Qwen)
```
qwen-max, qwen-plus, qwen-turbo
qwen-coder-plus, qwen-coder-turbo
qwen3-235b-a22b
```

---

## Usage Examples

```bash
# High tier - production feature
pi --model claude-opus "/skill:sdlc-spec"
pi --model claude-sonnet "/skill:sdlc-execute"

# Medium tier - regular development  
pi --model gemini-2.5-pro "/skill:sdlc-spec"
pi --model gpt-4o "/skill:sdlc-execute"

# Budget tier - prototyping
pi --model deepseek-r1 "/skill:sdlc-spec"
pi --model deepseek-coder "/skill:sdlc-execute"

# Mixed - optimize per phase
pi --model deepseek-r1 "/skill:sdlc-plan"      # cheap planning
pi --model claude-sonnet "/skill:sdlc-execute" # quality execution
pi --model gemini-flash "/skill:sdlc-verify"   # fast verification
```

---

## Benchmark Reference

| Model | SWE-bench | Cost/1M tokens | Best For |
|-------|-----------|----------------|----------|
| Claude Opus 4.7 | 80.8% | $15/$75 | Planning, review |
| Claude Sonnet 4.6 | 79.6% | $3/$15 | Coding |
| GPT-4o | ~74% | $2.5/$10 | Balanced |
| Gemini 2.5 Pro | 63.8% | $1.25/$5 | Long context |
| DeepSeek R1 | ~70%* | $0.55/$2.19 | Reasoning |
| DeepSeek Coder V3 | ~75%* | $0.27/$1.10 | Coding |

*Estimated from community benchmarks

---

## Decision Tree

```
Is this production/security-critical?
├─ Yes → High tier (Claude)
└─ No
   ├─ Need long context (>100k tokens)?
   │  └─ Yes → Gemini 2.5 Pro
   └─ No
      ├─ Budget constrained?
      │  └─ Yes → Budget tier (DeepSeek/Qwen)
      └─ No → Medium tier (GPT-4o/Gemini)
```

---

## Config Template

Add to `templates/config.json`:

```json
{
  "tier": "medium",
  "models": {
    "high": {
      "spec": "claude-opus-4-7",
      "plan": "claude-opus-4-6", 
      "execute": "claude-sonnet-4-6",
      "review": "claude-opus-4-6",
      "verify": "claude-sonnet-4-6"
    },
    "medium": {
      "spec": "gemini-2.5-pro",
      "plan": "gemini-2.5-pro",
      "execute": "gpt-4o",
      "review": "gemini-2.5-pro",
      "verify": "gpt-4o-mini"
    },
    "budget": {
      "spec": "deepseek-r1",
      "plan": "deepseek-r1",
      "execute": "deepseek-coder-v3",
      "review": "qwen-coder-plus",
      "verify": "gemini-flash"
    }
  }
}
```
