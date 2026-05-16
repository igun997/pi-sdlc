# Component Architecture

> Rules for building frontend components.

## Single Responsibility

- One component = one purpose
- If describing requires "and", split it

## Composition Over Inheritance

- Use compound components for flexibility
- Prefer props over internal state
- Children > hardcoded content

## Layout Isolation

Components never set their own:
- Width (use 100% or let parent control)
- Margin (spacing is parent's job)
- Position (unless intentionally positioned)

```tsx
// ❌ Bad
const Card = () => (
  <div style={{ width: '300px', margin: '20px' }}>

// ✅ Good
const Card = ({ className }) => (
  <div className={cn('card', className)}>
```

## Prop Validation

All props typed:

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  children: React.ReactNode
}
```

## Design Tokens

Always use project tokens:

```tsx
// ❌ Bad
<div style={{ color: '#6366f1', padding: '16px' }}>

// ✅ Good
<div className="text-primary p-4">
```
