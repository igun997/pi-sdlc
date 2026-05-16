# Frontend Security

> Security rules for frontend code.

## XSS Prevention

**#1 Frontend Threat**

```tsx
// ❌ NEVER
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Safe
<div>{userInput}</div>

// ✅ If HTML needed - sanitize
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

## Sensitive Data

**Never store in localStorage:**
- Auth tokens
- Passwords
- API keys
- PII

```tsx
// ❌ Bad
localStorage.setItem('token', authToken)

// ✅ Good - HTTP-only cookies (set by backend)
```

## Input Validation

Validate on client (UX) AND server (security):

```tsx
const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Never trust client validation alone
```
