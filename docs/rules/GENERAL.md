# General Development Rules

> Universal rules for AI-assisted development. Apply to all code regardless of frontend/backend.

## AI-Augmented Craftsmanship

### Core Values

From the [AI-Augmented Software Craftsmanship Manifesto](https://ai-manifesto.software-craftsmanship.dev/):

| Value | Meaning |
|-------|---------|
| **Verification over Assumption** | Don't trust AI output. Verify everything. |
| **Comprehension over Convenience** | Understand what you're shipping. |
| **Ownership over Delegation** | You're responsible, not the AI. |
| **Collaboration over Automation** | AI is a tool, not a replacement. |

### The Iron Laws

```
1. UNDERSTAND what you commit
2. VERIFY before claiming done
3. TEST before trusting
4. REVIEW AI output critically
5. OWN the result
```

---

## Code Quality

### Clean Code Principles

**Still apply in AI era. More important, not less.**

| Principle | Description |
|-----------|-------------|
| **DRY** | Don't Repeat Yourself |
| **YAGNI** | You Aren't Gonna Need It |
| **KISS** | Keep It Simple, Stupid |
| **SRP** | Single Responsibility Principle |

### Naming

```typescript
// ❌ Bad
const d = new Date()
const u = await getU(id)
function proc(x) { ... }

// ✅ Good
const createdAt = new Date()
const user = await getUserById(id)
function processPayment(paymentRequest) { ... }
```

**Rules:**
- Variables: describe content, not type (`user` not `userObj`)
- Functions: describe action (`validateEmail` not `emailValidator`)
- Booleans: start with is/has/should (`isValid`, `hasPermission`)
- Constants: SCREAMING_SNAKE for true constants

### Functions

```typescript
// ❌ Bad - too many parameters
function createUser(name, email, age, address, phone, company, role) { ... }

// ✅ Good - object parameter
function createUser(params: CreateUserParams) { ... }

// ❌ Bad - side effects hidden
function formatName(name: string) {
  logToAnalytics(name)  // Hidden side effect!
  return name.toUpperCase()
}

// ✅ Good - pure function
function formatName(name: string): string {
  return name.toUpperCase()
}
```

### Comments

```typescript
// ❌ Bad - describes what (obvious from code)
// Increment counter by 1
counter++

// ✅ Good - describes why (not obvious)
// Counter must overflow to 0 for protocol compatibility
counter++

// ✅ Good - documents edge case
// Empty string returns true per business rule: "no filter = all match"
if (filter === '') return true
```

---

## Git Practices

### Commit Messages

**Conventional commits:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructure
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```bash
# ✅ Good
git commit -m "feat(auth): add password reset flow"
git commit -m "fix(api): handle null response from payment gateway"
git commit -m "test(user): add unit tests for validation"

# ❌ Bad
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "changes"
```

### Branch Naming

```
<type>/<ticket>-<description>

feat/PROJ-123-user-authentication
fix/PROJ-456-null-pointer-crash
refactor/PROJ-789-extract-service
```

### Commits Per Task

- One logical change per commit
- Tests and implementation in same commit
- Commits should pass all tests independently

---

## Documentation

### When to Document

| Document | When |
|----------|------|
| README | Always - how to run, test, deploy |
| API docs | Public APIs - OpenAPI/Swagger |
| Architecture | Non-obvious decisions |
| Code comments | Why, not what |

### README Structure

```markdown
# Project Name

One-line description.

## Quick Start

```bash
npm install
npm run dev
```

## Development

### Prerequisites
- Node 20+
- PostgreSQL 15+

### Environment
Copy `.env.example` to `.env.local` and configure.

### Commands
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run build` - Production build

## Architecture

Brief overview with links to detailed docs.

## Deployment

How to deploy to staging/production.
```

### ADRs (Architecture Decision Records)

For significant decisions:

```markdown
# ADR-001: Use PostgreSQL for primary database

## Status
Accepted

## Context
We need a relational database for transactional data.

## Decision
Use PostgreSQL 15.

## Consequences
- (+) ACID compliance
- (+) Team familiarity
- (-) Additional infrastructure to manage
```

---

## Error Prevention

### Type Safety

```typescript
// ✅ Strict TypeScript
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Linting

```javascript
// ESLint config - enforce rules
{
  "extends": ["eslint:recommended"],
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "eqeqeq": "error"
  }
}
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
npm run lint
npm run typecheck
npm test -- --bail
```

---

## Performance Mindset

### Measure First

```
Don't optimize without profiling.
Don't profile without a problem.
```

### Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| N+1 queries | Batch/eager load |
| Unbounded queries | Pagination |
| Missing indexes | EXPLAIN ANALYZE |
| Memory leaks | Cleanup subscriptions |

---

## Dependency Management

### Adding Dependencies

Before adding any dependency:

1. **Is it necessary?** Can stdlib/existing deps do it?
2. **Is it maintained?** Last update, open issues, bus factor
3. **Is it secure?** Known vulnerabilities, audit trail
4. **Size impact?** Bundle size for frontend

### Version Pinning

```json
// ✅ Lock exact versions for production deps
"dependencies": {
  "express": "4.18.2"
}

// ✅ Allow patches for dev deps
"devDependencies": {
  "typescript": "~5.0.0"
}
```

### Security Audits

```bash
# Run regularly
npm audit

# Fix automatically (careful in production)
npm audit fix
```

---

## Verification Protocol

### Before Claiming Done

```
1. IDENTIFY what command proves the claim
2. RUN the command (fresh, complete)
3. READ full output, check exit codes
4. VERIFY output confirms claim
5. ONLY THEN claim success
```

### Evidence Standards

| Claim | Requires |
|-------|----------|
| "Tests pass" | Test output showing 0 failures |
| "Build succeeds" | Build output, exit code 0 |
| "Linter clean" | Linter output, 0 errors |
| "Bug fixed" | Test that failed now passes |

### Red Flags

**Stop if you're about to say:**
- "Should work now"
- "Looks correct"
- "I'm confident"
- "Probably fixed"

**Instead:** Run the verification command.

---

## Code Review Standards

### What to Check

| Category | Questions |
|----------|-----------|
| **Correctness** | Does it do what spec says? |
| **Design** | Is it the simplest solution? |
| **Tests** | Are edge cases covered? |
| **Security** | Any vulnerabilities? |
| **Performance** | Any obvious inefficiencies? |
| **Readability** | Can I understand in 5 minutes? |

### How to Give Feedback

```markdown
# ✅ Good - specific, actionable
This array filter runs on every render. Consider memoizing:
```tsx
const filtered = useMemo(() => items.filter(...), [items])
```

# ❌ Bad - vague
This could be better.
```

### How to Receive Feedback

1. **Don't take it personally** - it's about code, not you
2. **Understand before responding** - ask clarifying questions
3. **Verify suggestions** - reviewer could be wrong too
4. **Explain your reasoning** - if you disagree, explain why
