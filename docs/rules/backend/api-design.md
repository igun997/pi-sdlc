# API Design

> REST conventions and best practices.

## Resource URLs

```
# ❌ Bad
POST /createUser
GET /getUserById?id=123

# ✅ Good
POST /users
GET /users/123
DELETE /users/123
```

## HTTP Methods

| Method | Purpose | Idempotent |
|--------|---------|------------|
| GET | Read | Yes |
| POST | Create | No |
| PUT | Replace | Yes |
| PATCH | Update | Yes |
| DELETE | Remove | Yes |

## Status Codes

| Code | Use For |
|------|---------|
| 200 | Successful GET/PUT/PATCH |
| 201 | Successful POST |
| 204 | Successful DELETE |
| 400 | Validation error |
| 401 | Missing/invalid auth |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict/duplicate |
| 500 | Server error |

## Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid format" }
    ],
    "traceId": "abc-123"
  }
}
```

## Pagination

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasNext": true
  }
}
```
