# Lessons Learned - A&L Bakes Development

> **Purpose**: Document design patterns, edge cases, bugs fixed, and insights for your dissertation.
> **Started**: 2026-02-02
> **Study Hours Logged**: 0 / 52

---

## How to Use This Document

After each debugging session, add entries under the relevant section:
- What you discovered
- Why it works that way
- Any bugs you fixed
- Code snippets that clarified your understanding

---

## 1. Design Patterns Observed

### 1.1 Controller-Route Separation
**Where**: `server/controllers/` and `server/routes/`

**Pattern**: Routes define endpoints, controllers contain logic.

```javascript
// Route: thin, just maps URL to handler
router.post("/login", adminLogin);

// Controller: thick, contains business logic
export async function adminLogin(req, res) {
  // validation, db queries, response
}
```

**Why**: Separation of concerns. Routes are easy to scan, logic is testable.

---

### 1.2 [Add Your Observations]

**Where**:

**Pattern**:

**Why**:

---

## 2. Authentication Flow Deep Dive

### Session: _______________
### Date: _______________

**What I traced**:

**Key insight**:

**Code that clarified it**:
```javascript

```

---

## 3. Checkout/Payment Flow Deep Dive

### Session: _______________
### Date: _______________

**What I traced**:

**Key insight**:

**Code that clarified it**:
```javascript

```

---

## 4. Bugs Discovered & Fixed

### Bug #1: [Title]
**Date**:
**Symptoms**:
**Root cause**:
**Fix**:
```diff
- old code
+ new code
```

---

### Bug #2: [Title]
**Date**:
**Symptoms**:
**Root cause**:
**Fix**:

---

## 5. Edge Cases Discovered

### Edge Case #1: [Title]
**Scenario**:
**How system handles it**:
**Code location**:

---

### Edge Case #2: [Title]
**Scenario**:
**How system handles it**:
**Code location**:

---

## 6. Variables/Functions I Renamed

| Original | Renamed To | File | Why |
|----------|------------|------|-----|
| | | | |
| | | | |

---

## 7. Unit Tests Written

| Test File | What It Tests | Pass/Fail | Notes |
|-----------|---------------|-----------|-------|
| | | | |
| | | | |

---

## 8. Questions for Dissertation

1.
2.
3.

---

## 9. Study Session Log

| Date | Hours | Focus Area | Key Learnings |
|------|-------|------------|---------------|
| 2026-02-02 | | Architecture overview | |
| | | | |
| | | | |
| | | | |

---

## 10. Security Features I Understand

- [ ] bcrypt password hashing (12 rounds)
- [ ] JWT in httpOnly cookies
- [ ] CSRF protection via sameSite
- [ ] Email enumeration prevention
- [ ] Idempotent order creation
- [ ] Role-based middleware (requireAdmin/requireCustomer)
- [ ] Parameterized SQL queries (SQL injection prevention)

---

## 11. Dissertation-Ready Explanations

### How does authentication work in this system?

[Write your explanation here after studying]

---

### How does the checkout flow prevent payment fraud?

[Write your explanation here after studying]

---

### What database design decisions were made and why?

[Write your explanation here after studying]

---

*Keep adding entries as you study. This becomes your dissertation evidence.*
