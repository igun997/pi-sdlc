# Rust Performance

> Zero-cost abstractions and optimization patterns.

## Zero-Copy Patterns

```rust
// ✅ Use slices instead of owned data
fn process(data: &[u8]) -> &[u8] {
    &data[10..20]  // No allocation
}

// ✅ bytes crate for zero-copy buffers
use bytes::Bytes;

fn handle_request(data: Bytes) -> Bytes {
    data.slice(10..20)  // Reference-counted, no copy
}

// ✅ Cow for conditional ownership
use std::borrow::Cow;

fn process(input: &str) -> Cow<str> {
    if needs_change(input) {
        Cow::Owned(transform(input))
    } else {
        Cow::Borrowed(input)  // No allocation
    }
}
```

## Memory Layout

```rust
// ✅ Pack structs for cache efficiency
#[repr(C)]
struct Packed {
    a: u64,  // 8 bytes
    b: u32,  // 4 bytes
    c: u16,  // 2 bytes
    d: u8,   // 1 byte
    e: u8,   // 1 byte
}  // 16 bytes total, no padding

// ❌ Unordered fields = padding
struct Padded {
    a: u8,   // 1 byte + 7 padding
    b: u64,  // 8 bytes
    c: u8,   // 1 byte + 3 padding
    d: u32,  // 4 bytes
}  // 24 bytes with padding!
```

## Avoiding Allocations

```rust
// ✅ SmallVec for usually-small collections
use smallvec::SmallVec;

let mut vec: SmallVec<[i32; 8]> = SmallVec::new();
// Stack allocated until > 8 elements

// ✅ ArrayVec for fixed max size
use arrayvec::ArrayVec;

let mut vec: ArrayVec<i32, 16> = ArrayVec::new();
// Always stack, panics if > 16

// ✅ Reuse allocations
let mut buffer = Vec::with_capacity(1024);
for data in inputs {
    buffer.clear();  // Reuse allocation
    process_into(&mut buffer, data);
}
```

## SIMD and Vectorization

```rust
// Compiler auto-vectorizes simple loops
fn sum(data: &[f32]) -> f32 {
    data.iter().sum()  // Often vectorized
}

// ✅ Help compiler with chunks
fn dot_product(a: &[f32], b: &[f32]) -> f32 {
    a.chunks_exact(4)
        .zip(b.chunks_exact(4))
        .map(|(a, b)| {
            a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3]
        })
        .sum()
}
```

## Benchmarking

```rust
// Cargo.toml: criterion = "0.5"

use criterion::{criterion_group, criterion_main, Criterion};

fn bench_process(c: &mut Criterion) {
    let data = generate_test_data();
    
    c.bench_function("process", |b| {
        b.iter(|| process(&data))
    });
}

criterion_group!(benches, bench_process);
criterion_main!(benches);

// Run: cargo bench
```

## Profiling

```bash
# CPU profiling with perf
cargo build --release
perf record -g ./target/release/app
perf report

# Flamegraph
cargo install flamegraph
cargo flamegraph

# Memory profiling
cargo install cargo-instruments  # macOS
cargo instruments -t Allocations
```

## Common Optimizations

| Pattern | Use |
|---------|-----|
| `Box<[T]>` | Fixed-size heap slice (smaller than Vec) |
| `Rc`/`Arc` | Share instead of clone |
| `&str` | Borrow strings, not `String` |
| `Cow<str>` | Clone only when needed |
| `#[inline]` | Hot functions (profile first) |
| `#[cold]` | Error paths |
