# Accessibility (A11y)

> Mandatory accessibility requirements.

## Checklist

Every component MUST:

- [ ] **Keyboard navigable** - all interactive elements reachable via Tab
- [ ] **Focus visible** - clear focus indicators
- [ ] **ARIA labels** - meaningful labels for screen readers
- [ ] **Color contrast** - 4.5:1 minimum for text
- [ ] **Motion preference** - respect `prefers-reduced-motion`

## Semantic HTML

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

## Focus Management

```tsx
// Dialog opens → focus first element
useEffect(() => {
  if (isOpen) firstInputRef.current?.focus()
}, [isOpen])

// Focus trap in modals
<FocusTrap active={isOpen}>
  <Dialog>...</Dialog>
</FocusTrap>
```

## Testing

```tsx
import { axe } from 'jest-axe'

it('has no a11y violations', async () => {
  const { container } = render(<Component />)
  expect(await axe(container)).toHaveNoViolations()
})
```
