# Profiling

> Measure before optimizing.

## The Golden Rule

```
Don't optimize without profiling.
Don't profile without a problem.
```

## Profiling Types

| Type | Measures | Tools |
|------|----------|-------|
| CPU | Time spent in functions | perf, pprof, flamegraph |
| Memory | Allocations, heap usage | pprof, valgrind |
| I/O | Disk, network operations | strace, iotop |
| Latency | End-to-end timing | tracing, APM |

## Go Profiling

```go
import _ "net/http/pprof"

// Start pprof server
go http.ListenAndServe(":6060", nil)
```

```bash
# CPU profile
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Memory profile
go tool pprof http://localhost:6060/debug/pprof/heap

# Allocations
go tool pprof http://localhost:6060/debug/pprof/allocs

# Goroutines
go tool pprof http://localhost:6060/debug/pprof/goroutine

# Generate flamegraph
go tool pprof -http=:8080 profile.pb.gz
```

## Rust Profiling

```bash
# Build with debug symbols
cargo build --release

# CPU profile with perf
perf record -g ./target/release/app
perf report

# Flamegraph
cargo install flamegraph
cargo flamegraph

# Memory (macOS)
cargo instruments -t Allocations
```

## Benchmarking

### Go

```go
func BenchmarkProcess(b *testing.B) {
    data := setup()
    b.ResetTimer()
    
    for i := 0; i < b.N; i++ {
        process(data)
    }
}

// Run
go test -bench=. -benchmem -count=5
```

### Rust

```rust
use criterion::{criterion_group, criterion_main, Criterion};

fn bench(c: &mut Criterion) {
    let data = setup();
    c.bench_function("process", |b| {
        b.iter(|| process(&data))
    });
}

criterion_group!(benches, bench);
criterion_main!(benches);
```

## Key Metrics

| Metric | Meaning |
|--------|---------|
| Throughput | Requests per second |
| Latency | Time per request |
| CPU % | Processor utilization |
| Memory | Heap usage |
| Allocations | Objects created/freed |
| GC pause | Stop-the-world time |

## Identifying Bottlenecks

```
1. Profile under realistic load
2. Find hotspots (top time consumers)
3. Check: Is it CPU, memory, I/O, or lock contention?
4. Optimize the #1 bottleneck
5. Re-profile
6. Repeat
```

## Common Issues

| Symptom | Likely Cause |
|---------|--------------|
| High CPU, low throughput | Inefficient algorithm |
| Memory keeps growing | Leak, unbounded cache |
| Latency spikes | GC, lock contention |
| High I/O wait | Slow queries, disk |
| Many goroutines/threads | Leak, missing limits |
