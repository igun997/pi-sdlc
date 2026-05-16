# Go Performance

> Optimization patterns for high-performance Go.

## Reduce Allocations

**The fastest allocation is the one that never happens.**

### Pre-allocate Slices

```go
// ❌ Bad - multiple reallocations
var items []Item
for _, v := range data {
    items = append(items, process(v))
}

// ✅ Good - single allocation
items := make([]Item, 0, len(data))
for _, v := range data {
    items = append(items, process(v))
}
```

### Object Pooling

```go
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func process(data []byte) {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufferPool.Put(buf)
    }()
    
    buf.Write(data)
    // use buf
}
```

### Avoid String Conversions

```go
// ❌ Bad - allocates new string
s := string(byteSlice)
process(s)

// ✅ Good - use bytes directly if possible
processBytes(byteSlice)

// ✅ Or unsafe conversion if read-only
import "unsafe"
s := unsafe.String(&byteSlice[0], len(byteSlice))
```

## Escape Analysis

```go
// ❌ Escapes to heap (pointer returned)
func newUser() *User {
    u := User{Name: "test"}
    return &u  // escapes
}

// ✅ Stack allocated (value returned, copied)
func newUser() User {
    return User{Name: "test"}
}

// Check escapes: go build -gcflags="-m"
```

## Reduce GC Pressure

```go
// ✅ Reuse buffers
type Handler struct {
    buf []byte  // reusable buffer
}

func (h *Handler) Process(data []byte) {
    h.buf = h.buf[:0]  // reset without alloc
    h.buf = append(h.buf, data...)
}

// ✅ Use value types in hot paths
type Point struct {
    X, Y float64  // No pointers = no GC scanning
}
```

## Profiling

```go
import _ "net/http/pprof"

// Start server with pprof
go http.ListenAndServe(":6060", nil)

// Profile commands:
// go tool pprof http://localhost:6060/debug/pprof/heap
// go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
// go tool pprof http://localhost:6060/debug/pprof/allocs
```

## Benchmarking

```go
func BenchmarkProcess(b *testing.B) {
    data := makeTestData()
    b.ResetTimer()
    
    for i := 0; i < b.N; i++ {
        process(data)
    }
}

// Run: go test -bench=. -benchmem
// Output: BenchmarkProcess-8  1000000  1234 ns/op  256 B/op  3 allocs/op
```

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Slice append in loop | Pre-allocate with `make([]T, 0, n)` |
| String concatenation | Use `strings.Builder` |
| Interface boxing | Use concrete types in hot paths |
| Large struct copies | Pass by pointer |
| Lock contention | Use `sync.RWMutex` or sharding |
