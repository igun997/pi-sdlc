# Backend Development Rules

> Rules for AI-assisted backend development. TDD, SOLID, API design, security, observability.

## Core Principles

### 1. TDD Is Mandatory

**No implementation without failing test first.**

```
RED    → Write failing test
GREEN  → Minimal code to pass
REFACTOR → Clean up, tests stay green
```

**The TDD Law:**

```
1. Write test BEFORE implementation
2. Run test → must FAIL (red)
3. Write MINIMAL code to pass
4. Run test → must PASS (green)
5. Refactor if needed
6. Tests still green
7. Commit
```

**Evidence Required:**

```bash
# Show red:
$ npm test
FAIL: UserService.createUser
  Expected: user object
  Received: undefined

# Show green:
$ npm test
PASS: UserService.createUser
  ✓ creates user with valid input (12ms)
```

**Violations:**
- Writing implementation before test = violation
- Skipping red phase = violation
- "I'll add tests later" = violation
- Test that never failed = not a regression test

### 2. SOLID Principles

**Apply pragmatically, not dogmatically.**

| Principle | What | When to Apply |
|-----------|------|---------------|
| **S**ingle Responsibility | One reason to change | Always |
| **O**pen/Closed | Extend without modifying | When adding variants |
| **L**iskov Substitution | Subtypes substitutable | When using inheritance |
| **I**nterface Segregation | Small, focused interfaces | When interfaces grow |
| **D**ependency Inversion | Depend on abstractions | For testability |

**Most Important: Single Responsibility**

```typescript
// ❌ Bad - multiple responsibilities
class UserService {
  createUser() { ... }
  sendWelcomeEmail() { ... }
  generateReport() { ... }
  validateCreditCard() { ... }
}

// ✅ Good - single responsibility
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

### 3. Fail Fast

**Detect invalid state early and stop immediately.**

```typescript
// ✅ Fail fast - validate at boundaries
function processPayment(amount: number, userId: string) {
  if (amount <= 0) throw new InvalidAmountError(amount)
  if (!userId) throw new MissingUserIdError()
  
  // Core logic only runs if inputs valid
  return paymentGateway.charge(userId, amount)
}
```

**When to use:**
- Core business logic
- Internal APIs
- Data transformations

**When to be defensive:**
- System boundaries
- External API responses
- User input

---

## API Design

### REST Conventions

**Resources, not actions:**

```
# ❌ Bad
POST /createUser
GET /getUserById?id=123
POST /deleteUser

# ✅ Good
POST /users
GET /users/123
DELETE /users/123
```

**HTTP Methods:**

| Method | Purpose | Idempotent |
|--------|---------|------------|
| GET | Read | Yes |
| POST | Create | No |
| PUT | Replace | Yes |
| PATCH | Partial update | Yes |
| DELETE | Remove | Yes |

**Status Codes:**

| Code | Meaning | Use For |
|------|---------|---------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate/conflict |
| 500 | Server Error | Unexpected failure |

### Error Responses

**Consistent structure:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ],
    "traceId": "abc-123-xyz"
  }
}
```

### Pagination

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasNext": true
  }
}
```

### Versioning

```
# URL versioning (recommended)
/api/v1/users

# Header versioning (alternative)
Accept: application/vnd.api+json;version=1
```

---

## Repository Pattern

### Purpose

- Abstract data access behind collection-like interface
- Keep persistence logic out of domain layer
- Enable testing with in-memory implementations

### Implementation

```typescript
// ✅ Domain-focused interface
interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<User>
  delete(id: string): Promise<void>
  findPendingVerification(): Promise<User[]>
}

// ✅ Concrete implementation
class PostgresUserRepository implements UserRepository {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<User | null> {
    const row = await this.db.query('SELECT * FROM users WHERE id = $1', [id])
    return row ? this.toEntity(row) : null
  }
  
  // ... other methods
}

// ✅ Test implementation
class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map()
  
  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null
  }
  
  // ... other methods
}
```

### Anti-Patterns

```typescript
// ❌ Bad - exposing ORM internals
interface UserRepository {
  query(): IQueryable<User>  // Leaks ORM
}

