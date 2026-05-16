# Rust Async

> Async patterns with Tokio.

## Basic Setup

```rust
use tokio;

#[tokio::main]
async fn main() -> Result<()> {
    let result = fetch_data().await?;
    Ok(())
}

// Or with runtime builder
fn main() -> Result<()> {
    tokio::runtime::Builder::new_multi_thread()
        .worker_threads(4)
        .enable_all()
        .build()?
        .block_on(async_main())
}
```

## Spawning Tasks

```rust
// ✅ Spawn independent tasks
let handle = tokio::spawn(async move {
    process_data(data).await
});

let result = handle.await?;

// ✅ Join multiple tasks
let (a, b, c) = tokio::join!(
    fetch_a(),
    fetch_b(),
    fetch_c(),
);
```

## Select Pattern

```rust
use tokio::select;

async fn with_timeout(duration: Duration) -> Result<Data> {
    select! {
        result = fetch_data() => result,
        _ = tokio::time::sleep(duration) => {
            Err(Error::Timeout)
        }
    }
}

// First to complete wins
select! {
    result = primary_source() => handle(result),
    result = fallback_source() => handle(result),
}
```

## Channels

```rust
use tokio::sync::mpsc;

// Multi-producer, single-consumer
let (tx, mut rx) = mpsc::channel(100);

tokio::spawn(async move {
    while let Some(msg) = rx.recv().await {
        process(msg).await;
    }
});

tx.send(message).await?;

// Broadcast (multi-consumer)
use tokio::sync::broadcast;
let (tx, _) = broadcast::channel(100);
let mut rx1 = tx.subscribe();
let mut rx2 = tx.subscribe();
```

## Concurrency Control

```rust
use tokio::sync::Semaphore;

// Limit concurrent operations
static PERMITS: Semaphore = Semaphore::const_new(10);

async fn limited_operation() -> Result<()> {
    let _permit = PERMITS.acquire().await?;
    // max 10 concurrent executions
    do_work().await
}

// Rate limiting
use tokio::time::{interval, Duration};

let mut interval = interval(Duration::from_millis(100));
for item in items {
    interval.tick().await;  // 10 per second max
    process(item).await;
}
```

## Common Pitfalls

```rust
// ❌ Blocking in async context
async fn bad() {
    std::thread::sleep(Duration::from_secs(1));  // blocks runtime!
}

// ✅ Use async sleep
async fn good() {
    tokio::time::sleep(Duration::from_secs(1)).await;
}

// ❌ Holding lock across await
async fn bad(mutex: &Mutex<Data>) {
    let guard = mutex.lock().await;
    some_async_op().await;  // Still holding lock!
}

// ✅ Release before await
async fn good(mutex: &Mutex<Data>) {
    let data = {
        let guard = mutex.lock().await;
        guard.clone()
    };  // Lock released
    some_async_op().await;
}
```

## Graceful Shutdown

```rust
use tokio::signal;

async fn run() -> Result<()> {
    let (shutdown_tx, shutdown_rx) = tokio::sync::broadcast::channel(1);
    
    let server = tokio::spawn(run_server(shutdown_rx));
    
    // Wait for Ctrl+C
    signal::ctrl_c().await?;
    
    // Signal shutdown
    let _ = shutdown_tx.send(());
    
    // Wait for server to finish
    server.await?
}
```
