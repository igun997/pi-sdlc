# Clean Code

> Universal code quality principles.

## Core Principles

| Principle | Description |
|-----------|-------------|
| **DRY** | Don't Repeat Yourself |
| **YAGNI** | You Aren't Gonna Need It |
| **KISS** | Keep It Simple |
| **SRP** | Single Responsibility |

## Naming

```typescript
// ❌ Bad
const d = new Date()
const u = await getU(id)

// ✅ Good
const createdAt = new Date()
const user = await getUserById(id)
```

**Rules:**
- Variables: describe content (`user` not `userObj`)
- Functions: describe action (`validateEmail`)
- Booleans: is/has/should (`isValid`, `hasPermission`)

## Functions

```typescript
// ❌ Too many params
function createUser(name, email, age, address, phone) {}

// ✅ Object param
function createUser(params: CreateUserParams) {}
```

## Comments

```typescript
// ❌ Describes what (obvious)
// Increment counter
counter++

// ✅ Describes why (not obvious)
// Counter must overflow to 0 for protocol compatibility
counter++
```
