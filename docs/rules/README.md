# Development Rules

> Modular rules for AI-assisted development. Load only what you need.

## Structure

```
rules/
├── general/                  # Universal rules
│   ├── clean-code.md         # DRY, YAGNI, naming
│   ├── git.md                # Commits, branches, security review
│   ├── verification.md       # Status labels, evidence, closeout
│   ├── solver-loop.md        # Systematic approach to tasks
│   └── ai-craftsmanship.md   # AI-assisted dev values
│
├── frontend/                 # Frontend rules
│   ├── anti-slop.md          # Category-aware design, prevent AI slop
│   ├── components.md         # Component architecture
│   ├── accessibility.md      # A11y requirements
│   ├── security.md           # XSS, data handling
│   └── performance.md        # Code splitting, memoization
│
├── backend/                  # Backend rules
│   ├── tdd.md                # Test-driven development
│   ├── solid.md              # SOLID principles
│   ├── api-design.md         # REST conventions
│   ├── security.md           # OWASP, auth, validation
│   ├── error-handling.md     # Domain errors, fail-fast
│   └── observability.md      # Logging, metrics, tracing
│
├── golang/                   # Go-specific
│   ├── patterns.md           # Idiomatic Go
│   └── performance.md        # Allocations, profiling
│
├── rust/                     # Rust-specific
│   ├── patterns.md           # Ownership, traits, builders
│   ├── async.md              # Tokio patterns
│   └── performance.md        # Zero-copy, SIMD
│
└── performance/              # High-performance systems
    ├── architecture.md       # Scaling, CQRS, event-driven
    ├── low-latency.md        # Latency budgets, backpressure
    ├── database.md           # Query optimization, caching
    └── profiling.md          # Measure before optimize
```

## Usage

**Load only relevant rules for the task:**

| Task Type | Load Rules |
|-----------|------------|
| Frontend work | `frontend/*`, `general/*` |
| Backend API | `backend/*`, `general/*` |
| Go service | `golang/*`, `backend/*`, `general/*` |
| Rust service | `rust/*`, `backend/*`, `general/*` |
| Performance critical | `performance/*` + language rules |

## Rule Selection

AI should load rules based on task type:

```
Task: "Build React component"
→ Load: frontend/anti-slop.md, frontend/components.md

Task: "Create Go API endpoint"
→ Load: golang/patterns.md, backend/tdd.md, backend/api-design.md

Task: "Optimize database queries"
→ Load: performance/database.md, performance/profiling.md
```
