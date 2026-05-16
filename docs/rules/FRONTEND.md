# Frontend Development Rules

> Rules for AI-assisted frontend development. Anti-slop, component design, accessibility, security.

## Core Principles

### 1. No AI Slop

**AI slop = generic AI-generated patterns that ignore project context.**

| Slop Pattern | Why It's Bad | Instead |
|--------------|--------------|---------|
| Purple-blue gradients | Generic, no brand identity | Use project color tokens |
| Glassmorphism cards | Trend-driven, not project-driven | Match existing card components |
| Inter/system fonts | Default, lazy | Use project typography |
| Excessive animations | Distracting, accessibility issues | Match existing motion patterns |
| "Modern" buzzwords | Meaningless filler | Clear, specific copy |
| Rounded everything | Generic aesthetic | Match project border-radius tokens |

### 2. Reference Before Create

**The 3-Reference Rule: Find 3+ existing patterns before creating anything new.**

```
BEFORE writing any component:

1. SEARCH codebase for similar components
2. FIND at least 3 examples
3. IDENTIFY which pattern to follow
4. ASK if none exist or conflict

If <3 references found → ASK user for direction
```

### 3. Component Architecture

**Single Responsibility**
- One component = one purpose
- If describing requires "and", split it

**Composition Over Inheritance**
- Use compound components for flexibility
- Prefer props over internal state
- Children > hardcoded content

**Layout Isolation**
- Components never set their own:
  - Width (use 100% or let parent control)
  - Margin (spacing is parent's job)
  - Position (unless intentionally positioned)
  - Float (deprecated pattern)

```tsx
// ❌ Bad - component controls its layout
const Card = () => (
  <div style={{ width: '300px', margin: '20px' }}>
    ...
  </div>
)

// ✅ Good - parent controls layout
const Card = ({ className }) => (
  <div className={cn('card', className)}>
    ...
  </div>
)
```

### 4. Design Tokens

**Always use project tokens, never hardcode values.**

```tsx
// ❌ Bad
<div style={{ color: '#6366f1', padding: '16px' }}>

// ✅ Good
<div className="text-primary p-4">
```

**Token categories:**
- Colors: `--color-primary`, `--color-secondary`
- Spacing: `--spacing-1`, `--spacing-2`
- Typography: `--font-sans`, `--font-mono`
- Borders: `--radius-sm`, `--radius-md`
- Shadows: `--shadow-sm`, `--shadow-md`

### 5. Prop Validation

**All props must be typed and validated.**

```tsx
// ✅ Required
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
}
```

**Default props explicitly:**
```tsx
const Button = ({ 
  variant = 'primary',
  size = 'md',
  ...props 
}: ButtonProps) => { ... }
```

---

## Accessibility (A11y)

### Mandatory Checklist

Every component MUST:

- [ ] **Keyboard navigable** - all interactive elements reachable via Tab
- [ ] **Focus visible** - clear focus indicators (no `outline: none` without replacement)
- [ ] **ARIA labels** - meaningful labels for screen readers
- [ ] **Color contrast** - 4.5:1 minimum for text
- [ ] **No motion without preference check** - respect `prefers-reduced-motion`

### Semantic HTML

```tsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>
```

| Need | Use | Not |
|------|-----|-----|
| Clickable | `<button>` | `<div onClick>` |
| Navigation | `<a href>` | `<span onClick>` |
| List | `<ul>/<ol>` | `<div>` with bullets |
| Heading | `<h1>`-`<h6>` | `<div class="heading">` |

### Focus Management

```tsx
// Dialog opens → focus first interactive element
useEffect(() => {
  if (isOpen) {
    firstInputRef.current?.focus()
  }
}, [isOpen])

// Focus trap in modals
<FocusTrap active={isOpen}>
  <Dialog>...</Dialog>
</FocusTrap>
```

---

## Security

### XSS Prevention

**#1 Frontend Threat**

```tsx
// ❌ NEVER - direct HTML injection
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Safe - text content only
<div>{userInput}</div>

// ✅ If HTML needed - sanitize first
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### Sensitive Data

**Never store in localStorage:**
- Auth tokens
- Passwords
- API keys
- PII

```tsx
// ❌ Bad
localStorage.setItem('token', authToken)

// ✅ Good - HTTP-only cookies (set by backend)
// Frontend doesn't touch the token directly
```

### Input Validation

```tsx
// Validate on client (UX) AND server (security)
const validateEmail = (email: string) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

// Never trust client validation alone
```

---

## Performance

### Code Splitting

```tsx
// Lazy load routes
const Dashboard = lazy(() => import('./Dashboard'))

// Lazy load heavy components
const ChartLibrary = lazy(() => import('./ChartLibrary'))

// Suspense boundary
<Suspense fallback={<Skeleton />}>
  <Dashboard />
</Suspense>
```

### Memoization

```tsx
// Expensive computations
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
)

// Callback stability
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

// Component memoization (use sparingly)
const ExpensiveList = memo(({ items }) => ...)
```

### Image Optimization

```tsx
// Always specify dimensions (prevents layout shift)
<Image 
  src={src} 
  alt={alt}
  width={300}
  height={200}
  loading="lazy"
/>

// Use modern formats
// WebP > JPEG/PNG for photos
// SVG for icons/illustrations
```

---

## State Management

### Local vs Global

| State Type | Location | Example |
|------------|----------|---------|
| UI state (open/closed) | Component | `useState` |
| Form state | Component/Form lib | `react-hook-form` |
| Server cache | Query library | `tanstack-query` |
| Global app state | Store | `zustand`, `redux` |

### Avoid Prop Drilling

```tsx
// ❌ Bad - drilling through 4 levels
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserAvatar user={user} />
    </Sidebar>
  </Layout>
</App>

// ✅ Good - context or composition
<UserProvider value={user}>
  <App>
    <Layout>
      <Sidebar>
        <UserAvatar /> {/* reads from context */}
      </Sidebar>
    </Layout>
  </App>
</UserProvider>
```

---

## Testing

### Component Tests

```tsx
// Test behavior, not implementation
describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>)
    
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### Accessibility Tests

```tsx
import { axe } from 'jest-axe'

it('has no accessibility violations', async () => {
  const { container } = render(<Component />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## Code Review Checklist

Before any frontend PR:

### Correctness
- [ ] Matches spec/design exactly
- [ ] Edge cases handled (empty, loading, error states)
- [ ] Works across supported browsers

### Style
- [ ] Uses project design tokens
- [ ] Follows existing component patterns
- [ ] No hardcoded colors/spacing/fonts

### Accessibility
- [ ] Keyboard navigable
- [ ] Screen reader tested
- [ ] Focus states visible
- [ ] ARIA labels meaningful

### Performance
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Heavy components lazy loaded

### Security
- [ ] No dangerouslySetInnerHTML with user input
- [ ] No sensitive data in localStorage
- [ ] Inputs validated

### Testing
- [ ] Component tests written
- [ ] Accessibility tests pass
- [ ] Visual regression (if applicable)
