# Task NN: {Task Name}

**Scope:** S | M | L
**Type:** backend | frontend | mixed
**Dependencies:** [Task numbers that must complete first, or "None"]

## Description

[What this task accomplishes in 1-2 sentences]

## Acceptance Criteria

- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]

## Files

- Create: `exact/path/to/new/file.ts`
- Modify: `exact/path/to/existing.ts`
- Test: `tests/path/to/test.ts`

## Reference (frontend only)

Existing patterns to follow:
- `src/components/Example1.tsx` - [what to copy]
- `src/components/Example2.tsx` - [what to copy]
- `src/components/Example3.tsx` - [what to copy]

## Steps

### For backend (TDD required):

1. Write failing test for [behavior]
2. Run test, confirm FAIL (red)
3. Implement minimal code in [file]
4. Run test, confirm PASS (green)
5. Refactor if needed
6. Commit

### For frontend (anti-slop required):

1. Find 3+ existing components matching pattern
2. Review project design tokens
3. Implement using existing patterns
4. Verify matches codebase style
5. Commit

## Verification

- Test command: `npm test -- {pattern}`
- Expected: All tests pass
- Build command: `npm run build`
- Expected: Exit code 0
