# Git Practices

> Git initialization, security review, commit conventions.

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

## Git Initialization

**Before any work, check git status:**

```bash
git status 2>/dev/null || echo "NOT_A_GIT_REPO"
```

**If not a git repo, initialize:**

```bash
git init
git add .gitignore  # Create if missing
git commit -m "chore: initial commit"
```

**Ensure .gitignore exists with basics:**

```gitignore
# Dependencies
node_modules/
vendor/

# Environment
.env
.env.*
!.env.example

# Secrets
*.pem
*.key
*.crt
secrets/

# Build
dist/
build/
*.log

# IDE
.idea/
.vscode/
*.swp
```

## Pre-Commit Security Review

**MANDATORY before every commit:**

```bash
# Check staged files for secrets
git diff --cached --name-only
```

**Scan for sensitive patterns:**

```bash
git diff --cached | grep -iE '(password|secret|api_key|token|private_key|-----BEGIN)' || echo "OK"
```

**NEVER commit:**

| Pattern | Example |
|---------|--------|
| API keys | `OPENAI_API_KEY=sk-...` |
| Passwords | `password = "hunter2"` |
| Private keys | `-----BEGIN RSA PRIVATE KEY-----` |
| Tokens | `ghp_xxxx`, `Bearer eyJ...` |
| Connection strings | `postgres://user:pass@host` |
| .env files | Unless `.env.example` |
| Certificates | `*.pem`, `*.key`, `*.crt` |

**If sensitive data found:**

1. `git reset HEAD <file>` - unstage
2. Add to `.gitignore`
3. Use environment variables instead
4. If already committed: consider `git filter-branch` or BFG

## Safe Commit Checklist

```
[ ] .gitignore exists and covers secrets
[ ] No hardcoded credentials in diff
[ ] No API keys/tokens in diff
[ ] No private keys in diff  
[ ] .env files excluded (only .env.example)
[ ] Large binaries excluded
```

**Only after checklist passes:** `git commit`
