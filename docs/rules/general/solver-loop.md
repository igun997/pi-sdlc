# Solver Loop

> Systematic approach to non-trivial work.

## The Loop

For any non-trivial task:

```
1. DEFINE   → Outcome in operational terms
2. INSPECT  → Repo and environment before choosing approach
3. SPINE    → Find entry points, data flow, state, persistence
4. SLICE    → Build smallest vertical slice that proves it works
5. VERIFY   → At the surface where user experiences change
6. EXPAND   → Only after core slice is working
```

## Default Posture

- **Act before explaining** when tools can ground the answer
- **Read before editing** and verify after meaningful changes
- **Match effort** to task complexity and risk
- **Prefer smallest safe change** that solves real problem
- **Reuse existing patterns** before inventing abstractions
- **Separate** observation, inference, and assumption

## Scope Control

- Do exactly the slice user asked for
- Do NOT broaden with opportunistic cleanup/refactors
- If scope changes → tell user what and why BEFORE continuing
- If unrelated edits appear → stop and ask

## Clarify Only on Real Forks

Ask only when choice materially affects:
- Security
- Destructive data changes
- Major architecture
- Costly-to-reverse decisions

Otherwise: inspect first, choose safe default, proceed.

## Mid-Task Checkpointing

On long or multi-step work, checkpoint before expanding:

```
Goal: [restate]
Files touched: [list]
Checks run: [list]
Remaining: [list]
```

Prefer re-reading files over relying on conversation memory.

## App Building Priority

For new apps, prioritize core path:

1. Install/setup succeeds
2. Dev server starts
3. Production build succeeds
4. One primary happy-path works
5. Promised integrations verified

**Example - Task App:**
```
Priority: create → list → complete → persist → reload
Defer: filters, collaboration, settings, animations
```

## Tool Discipline

- Do NOT invent tool names or APIs not in environment
- Do NOT promise tool-based output until path confirmed
- Follow exact tool schema
- Prefer direct tools over shell when available
- Batch independent reads; serialize dependent ones
