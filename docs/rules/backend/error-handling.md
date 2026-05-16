# Error Handling

> Domain errors and fail-fast patterns.

## Fail Fast

Detect invalid state early:

```typescript
function processPayment(amount: number, userId: string) {
  if (amount <= 0) throw new InvalidAmountError(amount)
  if (!userId) throw new MissingUserIdError()
  
  // Core logic only if inputs valid
  return gateway.charge(userId, amount)
}
```

## Domain Errors

```typescript
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
    super(`Insufficient funds`)
    this.name = 'InsufficientFundsError'
  }
}
```

## Error Mapping

```typescript
// Controller maps to HTTP
app.use((err, req, res, next) => {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: { code: 'NOT_FOUND' } })
  }
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: { code: 'VALIDATION' } })
  }
  
  logger.error('Unhandled', { error: err, traceId: req.traceId })
  return res.status(500).json({ error: { code: 'INTERNAL' } })
})
```
