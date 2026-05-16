# pi-sdlc

SDLC skills for pi-agents: spec → plan → execute → verify with drift detection and verification gates.

Inspired by [Ralph Loop](https://ralphloop.sh/) - PRD-driven, task-based execution with accuracy guarantees.

## Features

- **Drift prevention** - pre-check understanding before each task
- **Drift detection** - post-check implementation against spec
- **Verification gates** - tests > checklist > build (ordered)
- **Hard stop on failure** - no silent failures
- **Plan tracker integration** - visibility into task progress
- **memctx sync** - durable memory via pi-memctx
- **Backend rules** - TDD mandatory, SOLID principles, security
- **Frontend rules** - anti-slop mandatory, accessibility, design tokens

## Installation

```bash
pi install git:github.com/igun997/pi-sdlc
```

Requires [pi-memctx](https://pi.dev/packages/pi-memctx) (auto-installed as dependency).

## Usage

```bash
# Start pi with extension
pi -e pi-sdlc

# In session, use skills in order:
/skill:sdlc-spec      # brainstorm → write spec
/skill:sdlc-plan      # spec → task breakdown
/skill:sdlc-execute   # implement with gates
/skill:sdlc-verify    # final verification
```

## Skills

### sdlc-spec

Create feature specs through collaborative brainstorming.

- One question at a time
- Multiple choice preferred
- Testable acceptance criteria
- Syncs to memctx for recall

### sdlc-plan

Break specs into ordered tasks with dependencies.

- 15-60 min task granularity
- Clear acceptance criteria per task
- Initializes plan tracker
- Syncs task index to memctx

### sdlc-execute

Execute tasks with verification gates.

```
PRE-CHECK  → confirm understanding
IMPLEMENT  → code the task
POST-CHECK → compare vs criteria
GATES      → tests > checklist > build
COMPLETE   → update tracker, advance
```

Configurable:
- `autoAdvance: true/false` - auto-proceed or wait for user
- `onFail: "stop"` - hard stop on any gate failure

### sdlc-verify

Final verification against spec.

- Full test suite (not just task tests)
- Every acceptance criterion checked
- Build verification
- Generates evidence report

## Configuration

Per-feature config at `docs/specs/{feature}/config.json`:

```json
{
  "autoAdvance": false,
  "gates": ["tests", "checklist", "build"],
  "gateOrder": "tests > checklist > build",
  "onFail": "stop",
  "testCommand": "npm test",
  "buildCommand": "npm run build"
}
```

## File Structure

```
project/
├── docs/
│   └── specs/
│       └── 2026-05-16-feature/
│           ├── spec.md
│           ├── config.json
│           ├── tasks/
│           │   ├── 01-setup.md
│           │   └── 02-core.md
│           └── verification-report.md
└── packs/
    └── project/
        ├── 20-context/
        │   └── feature-spec.md
        └── 60-observations/
            └── feature-tasks.md
```

## Rules

Comprehensive development rules enforced during execution:

- **[General Rules](docs/rules/GENERAL.md)** - applies to all code
  - Clean code principles (DRY, YAGNI, KISS)
  - Git practices, documentation standards
  - Verification protocol (evidence before claims)
  
- **[Backend Rules](docs/rules/BACKEND.md)** - TDD mandatory
  - Red → Green → Refactor cycle required
  - SOLID principles, repository pattern
  - API design, error handling, observability
  - OWASP security practices
  
- **[Frontend Rules](docs/rules/FRONTEND.md)** - anti-slop mandatory
  - 3-reference rule (find existing patterns first)
  - Design tokens, no generic AI aesthetics
  - Accessibility (a11y) checklist
  - XSS prevention, secure data handling

## Design

See [docs/plans/2026-05-16-pi-sdlc-design.md](docs/plans/2026-05-16-pi-sdlc-design.md) for full design document.

## License

MIT
