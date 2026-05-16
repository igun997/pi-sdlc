# Low-Latency Design

> Patterns for minimizing response time.

## Latency Budgets

**Assign budgets per stage:**

```
Total budget: 100ms

┌─────────────┬────────┐
│ Stage       │ Budget │
├─────────────┼────────┤
│ Network     │ 20ms   │
│ Auth        │ 10ms   │
│ Business    │ 30ms   │
│ Database    │ 30ms   │
│ Response    │ 10ms   │
└─────────────┴────────┘
```

If stage exceeds budget → redesign that stage.

## Reduce Round Trips

```
❌ Bad: 5 sequential calls
Client → Auth → Users → Orders → Inventory → Response

✅ Good: 1 composite call
Client → API Gateway (parallel: Auth, Data) → Response
```

## Parallel > Sequential

```go
// ❌ Sequential: 300ms total
user := getUser(id)      // 100ms
orders := getOrders(id)  // 100ms
prefs := getPrefs(id)    // 100ms

// ✅ Parallel: 100ms total
var user User
var orders []Order
var prefs Prefs

g.Go(func() { user = getUser(id) })
g.Go(func() { orders = getOrders(id) })
g.Go(func() { prefs = getPrefs(id) })
g.Wait()
```

## Caching Layers

```
┌────────────┐
│   Client   │  ← Browser cache, CDN
├────────────┤
│   Edge     │  ← CDN, edge compute
├────────────┤
│   App      │  ← In-memory (local cache)
├────────────┤
│  Shared    │  ← Redis, Memcached
├────────────┤
│  Database  │  ← Query cache, buffer pool
└────────────┘
```

## Backpressure

**Mandatory for low-latency systems.**

```
Without backpressure:
High load → Queue grows → Latency spikes → Cascade failure

With backpressure:
High load → Reject excess → Stable latency → Graceful degradation
```

Patterns:
- Rate limiting (token bucket, leaky bucket)
- Circuit breaker
- Load shedding
- Queue depth limits

## Connection Pooling

```go
// ✅ Reuse connections
pool := &sql.DB{
    MaxOpenConns: 25,
    MaxIdleConns: 10,
    ConnMaxLifetime: 5 * time.Minute,
}

// ✅ HTTP connection reuse
client := &http.Client{
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 10,
        IdleConnTimeout:     90 * time.Second,
    },
}
```

## Tail Latency

**p99 matters more than average.**

| Metric | Meaning |
|--------|---------|
| p50 | Half of requests faster |
| p95 | 5% are slower |
| p99 | 1% are slower (tail) |
| p99.9 | 0.1% are much slower |

Causes of tail latency:
- GC pauses
- Lock contention
- Cold cache
- Noisy neighbor
- Network jitter

Solutions:
- Hedged requests (send to multiple, take first)
- Deadline propagation
- Request prioritization
