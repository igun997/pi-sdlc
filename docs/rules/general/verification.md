# Verification Protocol

> Evidence before claims, always.

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT VERIFICATION EVIDENCE
```

## The Gate

Before claiming any status:

1. **IDENTIFY** - what command proves this?
2. **RUN** - execute the command (fresh)
3. **READ** - full output, check exit code
4. **VERIFY** - does output confirm claim?
5. **THEN** - make the claim with evidence

## Evidence Standards

| Claim | Requires |
|-------|----------|
| "Tests pass" | Test output: 0 failures |
| "Build succeeds" | Build output: exit 0 |
| "Bug fixed" | Test that failed now passes |
| "Lint clean" | Linter output: 0 errors |

## Red Flags - STOP

If about to say:
- "Should work now"
- "Looks correct"
- "I'm confident"
- "Probably fixed"

**Instead:** Run the verification command.

## Pattern

```bash
# ✅ Correct
$ npm test
PASS: 34/34 tests
"All tests pass" ← claim after evidence

# ❌ Wrong
"Should pass now" ← claim without evidence
```
