# A&L Bakes FYP Presentation Script
## For Doctor Nura - Live Demo & Implementation Showcase

---

## PART 1: OPENING (2 minutes)

**[SLIDE: Title]**

> "Good morning/afternoon Dr. Nura. Today I'll demonstrate A&L Bakes - a full-stack e-commerce platform I built for a local bakery business.
>
> While this may seem overengineered for a micro-business that processes fewer than 10 orders per week, I intentionally designed it with enterprise patterns to demonstrate scalability, security best practices, and real-world deployment strategies.
>
> The architecture I'll show you can handle anywhere from 10 to 10,000 orders without modification - and I'll explain exactly why."

---

## PART 2: ARCHITECTURE OVERVIEW (5 minutes)

**[SLIDE: System Architecture Diagram]**

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER DEVICES                                  │
│                    (Browser / Mobile)                                 │
└─────────────────────────┬────────────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    AWS CLOUDFRONT (CDN)                               │
│              Distribution: E3AJKL534XOW59                            │
│         - SSL/TLS Termination                                         │
│         - Global Edge Caching                                         │
│         - Automatic Cache Invalidation on Deploy                      │
└─────────────────────────┬────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────┐         ┌─────────────────────────────────────┐
│   S3 BUCKET         │         │   ELASTIC BEANSTALK                 │
│   (Frontend)        │         │   (Backend API)                     │
│                     │         │                                     │
│ React SPA           │  API    │ ┌─────────────────────────────────┐ │
│ - Vite Build        │ Calls   │ │  Docker Container               │ │
│ - Static Assets     │────────▶│ │  - Express.js Server            │ │
│                     │         │ │  - Node.js 20                   │ │
└─────────────────────┘         │ │  - Port 5000                    │ │
                                │ └─────────────────────────────────┘ │
                                │              │                      │
                                └──────────────┼──────────────────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                 ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                 │ RDS         │      │ Stripe API  │      │ Gmail SMTP  │
                 │ PostgreSQL  │      │ (Payments)  │      │ (Emails)    │
                 │ 16          │      │             │      │             │
                 └─────────────┘      └─────────────┘      └─────────────┘
```

**Script:**

> "The architecture follows a three-tier pattern:
>
> **Presentation Layer** - A React single-page application served through CloudFront CDN. This gives us global edge caching and sub-100ms load times.
>
> **Application Layer** - A Node.js Express API running in a Docker container on Elastic Beanstalk. This handles all business logic, authentication, and integrations.
>
> **Data Layer** - PostgreSQL on RDS for persistent storage, Stripe for payment processing, and Gmail SMTP for transactional emails.
>
> The key architectural decision here is **separation of concerns**. The frontend never touches the database. The backend never serves static files. Each component can scale independently."

---

## PART 3: USER FLOW DEMONSTRATION (8 minutes)

### 3.1 Customer Journey

**[LIVE DEMO: Open albakes website]**

> "Let me walk you through the core customer journey."

**Step 1: Browse Products**
> "The homepage loads products from `/api/products`. Each product card shows name, price in GBP, and category. Notice prices are stored as integers in pence - £24.99 becomes 2499 - to avoid floating-point precision errors."

**[Click a product]**

**Step 2: Product Customisation**
> "On the product detail page, customers can customise their order - size, flavour, and a personalised message for cakes. The cart uses React Context with localStorage persistence, so cart state survives page refreshes and browser restarts."

**[Add to cart, show cart badge updating]**

**Step 3: Checkout Flow**
> "The checkout is a three-step process:
> 1. Customer details - validated client-side with 7-day minimum lead time
> 2. Review order - shows summary with delivery fee calculation
> 3. Stripe Checkout - secure, PCI-compliant payment page"

**[Navigate to checkout, fill form]**

> "Notice the 7-day lead time validation. This is a business rule - bespoke cakes need preparation time. The validation happens both client-side for UX and server-side for security."

**Step 4: Payment (Stripe)**
> "When the user clicks 'Pay with Stripe', we redirect to Stripe's hosted checkout. This is critical for PCI compliance - card numbers never touch our servers. Stripe handles 3D Secure, Apple Pay, Google Pay automatically."

**[Show Stripe redirect - don't complete payment in demo]**

**Step 5: Order Confirmation**
> "After payment, Stripe redirects back with a session ID. The frontend calls `/api/orders/from-session` which:
> 1. Checks idempotency - has this order already been created?
> 2. Verifies payment status with Stripe API
> 3. Creates order in a database transaction
> 4. Sends confirmation emails asynchronously
>
> The idempotency check is crucial - if a user refreshes the success page, we don't create duplicate orders."

---

### 3.2 Admin Journey

**[LIVE DEMO: Navigate to /admin/login]**

> "The admin dashboard provides full order management and business analytics."

**[Login with admin credentials]**

**Order Management:**
> "Admins see all orders with status filtering. They can update order status through the lifecycle: pending → preparing → ready → collected. Each status change creates an audit event in `order_events` table."

**Product Management:**
> "Full CRUD for products - create, edit, toggle featured/active status, delete. Image URLs point to existing assets; in production, we'd integrate S3 uploads."

**Sales Analytics:**
> "The sales dashboard shows revenue totals, order counts, and top products. These are computed with SQL aggregations - no external analytics service needed for this scale."

**Review Moderation:**
> "Customer reviews go through an approval workflow. Admins can approve, reject, or delete reviews. The `review_reports` table tracks complaints for moderation."

---

## PART 4: CODE IMPLEMENTATION DEEP DIVE (6 minutes)

### 4.1 Authentication Architecture

**[SLIDE: Auth Flow Diagram]**

```
Customer Login:
┌─────────┐    POST /api/auth/customer/login    ┌─────────┐
│ Browser │ ─────────────────────────────────▶  │ Server  │
│         │    { email, password }              │         │
│         │                                     │         │
│         │    Set-Cookie: albakes_customer=    │         │
│         │ ◀───────────────────────────────── │         │
│         │    JWT (httpOnly, 7 days)           │         │
└─────────┘                                     └─────────┘

