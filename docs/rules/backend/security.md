# Backend Security

> OWASP-aligned security practices.

## Input Validation

```typescript
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1).max(100)
})

const result = CreateUserSchema.safeParse(req.body)
if (!result.success) {
  return res.status(400).json({ errors: result.error.issues })
}
```

## SQL Injection Prevention

```typescript
// ❌ NEVER
const query = `SELECT * FROM users WHERE id = '${userId}'`

// ✅ Always parameterized
const query = 'SELECT * FROM users WHERE id = $1'
await db.query(query, [userId])
```

## Authentication

```typescript
import bcrypt from 'bcrypt'

// Hash (never store plain text)
const hash = await bcrypt.hash(password, 12)

// Verify
const valid = await bcrypt.compare(input, hash)
```

## Authorization

```typescript
async function getDocument(userId: string, docId: string) {
  const doc = await repo.findById(docId)
  if (!doc) throw new NotFoundError()
  
  // Always verify access
  if (doc.ownerId !== userId) {
    throw new ForbiddenError()
  }
  
  return doc
}
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})

app.use('/api/', limiter)
```