// ❌ Bad - generic repository
interface Repository<T> {
  find(query: any): Promise<T[]>  // Too generic
}
```

---

## Error Handling

### Domain Errors

```typescript
// ✅ Specific, typed errors
class UserNotFoundError extends Error {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`)
    this.name = 'UserNotFoundError'
  }
}

class InsufficientFundsError extends Error {
  constructor(
    public readonly required: number,
    public readonly available: number
  ) {
    super(`Insufficient funds: required ${required}, available ${available}`)
    this.name = 'InsufficientFundsError'
  }
}
```

### Error Handling Strategy

```typescript
// Service layer - throw domain errors
async function withdrawFunds(userId: string, amount: number) {
  const account = await accountRepo.findByUserId(userId)
  if (!account) throw new AccountNotFoundError(userId)
  if (account.balance < amount) {
    throw new InsufficientFundsError(amount, account.balance)
  }
  return account.withdraw(amount)
}

// Controller layer - map to HTTP responses
app.use((err, req, res, next) => {
  if (err instanceof AccountNotFoundError) {
    return res.status(404).json({ error: { code: 'ACCOUNT_NOT_FOUND' } })
  }
  if (err instanceof InsufficientFundsError) {
    return res.status(400).json({ error: { code: 'INSUFFICIENT_FUNDS' } })
  }
  // Unknown error
  logger.error('Unhandled error', { error: err, traceId: req.traceId })
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR' } })
})
```

---

## Observability

### Three Pillars

| Pillar | Purpose | Tool Examples |
|--------|---------|---------------|
| **Logs** | What happened | Winston, Pino |
| **Metrics** | How system performs | Prometheus, Datadog |
| **Traces** | Request flow across services | OpenTelemetry, Jaeger |

### Structured Logging

```typescript
// ✅ Structured JSON logs
logger.info('User created', {
  userId: user.id,
  email: user.email,
  traceId: context.traceId,
  duration: endTime - startTime
})

// ❌ Bad - unstructured
logger.info(`User ${user.email} created in ${duration}ms`)
```

### Correlation IDs

```typescript
// Every log line includes trace ID
const traceId = req.headers['x-trace-id'] || generateTraceId()

// Pass through all service calls
await userService.create(data, { traceId })
await emailService.sendWelcome(user, { traceId })
await analyticsService.track('user_created', { traceId })
```

### Health Checks

```typescript
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    external_api: await checkExternalApi()
  }
  
  const healthy = Object.values(checks).every(c => c.status === 'healthy')
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  })
})
```

---

## Security (OWASP Top 10)

### Input Validation

```typescript
// ✅ Validate all inputs
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1).max(100)
})

// In controller
const result = CreateUserSchema.safeParse(req.body)
if (!result.success) {
  return res.status(400).json({ errors: result.error.issues })
}
```

### SQL Injection Prevention

```typescript
// ❌ NEVER - string concatenation
const query = `SELECT * FROM users WHERE id = '${userId}'`

// ✅ Always parameterized queries
const query = 'SELECT * FROM users WHERE id = $1'
const result = await db.query(query, [userId])
```

### Authentication

```typescript
// ✅ Secure password handling
import bcrypt from 'bcrypt'

// Hash password (never store plain text)
const hashedPassword = await bcrypt.hash(password, 12)

// Verify password
const isValid = await bcrypt.compare(inputPassword, hashedPassword)
```

### Authorization

```typescript
// ✅ Check permissions at every endpoint
async function getDocument(userId: string, docId: string) {
  const doc = await documentRepo.findById(docId)
  if (!doc) throw new NotFoundError()
  
  // Always verify access
  if (doc.ownerId !== userId && !doc.sharedWith.includes(userId)) {
    throw new ForbiddenError()
  }
  
  return doc
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  message: { error: { code: 'RATE_LIMITED' } }
})

app.use('/api/', apiLimiter)
```

---

## Testing Strategy

### Test Pyramid

```
        /\
       /  \     E2E (few)
      /----\
     /      \   Integration (some)
    /--------\
   /          \ Unit (many)
  /------------\
```

### Unit Tests

```typescript
describe('UserService', () => {
  let service: UserService
  let mockRepo: InMemoryUserRepository
  
  beforeEach(() => {
    mockRepo = new InMemoryUserRepository()
    service = new UserService(mockRepo)
  })
  
  describe('createUser', () => {
    it('creates user with valid input', async () => {
      const result = await service.createUser({
        email: 'test@example.com',
        name: 'Test User'
      })
      
      expect(result.id).toBeDefined()
      expect(result.email).toBe('test@example.com')
    })
    
    it('throws on duplicate email', async () => {
      await service.createUser({ email: 'test@example.com', name: 'First' })
      
      await expect(
        service.createUser({ email: 'test@example.com', name: 'Second' })
      ).rejects.toThrow(DuplicateEmailError)
    })
  })
})
```

### Integration Tests

```typescript
describe('POST /api/users', () => {
  it('creates user and returns 201', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', password: 'securepassword123' })
      
    expect(response.status).toBe(201)
    expect(response.body.data.id).toBeDefined()
    
    // Verify in database
    const user = await db.query('SELECT * FROM users WHERE email = $1', ['test@example.com'])
    expect(user).toBeDefined()
  })
})
```

---

## Code Review Checklist

Before any backend PR:

### Correctness
- [ ] TDD cycle followed (red → green → refactor)
- [ ] Edge cases have tests
- [ ] Error cases handled

### Architecture
- [ ] Single responsibility respected
- [ ] Dependencies injected (testable)
- [ ] Repository pattern used for data access

### API Design
- [ ] RESTful conventions followed
- [ ] Status codes correct
- [ ] Error responses consistent

### Security
- [ ] Inputs validated
- [ ] Authorization checked
- [ ] No SQL injection vectors
- [ ] Secrets not in code

### Observability
- [ ] Structured logging added
- [ ] Trace IDs propagated
- [ ] Health checks updated (if new dependencies)

### Testing
- [ ] Unit tests cover happy path + errors
- [ ] Integration tests for API endpoints
- [ ] No tests that always pass
