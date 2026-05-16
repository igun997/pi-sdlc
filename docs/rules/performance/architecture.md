# High-Performance Architecture

> Patterns for building high-throughput, low-latency systems.

## Core Principles

1. **Measure first** - profile before optimizing
2. **Reduce allocations** - fastest allocation is none
3. **Minimize I/O** - batch, cache, prefetch
4. **Control latency** - set budgets per stage
5. **Design for failure** - graceful degradation

## Architecture Patterns

### 3-Layer Architecture

```
┌─────────────────────┐
│   Presentation      │  ← HTTP, gRPC, WebSocket
├─────────────────────┤
│   Business Logic    │  ← Domain services
├─────────────────────┤
│   Data Access       │  ← Repository, cache
└─────────────────────┘
```

- Scale layers independently
- Isolate concerns
- Clear boundaries

### Event-Driven Architecture

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Service │───▶│  Queue  │───▶│ Service │
└─────────┘    └─────────┘    └─────────┘
     │              │              │
     ▼              ▼              ▼
  Publish       Decouple       Subscribe
```

Benefits:
- Decoupled services
- Parallel processing
- Resilience (retry, DLQ)
- Backpressure handling

### CQRS

```
Commands ──▶ Write Model ──▶ Event Store
                                  │
                                  ▼
Queries ◀── Read Model ◀── Projections
```

Use when:
- Read/write patterns differ significantly
- Need different scaling for reads vs writes
- Complex domain with many views

## Scaling Strategies

| Strategy | Use When |
|----------|----------|
| Vertical | Single bottleneck, simpler |
| Horizontal | Stateless, need elasticity |
| Read replicas | Read-heavy workload |
| Sharding | Write-heavy, large dataset |
| Caching | Repeated reads, expensive queries |
| CDN | Static assets, global users |

## Load Balancing

```
         ┌─────────────┐
         │ Load Balancer│
         └──────┬──────┘
        ┌───────┼───────┐
        ▼       ▼       ▼
    ┌──────┐┌──────┐┌──────┐
    │ App1 ││ App2 ││ App3 │
    └──────┘└──────┘└──────┘
```

Strategies:
- **Round-robin** - simple distribution
- **Least connections** - route to least busy
- **Consistent hashing** - session affinity
- **Weighted** - based on capacity
