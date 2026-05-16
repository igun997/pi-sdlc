# Go Patterns

> Idiomatic Go patterns and best practices.

## Project Structure

```
project/
├── cmd/
│   └── app/
│       └── main.go         # Entry point
├── internal/               # Private packages
│   ├── domain/             # Business entities
│   ├── service/            # Business logic
│   ├── repository/         # Data access
│   └── handler/            # HTTP/gRPC handlers
├── pkg/                    # Public packages
├── api/                    # API definitions (OpenAPI, proto)
├── configs/                # Config files
├── scripts/                # Build/deploy scripts
└── go.mod
```

## Dependency Injection

```go
// ✅ Constructor injection
type UserService struct {
    repo   UserRepository
    logger Logger
}

func NewUserService(repo UserRepository, logger Logger) *UserService {
    return &UserService{repo: repo, logger: logger}
}

// ❌ Global dependencies
var db *sql.DB  // Hard to test
```

## Error Handling

```go
// ✅ Wrap errors with context
if err != nil {
    return fmt.Errorf("failed to create user: %w", err)
}

// ✅ Custom errors
type NotFoundError struct {
    Resource string
    ID       string
}

func (e NotFoundError) Error() string {
    return fmt.Sprintf("%s not found: %s", e.Resource, e.ID)
}

// Check error type
var notFound *NotFoundError
if errors.As(err, &notFound) {
    // handle not found
}
```

## Interface Design

```go
// ✅ Small interfaces (1-3 methods)
type Reader interface {
    Read(p []byte) (n int, err error)
}

type UserRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
    Save(ctx context.Context, user *User) error
}

// ❌ Large interfaces
type UserManager interface {
    FindByID(...)
    FindByEmail(...)
    Save(...)
    Delete(...)
    // ... 10 more methods
}
```

## Context Usage

```go
// ✅ Pass context as first param
func (s *Service) GetUser(ctx context.Context, id string) (*User, error) {
    // Check cancellation
    select {
    case <-ctx.Done():
        return nil, ctx.Err()
    default:
    }
    
    return s.repo.FindByID(ctx, id)
}

// ✅ Add timeout
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
```

## Concurrency

```go
// ✅ Use channels for communication
results := make(chan Result, len(items))

for _, item := range items {
    go func(item Item) {
        results <- process(item)
    }(item)
}

// ✅ Use errgroup for parallel with errors
g, ctx := errgroup.WithContext(ctx)
for _, url := range urls {
    url := url
    g.Go(func() error {
        return fetch(ctx, url)
    })
}
if err := g.Wait(); err != nil {
    return err
}
```

## Struct Design

```go
// ✅ Zero value should be useful
type Buffer struct {
    buf []byte
    // No explicit initialization needed
}

// ✅ Options pattern for complex construction
type ServerOption func(*Server)

func WithPort(port int) ServerOption {
    return func(s *Server) { s.port = port }
}

func NewServer(opts ...ServerOption) *Server {
    s := &Server{port: 8080} // defaults
    for _, opt := range opts {
        opt(s)
    }
    return s
}
```
