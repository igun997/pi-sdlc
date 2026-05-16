# Observability

> Logging, metrics, and tracing.

## Three Pillars

| Pillar | Purpose |
|--------|---------|
| Logs | What happened |
| Metrics | How system performs |
| Traces | Request flow |

## Structured Logging

```typescript
// ✅ Structured JSON
logger.info('User created', {
  userId: user.id,
  email: user.email,
  traceId: context.traceId,
  duration: endTime - startTime
})

// ❌ Unstructured
logger.info(`User ${email} created in ${duration}ms`)
```

## Correlation IDs

```typescript
// Every log includes trace ID
const traceId = req.headers['x-trace-id'] || generateTraceId()

// Pass through all calls
await userService.create(data, { traceId })
await emailService.send(user, { traceId })
```

## Health Checks

```typescript
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDb(),
    redis: await checkRedis()
  }
  
  const healthy = Object.values(checks)
    .every(c => c.status === 'healthy')
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks
  })
})
```
