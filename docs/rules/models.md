# Model Selection Guide

> Right model for each SDLC phase. Based on benchmarks and real-world performance.

## TL;DR

| Phase | Best Model | Fallback | Why |
|-------|------------|----------|-----|
| **Spec/Planning** | opus | sonnet | Complex reasoning, architecture decisions |
| **Execute** | sonnet | haiku | Balance of speed + quality for coding |
| **Review** | opus | sonnet | Catches subtle issues, holistic view |
| **Test/Verify** | haiku | sonnet | Fast, good enough for verification |

## Phase Details

### 1. Spec & Planning (`sdlc-spec`, `sdlc-plan`)

**Best:** Claude Opus series (4.7 > 4.6 > 4.5)

```
Primary:   claude-opus-4-7, opus-4.7, opus
Fallback:  claude-sonnet-4-6, sonnet-4.6, sonnet
```

**Why Opus for planning:**
- Best frontier task planning (Anthropic benchmark)
- 1M token context for full codebase analysis
- Sustains coherence across multi-file architecture decisions
- SWE-bench: Opus 80.8% vs Sonnet 79.6%

**When Sonnet OK:**
- Simple feature specs
- Well-defined requirements
- Budget constraints

### 2. Execution (`sdlc-execute`)

**Best:** Claude Sonnet series (4.6 > 4.5)

```
Primary:   claude-sonnet-4-6, sonnet-4.6, sonnet
Fallback:  claude-haiku-4-5, haiku-4.5, haiku
```

**Why Sonnet for execution:**
- ~98% of Opus coding quality at 1/5 cost
- Faster iteration cycles
- Good for single-file and small multi-file changes
- SWE-bench: 79.6% (vs Opus 80.8% - minimal gap)

**When Opus needed:**
- Complex refactoring (8+ files)
- Interdependent changes across modules
- Need full-picture coherence

**When Haiku OK:**
- Simple bug fixes
- Boilerplate generation
- Well-defined small tasks

### 3. Code Review (`sdlc-verify`, spec review)

**Best:** Claude Opus series

```
Primary:   claude-opus-4-6, opus-4.6, opus
Fallback:  claude-sonnet-4-6, sonnet-4.6, sonnet
```

**Why Opus for review:**
- Better at catching subtle issues
- Holistic view of multi-file diffs
- Security and logic error detection
- Opus 4.6 specifically improved for code review (Anthropic)

**When Sonnet OK:**
- Small PRs (< 5 files)
- Straightforward changes
- Time-critical reviews

### 4. Testing & Verification

**Best:** Claude Haiku (speed) or Sonnet (thoroughness)

```
Primary:   claude-haiku-4-5, haiku-4.5, haiku
Fallback:  claude-sonnet-4-6, sonnet-4.6, sonnet
```

**Why Haiku for verification:**
- Fast execution (test runs, build checks)
- Good enough for pass/fail verification
- Cost-effective for high-volume checks

**When Sonnet/Opus needed:**
- Complex test generation
- Debugging test failures
- Test architecture decisions

## Model ID Patterns

Pi supports multiple providers. Common patterns:

```
# Anthropic direct
anthropic/claude-opus-4-7
anthropic/claude-sonnet-4-6
anthropic/claude-haiku-4-5

# Short aliases (provider-agnostic)
opus, opus-4.7, opus-4.6
sonnet, sonnet-4.6, sonnet-4.5
haiku, haiku-4.5

# With thinking level
opus:high, sonnet:high
opus:xhigh  # max reasoning

# Provider-specific (local proxy, etc.)
local-llm/cc/claude-opus-4-7
local-llm/gh/claude-sonnet-4.6
```

## Alternative Models

When Claude unavailable:

| Task | Alternative | Notes |
|------|-------------|-------|
| Planning | GPT-5, Gemini 2.5 Pro | Strong reasoning |
| Execution | GPT-5 Codex, DeepSeek V3 | Good coding |
| Review | GPT-5, Gemini 2.5 Pro | Holistic analysis |
| Verification | GPT-4o, Gemini Flash | Fast + capable |

## Cost Considerations

| Model | Relative Cost | Best For |
|-------|---------------|----------|
| Opus | $$$$ | Planning, complex review |
| Sonnet | $$ | Most coding tasks |
| Haiku | $ | Verification, simple tasks |

**Rule of thumb:**
- >60% of tasks → Haiku (simple, high-volume)
- ~30% of tasks → Sonnet (balanced)
- ~10% of tasks → Opus (complex, high-stakes)
