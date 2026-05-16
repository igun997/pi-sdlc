# TDD Rules

> Test-Driven Development is mandatory for backend code.

## The Cycle

```
RED    → Write failing test
GREEN  → Minimal code to pass
REFACTOR → Clean up, tests stay green
```

## The Law

1. Write test BEFORE implementation
2. Run test → must FAIL (red)
3. Write MINIMAL code to pass
4. Run test → must PASS (green)
5. Refactor if needed
6. Tests still green
7. Commit

## Evidence Required

```bash
# Show red:
$ npm test
FAIL: UserService.createUser
  Expected: user object
  Received: undefined

# Show green:
$ npm test
PASS: UserService.createUser ✓
```

## Violations

- Writing implementation before test
- Skipping red phase
- "I'll add tests later"
- Test that never failed (not a regression test)

## Test Structure

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('creates user with valid input', async () => {
      const result = await service.createUser({
        email: 'test@example.com'
      })
      expect(result.id).toBeDefined()
    })

    it('throws on duplicate email', async () => {
      await service.createUser({ email: 'test@example.com' })
      await expect(
        service.createUser({ email: 'test@example.com' })
      ).rejects.toThrow(DuplicateEmailError)
    })
  })
})
```
