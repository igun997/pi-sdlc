# pi-sdlc Design

> SDLC skills for pi-agents: spec → plan → execute → verify with drift detection

## Overview

4 phased skills using pi-memctx for durable memory:

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  sdlc-spec  │───▶│  sdlc-plan  │───▶│ sdlc-execute │───▶│ sdlc-verify  │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘
      │                  │                   │                   │
      ▼                  ▼                   ▼                   ▼
   docs/specs/       docs/plans/      plan_tracker_ide      evidence chain
      │                  │                   │                   │
      └──────────────────┴───────────────────┴───────────────────┘
                                │
                                ▼
                    memctx (20-context/, 60-observations/)
```

## Design Goals

Address two key concerns with current approaches:

1. **Plan drift** - implementation diverges from spec
2. **Verification gaps** - claims "done" without proper checks

Solutions:
- Pre-check intent before each task
- Post-check result after each task
- Layered verification gates: tests > checklist > build
- Hard stop on any gate failure

## File Structure

### Extension Structure

```
pi-sdlc/
├── skills/
│   ├── sdlc-spec/
│   │   └── SKILL.md
│   ├── sdlc-plan/
│   │   └── SKILL.md
│   ├── sdlc-execute/
│   │   └── SKILL.md
│   └── sdlc-verify/
│       └── SKILL.md
├── templates/
│   ├── spec.md
│   ├── task.md
│   └── plan-config.md
├── package.json
├── AGENTS.md
└── README.md
```

### Project Using pi-sdlc

```
project/
├── docs/
│   ├── specs/
│   │   └── 2026-05-16-feature-x/
│   │       ├── spec.md
│   │       ├── config.json
│   │       └── tasks/
│   │           ├── 01-setup.md
│   │           ├── 02-core.md
│   │           └── 03-tests.md
│   └── plans/
│       └── 2026-05-16-feature-x-plan.md
└── packs/
    └── project/
        ├── 20-context/
        │   └── feature-x-spec.md
        └── 60-observations/
            └── feature-x-tasks.md
```

## Skills

### sdlc-spec

**Trigger:** "create spec", "new feature", "write requirements"

**Steps:**
1. Brainstorm with user (one question at a time)
2. Write spec: Goal, Requirements, Acceptance Criteria, Out of Scope
3. Create config.json (autoAdvance, gates)
4. Sync summary to memctx `20-context/{feature}-spec.md`
5. Commit spec to git

### sdlc-plan

**Trigger:** "create plan", "break down spec", "plan tasks"

**Steps:**
1. Read spec from docs/ or recall from memctx
2. Break into ordered tasks with:
   - Description
   - Acceptance criteria (testable)
   - Dependencies
   - Estimated scope (S/M/L)
3. Write task files: `01-name.md`, `02-name.md`, ...
4. Sync task index to memctx `60-observations/{feature}-tasks.md`
5. Init plan_tracker with task names
6. Commit plan to git

### sdlc-execute

**Trigger:** "execute plan", "start implementation", "run tasks"

**Loop per task:**

1. **PRE-CHECK** (drift prevention)
   - Read task spec from docs/ or memctx
   - Confirm understanding: "Task X: [summary]. Proceed?"
   - If `autoAdvance=false`, wait for user "yes"

2. **IMPLEMENT**
   - Code the task
   - Update plan_tracker: `status="in_progress"`

3. **POST-CHECK** (drift detection)
   - Compare implementation vs task acceptance criteria
   - If drift detected: hard stop, report what diverged

4. **VERIFY GATES** (ordered: tests > checklist > build)
   - Run tests related to task
   - Check acceptance criteria items
   - Confirm build passes
   - If any gate fails: hard stop

5. **COMPLETE**
   - Update plan_tracker: `status="complete"`
   - If `autoAdvance=true` and more tasks: goto next
   - If `autoAdvance=false`: wait for user "next"

### sdlc-verify

**Trigger:** "verify feature", "final check", "ready to merge"

**Steps:**
1. Run full test suite
2. Walk spec acceptance criteria, check each item
3. Confirm build succeeds
4. Generate verification report:
   - Tests: ✓/✗ with output
   - Checklist: each criterion marked
   - Build: pass/fail
5. If all pass: suggest PR/merge
6. If any fail: hard stop with specific failures

## Plan Tracker Integration

Wrapper approach - trigger only on meaningful state changes:

| Action | When | Call |
|--------|------|------|
| INIT | task breakdown complete | `plan_tracker_ide(action: "init", tasks: [...])` |
| UPDATE | task state changes | `plan_tracker_ide(action: "update", index: N, status: "...")` |
| STATUS | user asks or loop boundary | `plan_tracker_ide(action: "status")` |
| CLEAR | after verify passes | `plan_tracker_ide(action: "clear")` |

**No spam rule:**
- Never update tracker during coding
- Only update on: start task, complete task, fail task

## memctx Integration

### Sync Points

| Skill | Type | Path | Content |
|-------|------|------|---------|
| sdlc-spec | context | `20-context/{feature}-spec.md` | spec summary + criteria |
| sdlc-plan | observation | `60-observations/{feature}-tasks.md` | task index with wikilinks |
| sdlc-execute | action | `40-actions/YYYY-MM-DD-{feature}-{task}.md` | what was built |
| sdlc-verify | observation | `60-observations/{feature}-completed.md` | verification report |

### Recall Points

- `sdlc-plan` → search for spec if path not given
- `sdlc-execute` → search for task context before each task
- `sdlc-verify` → search for spec + all task actions

### Wikilinks

- Spec → tasks: `[[60-observations/{feature}-tasks]]`
- Tasks → spec: `[[20-context/{feature}-spec]]`
- Actions → task: `[[60-observations/{feature}-tasks#task-N]]`

## Config Schema

**config.json** (per spec/feature):

```json
{
  "autoAdvance": false,
  "gates": ["tests", "checklist", "build"],
  "gateOrder": "tests > checklist > build",
  "onFail": "stop",
  "testCommand": "npm test",
  "buildCommand": "npm run build",
  "testPattern": "**/*.test.ts"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `autoAdvance` | boolean | `false` | Auto-proceed to next task |
| `gates` | string[] | `["tests", "checklist", "build"]` | Which gates to run |
| `gateOrder` | string | `"tests > checklist > build"` | Verification order |
| `onFail` | string | `"stop"` | Hard stop on failure |
| `testCommand` | string | auto-detect | Test command |
| `buildCommand` | string | auto-detect | Build command |
| `testPattern` | string | auto-detect | Test file glob |

**Override precedence:**
1. Task-level config (frontmatter)
2. Spec-level config (config.json)
3. Project defaults (`.pi-sdlc/config.json`)
4. Skill defaults

## Package

```json
{
  "name": "pi-sdlc",
  "version": "0.1.0",
  "description": "SDLC skills for pi-agents: spec → plan → execute → verify with drift detection",
  "pi": {
    "type": "extension",
    "skills": [
      "skills/sdlc-spec/SKILL.md",
      "skills/sdlc-plan/SKILL.md",
      "skills/sdlc-execute/SKILL.md",
      "skills/sdlc-verify/SKILL.md"
    ],
    "dependencies": ["pi-memctx"]
  },
  "keywords": ["pi", "sdlc", "spec", "planning", "verification"],
  "license": "MIT"
}
```

## Usage

```bash
# Install
pi install git:github.com/igun997/pi-sdlc

# Use
pi -e pi-sdlc

# In session
/skill:sdlc-spec      # start new feature
/skill:sdlc-plan      # break down to tasks
/skill:sdlc-execute   # implement with gates
/skill:sdlc-verify    # final verification
```
