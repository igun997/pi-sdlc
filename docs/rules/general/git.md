# Git Practices

> Commit messages and branching conventions.

## Commit Messages

Conventional commits:

```
<type>(<scope>): <subject>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code restructure
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```bash
# ✅ Good
git commit -m "feat(auth): add password reset"
git commit -m "fix(api): handle null response"

# ❌ Bad
git commit -m "fixed stuff"
git commit -m "WIP"
```

## Branch Naming

```
<type>/<ticket>-<description>

feat/PROJ-123-user-auth
fix/PROJ-456-null-crash
```

## Commits Per Task

- One logical change per commit
- Tests + implementation in same commit
- Each commit should pass tests
