# Frontend Performance

> Performance optimization rules.

## Code Splitting

```tsx
// Lazy load routes
const Dashboard = lazy(() => import('./Dashboard'))

// Suspense boundary
<Suspense fallback={<Skeleton />}>
  <Dashboard />
</Suspense>
```

## Memoization

```tsx
// Expensive computations
const sorted = useMemo(() => items.sort(...), [items])

// Callback stability
const handleClick = useCallback(() => doSomething(id), [id])

// Component memo (use sparingly)
const List = memo(({ items }) => ...)
```

## Images

```tsx
// Always specify dimensions
<Image 
  src={src} 
  alt={alt}
  width={300}
  height={200}
  loading="lazy"
/>

// Use modern formats: WebP > JPEG/PNG
```

## State

| State Type | Location |
|------------|----------|
| UI state | `useState` |
| Form state | `react-hook-form` |
| Server cache | `tanstack-query` |
| Global app | `zustand`/`redux` |
