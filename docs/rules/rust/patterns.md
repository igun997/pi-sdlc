# Rust Patterns

> Idiomatic Rust patterns and best practices.

## Project Structure

```
project/
├── src/
│   ├── main.rs             # Binary entry
│   ├── lib.rs              # Library root
│   ├── domain/             # Business entities
│   │   └── mod.rs
│   ├── service/            # Business logic
│   │   └── mod.rs
│   └── repository/         # Data access
│       └── mod.rs
├── tests/                  # Integration tests
├── benches/                # Benchmarks
├── examples/               # Example code
└── Cargo.toml
```

## Error Handling

```rust
// ✅ Use thiserror for library errors
use thiserror::Error;

#[derive(Error, Debug)]
pub enum UserError {
    #[error("user not found: {0}")]
    NotFound(String),
    
    #[error("validation failed: {0}")]
    Validation(String),
    
    #[error(transparent)]
    Database(#[from] sqlx::Error),
}

// ✅ Use anyhow for application errors
use anyhow::{Context, Result};

fn load_config() -> Result<Config> {
    let content = fs::read_to_string("config.toml")
        .context("failed to read config file")?;
    
    toml::from_str(&content)
        .context("failed to parse config")
}
```

## Ownership & Borrowing

```rust
// ✅ Prefer borrowing over ownership
fn process(data: &[u8]) -> Result<Output> {
    // borrow, don't take ownership
}

// ✅ Use Cow for optional ownership
use std::borrow::Cow;

fn process(data: Cow<str>) -> String {
    if needs_modification(&data) {
        data.into_owned()  // clone only if needed
    } else {
        data.into_owned()
    }
}
```

## Interior Mutability

```rust
// Single-threaded: RefCell
use std::cell::RefCell;

struct Cache {
    data: RefCell<HashMap<String, Value>>,
}

impl Cache {
    fn get(&self, key: &str) -> Option<Value> {
        self.data.borrow().get(key).cloned()
    }
    
    fn insert(&self, key: String, value: Value) {
        self.data.borrow_mut().insert(key, value);
    }
}

// Multi-threaded: RwLock
use std::sync::RwLock;

struct SharedCache {
    data: RwLock<HashMap<String, Value>>,
}
```

## Builder Pattern

```rust
#[derive(Default)]
pub struct RequestBuilder {
    url: Option<String>,
    timeout: Option<Duration>,
    headers: Vec<(String, String)>,
}

impl RequestBuilder {
    pub fn url(mut self, url: impl Into<String>) -> Self {
        self.url = Some(url.into());
        self
    }
    
    pub fn timeout(mut self, timeout: Duration) -> Self {
        self.timeout = Some(timeout);
        self
    }
    
    pub fn build(self) -> Result<Request, BuildError> {
        let url = self.url.ok_or(BuildError::MissingUrl)?;
        Ok(Request {
            url,
            timeout: self.timeout.unwrap_or(Duration::from_secs(30)),
            headers: self.headers,
        })
    }
}

// Usage
let req = RequestBuilder::default()
    .url("https://api.example.com")
    .timeout(Duration::from_secs(10))
    .build()?;
```

## Trait Design

```rust
// ✅ Small, focused traits
pub trait Repository<T> {
    fn find_by_id(&self, id: &str) -> Result<Option<T>>;
    fn save(&self, entity: &T) -> Result<()>;
}

// ✅ Use associated types
pub trait Handler {
    type Request;
    type Response;
    type Error;
    
    fn handle(&self, req: Self::Request) -> Result<Self::Response, Self::Error>;
}
```

## Type State Pattern

```rust
// Compile-time state enforcement
struct Request<State> {
    url: String,
    _state: PhantomData<State>,
}

struct NotSent;
struct Sent;

impl Request<NotSent> {
    fn send(self) -> Request<Sent> {
        // send request
        Request { url: self.url, _state: PhantomData }
    }
}

impl Request<Sent> {
    fn response(&self) -> Response {
        // get response (only available after send)
    }
}
```
