# SOLID Principles

> Apply pragmatically, not dogmatically.

## Summary

| Principle | What | When |
|-----------|------|------|
| **S**ingle Responsibility | One reason to change | Always |
| **O**pen/Closed | Extend without modifying | Adding variants |
| **L**iskov Substitution | Subtypes substitutable | Using inheritance |
| **I**nterface Segregation | Small, focused interfaces | Interfaces grow |
| **D**ependency Inversion | Depend on abstractions | Testability |

## Single Responsibility (Most Important)

```typescript
// ❌ Bad - multiple responsibilities
class UserService {
  createUser() { ... }
  sendWelcomeEmail() { ... }
  generateReport() { ... }
}

// ✅ Good
class UserService {
  constructor(
    private emailService: EmailService,
    private validator: UserValidator
  ) {}
  
  createUser(data: CreateUserDTO) {
    this.validator.validate(data)
    const user = this.repository.create(data)
    this.emailService.sendWelcome(user)
    return user
  }
}
```

## Dependency Inversion

```typescript
// ✅ Depend on abstractions
interface UserRepository {
  findById(id: string): Promise<User | null>
  save(user: User): Promise<User>
}

class UserService {
  constructor(private repo: UserRepository) {}
}

// Easy to test with mock
class MockUserRepository implements UserRepository { ... }
```
