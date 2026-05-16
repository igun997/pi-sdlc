# Database Optimization

> High-throughput database patterns.

## Query Optimization

**First response to slow DB: check queries, not hardware.**

### Indexing

```sql
-- ✅ Index for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- ✅ Partial index for filtered queries
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- ✅ Covering index (includes all columns needed)
CREATE INDEX idx_orders_summary ON orders(user_id, status, total);
```

### Query Patterns

```sql
-- ❌ Bad: SELECT *
SELECT * FROM orders WHERE user_id = 123;

-- ✅ Good: specific columns
SELECT id, status, total FROM orders WHERE user_id = 123;

-- ❌ Bad: N+1 queries
for user in users:
    orders = SELECT * FROM orders WHERE user_id = user.id

-- ✅ Good: batch query
SELECT * FROM orders WHERE user_id IN (1, 2, 3, ...);
```

### EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;

-- Look for:
-- - Seq Scan (missing index)
-- - High rows vs actual rows (stats outdated)
-- - Nested Loop (consider JOIN optimization)
```

## Connection Management

```go
db.SetMaxOpenConns(25)       // Max active connections
db.SetMaxIdleConns(10)       // Keep idle connections ready
db.SetConnMaxLifetime(5*time.Minute)  // Rotate connections
```

**Pool sizing formula:**
```
connections = (core_count * 2) + effective_spindle_count
```

For SSD: ~10-25 connections usually optimal.

## Read Replicas

```
Writes ──▶ Primary
              │
              ▼ (replication)
Reads  ──▶ Replica 1
       ──▶ Replica 2
       ──▶ Replica 3
```

Use cases:
- Read-heavy workloads (90%+ reads)
- Analytics queries
- Geographic distribution

Caveats:
- Replication lag
- Eventual consistency

## Caching Strategy

```
┌─────────┐    Cache     ┌─────────┐
│   App   │──── Hit ────▶│  Cache  │
│         │              └─────────┘
│         │                  │
│         │◀── Miss ─────────┘
│         │                  │
│         │──── Query ──▶┌─────────┐
│         │◀── Result ───│   DB    │
│         │              └─────────┘
│         │──── Store ──▶┌─────────┐
│         │              │  Cache  │
└─────────┘              └─────────┘
```

Patterns:
- **Cache-aside**: App manages cache + DB
- **Write-through**: Write to cache, cache writes to DB
- **Write-behind**: Async write to DB

## Pagination

```sql
-- ❌ Bad: OFFSET (scans all rows)
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 10000;

-- ✅ Good: Keyset pagination
SELECT * FROM orders 
WHERE id > 10000 
ORDER BY id 
LIMIT 20;
```

## Bulk Operations

```sql
-- ❌ Bad: individual inserts
INSERT INTO logs (msg) VALUES ('a');
INSERT INTO logs (msg) VALUES ('b');
INSERT INTO logs (msg) VALUES ('c');

-- ✅ Good: batch insert
INSERT INTO logs (msg) VALUES ('a'), ('b'), ('c');

-- ✅ Better: COPY (Postgres)
COPY logs (msg) FROM STDIN;
```