Subsequent Requests:
┌─────────┐    GET /api/customer/profile        ┌─────────┐
│ Browser │ ─────────────────────────────────▶  │ Server  │
│         │    Cookie: albakes_customer=JWT     │         │
│         │                                     │         │
│         │    requireCustomer middleware       │         │
│         │    → verify JWT → attach req.user   │         │
└─────────┘                                     └─────────┘
```

**Script:**

> "Authentication uses JWT tokens stored in httpOnly cookies. This is more secure than localStorage because JavaScript cannot access httpOnly cookies - protecting against XSS attacks.
>
> Passwords are hashed with bcrypt using 12 rounds. The salt is embedded in the hash, so we don't store it separately.
>
> I implemented separate cookies for customer and admin sessions - `albakes_customer` and `albakes_admin` - with different expiry times. Customer sessions last 7 days; admin sessions last 8 hours for security."

**[Show code: server/middleware/requireAdmin.js]**

```javascript
// JWT verification pattern
const token = req.cookies.albakes_admin;
if (!token) return res.status(401).json({ error: "Not authenticated" });

const decoded = jwt.verify(token, process.env.JWT_SECRET);
if (decoded.role !== "admin") return res.status(403).json({ error: "Not authorized" });

req.user = decoded;
next();
```

---

### 4.2 Order Creation with Idempotency

**[Show code: server/controllers/orders.controller.js lines 62-200]**

> "This is the most critical piece of business logic. When creating an order from a Stripe session:
>
> 1. **Idempotency check** - Query for existing order with same session ID
> 2. **Stripe verification** - Confirm payment_status is 'paid'
> 3. **Transaction** - BEGIN, INSERT order, INSERT items, INSERT event, COMMIT
> 4. **Async emails** - Fire and forget, don't block response
>
> The `ON CONFLICT` clause handles race conditions - if two requests arrive simultaneously, only one order is created."

```javascript
// Idempotency - prevents duplicate orders
const existing = await pool.query(
  "SELECT id FROM orders WHERE stripe_session_id = $1",
  [sessionId]
);
if (existing.rows.length) {
  return res.json({ orderId: existing.rows[0].id, alreadyExisted: true });
}
```

---

### 4.3 Cart State Management

**[Show code: client/src/context/CartProvider.jsx]**

> "The cart uses React Context with a reducer pattern. Key features:
>
> - **Persistence**: Cart syncs to localStorage on every change
> - **Merge logic**: Same product + customisation → increment quantity
> - **Quantity limits**: Max 3 per item (business rule)
> - **Unique keys**: Generated from productId + customisation JSON"

```javascript
const addItem = (product, customisation, qty = 1) => {
  const key = JSON.stringify({ productId: product.id, customisation });
  // ... merge or add logic
};
```

---

## PART 5: DEPLOYMENT & CI/CD (4 minutes)

**[SLIDE: CI/CD Pipeline]**

```
Developer pushes to main branch
            │
            ▼
    GitHub Actions Triggered
            │
    ┌───────┴───────┐
    ▼               ▼
Backend          Frontend
Pipeline         Pipeline
    │               │
    ▼               ▼
npm test        npm lint
npm test         npm test
    │               │
    ▼               ▼
Docker build    Vite build
    │               │
    ▼               ▼
Push to ECR     Sync to S3
    │               │
    ▼               ▼
Deploy to EB    Invalidate
                CloudFront
```

**Script:**

> "Deployment is fully automated through GitHub Actions. When code is pushed to main:
>
> 1. Tests run first - if they fail, deployment stops
> 2. Backend: Docker image built, pushed to ECR, deployed to Elastic Beanstalk
> 3. Frontend: Vite build, sync to S3, CloudFront cache invalidated
>
> This ensures broken code never reaches production."

---

### Honest Development Story

**[SLIDE: CloudWatch Error Rate Graph - show the spikes]**

> "I want to be transparent about my development process. During Sprint 3, I was iterating rapidly on features and sometimes bypassed the CI/CD pipeline, deploying directly to AWS to test quickly.
>
> This introduced instability - you can see the error rate spikes in CloudWatch around early February. This experience reinforced exactly why the pipeline exists.
>
> I subsequently re-established the correct workflow: running changes through Docker locally, verifying features, then deploying via the proper CI/CD process. The CloudWatch dashboard confirms the production environment stabilised after this.
>
> This isn't a weakness - it's a real-world lesson about the importance of deployment discipline, backed by evidence from my own monitoring."

---

## PART 6: SCALABILITY ANALYSIS (3 minutes)

**[SLIDE: Scalability Table]**

| Component | Current Setup | Scales To | How |
|-----------|--------------|-----------|-----|
| Frontend | CloudFront CDN | Millions of users | Edge caching, no changes needed |
| API Server | Single EB instance | 10,000+ orders/day | Enable auto-scaling group |
| Database | RDS t3.micro | 100,000+ rows | Vertical scaling, read replicas |
| Payments | Stripe API | Unlimited | Already enterprise-grade |

**Script:**

> "Can this platform handle 10,000 orders? Yes, with minimal changes:
>
> **Frontend**: Already globally distributed via CloudFront. No changes needed.
>
> **Backend**: Currently single instance. Elastic Beanstalk auto-scaling is configuration, not code. Set min/max instances, CPU threshold - done.
>
> **Database**: RDS can scale vertically (larger instance) or horizontally (read replicas). The schema is normalised and indexed on foreign keys.
>
> **Bottleneck**: The current limiting factor is the single EC2 instance. At approximately 100 concurrent requests, we'd need to enable auto-scaling. But that's a 5-minute configuration change, not an architecture rewrite.
>
> The architecture is designed for growth. We're not prematurely optimising, but we're not painting ourselves into a corner either."

---

## PART 7: SECURITY DECISIONS (3 minutes)

**[SLIDE: Security Checklist]**

| Threat | Mitigation |
|--------|------------|
| XSS | httpOnly cookies (JS cannot access tokens) |
| SQL Injection | Parameterised queries (`$1, $2` not string concat) |
| Password Theft | bcrypt hashing (12 rounds, salted) |
| Session Hijacking | Secure, SameSite cookies; short admin sessions |
| Payment Fraud | Stripe Checkout (PCI-compliant, we never see cards) |
| Brute Force | Password strength requirements, rate limiting possible |

**Script:**

> "Security was a first-class concern, not an afterthought:
>
> - **Never store raw passwords** - bcrypt with automatic salting
> - **Never handle card data** - Stripe's hosted checkout
> - **Never trust client input** - server-side validation on all endpoints
> - **Never expose tokens to JavaScript** - httpOnly cookies
>
> The password reset flow uses cryptographically random tokens with 1-hour expiry and single-use enforcement."

---

## PART 8: TRADE-OFFS & DECISIONS (2 minutes)

**[SLIDE: Trade-offs]**

| Decision | Why | Trade-off |
|----------|-----|-----------|
| Gmail SMTP vs AWS SES | Simpler setup, works immediately | Less scalable, sender reputation |
| Raw SQL vs ORM | Full control, faster | More verbose, no migrations library |
| Single instance vs cluster | Cost reduction | No high availability |
| No Multi-AZ RDS | Cost reduction | Single point of failure |

**Script:**

> "Every architectural decision has trade-offs. I chose Gmail SMTP over AWS SES because it works immediately without domain verification - but for production at scale, SES would be better.
>
> I used raw SQL instead of an ORM like Prisma because I wanted full control over queries and to demonstrate understanding of SQL, not hide behind abstractions.
>
> These are conscious decisions for an MVP, documented with clear upgrade paths."

---

## PART 9: HEURISTICS & PROBLEMS SOLVED (2 minutes)

**[SLIDE: Problems Solved]**

1. **Floating-point precision** → Store prices as integers in pence
2. **Duplicate orders** → Idempotency check on Stripe session ID
3. **Cart persistence** → localStorage with React Context sync
4. **7-day lead time** → Client + server validation
5. **Admin approval workflow** → Database role + approval flags
6. **Review moderation** → Status field + reports table
7. **Password reset** → Crypto-random tokens, 1-hour expiry

**Script:**

> "These aren't theoretical problems - I encountered each one during development:
>
> - The floating-point issue caused £24.99 + £4.99 to display incorrectly until I switched to pence
> - The duplicate order bug appeared when I refreshed the success page during testing
> - The cart was lost on every page refresh until I added localStorage sync"

---

## PART 10: CLOSING (1 minute)

> "In summary, A&L Bakes demonstrates:
>
> - **Full-stack implementation** - React, Node.js, PostgreSQL, AWS
> - **Production-grade security** - JWT, bcrypt, httpOnly cookies, Stripe
> - **Real deployment** - CI/CD, Docker, Elastic Beanstalk, CloudFront
> - **Scalable architecture** - Can grow from 10 to 10,000 orders
> - **Honest development** - Learned from mistakes, improved process
>
> The live demo shows these aren't just diagrams - it's a working system processing real payments.
>
> Thank you. I'm happy to answer questions or dive deeper into any component."

---

## APPENDIX: SCREENSHOTS TO PREPARE

1. **Architecture Diagram** - System overview (draw.io or Lucidchart)
2. **CloudWatch Dashboard** - Error rate graph showing stabilisation
3. **GitHub Actions** - Successful pipeline run
4. **EB Dashboard** - Health status green
5. **Database Schema** - ERD diagram
6. **Stripe Dashboard** - Test payments
7. **Mobile Responsive** - Phone view of site

**Recommendation**: Yes, use screenshots for architecture. Diagrams are essential for explaining system design. Include:
- One high-level architecture diagram
- One authentication flow diagram
- One deployment pipeline diagram
- The CloudWatch graph (shows real monitoring)

---

## QUICK REFERENCE: KEY CODE LOCATIONS

| What | File | Lines |
|------|------|-------|
| Auth middleware | `server/middleware/requireAdmin.js` | All |
| Order creation | `server/controllers/orders.controller.js` | 62-252 |
| Cart context | `client/src/context/CartProvider.jsx` | All |
| Stripe checkout | `server/index.js` | ~450-520 |
| 7-day validation | `client/src/Checkout.jsx` | 100-111 |
| Password reset | `server/controllers/customer.auth.controller.js` | 150-250 |
| Email service | `server/services/email.service.js` | All |
