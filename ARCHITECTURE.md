# A&L Bakes - System Architecture

> **Purpose**: This document maps the entire codebase to help you understand, debug, and own the code.
> **Total Lines**: ~7,600 (excluding comments) across 65+ files

---

## 1. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + Vite | Single Page Application (SPA) |
| **Routing** | React Router v7 | Client-side navigation |
| **State** | React Context API | Global state (cart, auth) |
| **Backend** | Express.js (Node) | REST API server |
| **Database** | PostgreSQL | Relational data storage |
| **ORM** | Raw SQL (pg driver) | Database queries |
| **Auth** | JWT + httpOnly cookies | Stateless authentication |
| **Payments** | Stripe Checkout | Payment processing |
| **Email** | Nodemailer + Gmail SMTP | Transactional emails |
| **Hosting** | AWS Elastic Beanstalk | Production deployment |

---

## 2. AWS Infrastructure (Production)

### 2.1 AWS Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    INTERNET                                          │
└───────────────────────────────────────┬─────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AWS CLOUD (eu-west-2)                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                        ELASTIC BEANSTALK ENVIRONMENT                           │  │
│  │                        (Albakes-env / albakes-app)                             │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                         LOAD BALANCER (ALB)                              │  │  │
│  │  │                    albakes-app.eu-west-2.elasticbeanstalk.com            │  │  │
│  │  │                         • SSL termination                                │  │  │
│  │  │                         • HTTP → HTTPS redirect                          │  │  │
│  │  └──────────────────────────────────┬──────────────────────────────────────┘  │  │
│  │                                     │                                          │  │
│  │  ┌──────────────────────────────────▼──────────────────────────────────────┐  │  │
│  │  │                          EC2 INSTANCE                                    │  │  │
│  │  │                         (t3.micro / t3.small)                            │  │  │
│  │  │  ┌────────────────────────────────────────────────────────────────────┐ │  │  │
│  │  │  │                         DOCKER CONTAINER                            │ │  │  │
│  │  │  │  ┌──────────────────────────────────────────────────────────────┐  │ │  │  │
│  │  │  │  │                    EXPRESS SERVER                             │  │ │  │  │
│  │  │  │  │                    (Node.js 20)                               │  │ │  │  │
│  │  │  │  │                                                               │  │ │  │  │
│  │  │  │  │  • Serves React build (static files)                         │  │ │  │  │
│  │  │  │  │  • Handles /api/* requests                                   │  │ │  │  │
│  │  │  │  │  • Port 8080 (EB default)                                    │  │ │  │  │
│  │  │  │  └──────────────────────────────────────────────────────────────┘  │ │  │  │
│  │  │  └────────────────────────────────────────────────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                             │
│         ┌──────────────────────────────┼──────────────────────────────┐             │
│         │                              │                              │             │
│         ▼                              ▼                              ▼             │
│  ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐     │
│  │   AWS RDS       │          │    EXTERNAL     │          │    EXTERNAL     │     │
│  │   PostgreSQL    │          │    Stripe API   │          │   Gmail SMTP    │     │
│  │                 │          │                 │          │                 │     │
│  │  • db.t3.micro  │          │  • Checkout     │          │  • Port 587     │     │
│  │  • 20GB storage │          │  • Webhooks     │          │  • TLS          │     │
│  │  • Multi-AZ: No │          │  • Session API  │          │  • App Password │     │
│  │  • Encrypted    │          │                 │          │                 │     │
│  └─────────────────┘          └─────────────────┘          └─────────────────┘     │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 AWS Services Used

| Service | Resource | Purpose | Cost Tier |
|---------|----------|---------|-----------|
| **Elastic Beanstalk** | albakes-app | Container orchestration, auto-scaling | Free (manages EC2) |
| **EC2** | t3.micro/small | Compute instance | Free tier eligible |
| **RDS** | db.t3.micro | PostgreSQL database | Free tier eligible |
| **ALB** | Application LB | Load balancing, SSL | ~$16/month |
| **Route 53** | (optional) | Custom domain DNS | $0.50/zone/month |
| **ACM** | SSL Certificate | HTTPS encryption | Free |

### 2.3 Environment Variables (Elastic Beanstalk)

These are configured in EB Console → Configuration → Software → Environment properties:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                     ELASTIC BEANSTALK ENVIRONMENT VARIABLES                    │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  DATABASE                                                                      │
│  ─────────                                                                     │
│  DATABASE_URL = postgres://user:pass@rds-endpoint:5432/albakes                 │
│                 └─────────────────┬─────────────────────┘                      │
│                          AWS RDS connection string                             │
│                                                                                │
│  AUTHENTICATION                                                                │
│  ──────────────                                                                │
│  JWT_SECRET = [random 64-char string]     # Signs all JWT tokens               │
│  ADMIN_EMAIL = admin@albakes.com          # ENV-based admin login              │
│  ADMIN_PASSWORD_HASH = $2b$12$...         # bcrypt hash of admin password      │
│                                                                                │
│  STRIPE                                                                        │
│  ──────                                                                        │
│  STRIPE_SECRET_KEY = sk_live_...          # Stripe API (server-side only)      │
│  STRIPE_WEBHOOK_SECRET = whsec_...        # Validates webhook signatures       │
│                                                                                │
│  EMAIL (Gmail SMTP)                                                            │
│  ─────────────────                                                             │
│  GMAIL_USER = albakes.orders@gmail.com    # Gmail address                      │
│  GMAIL_APP_PASSWORD = xxxx xxxx xxxx xxxx # 16-char app password (not regular) │
│                                                                                │
│  URLS                                                                          │
│  ────                                                                          │
│  FRONTEND_URL = https://albakes-app.eu-west-2.elasticbeanstalk.com             │
│  NODE_ENV = production                    # Enables secure cookies             │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Deployment Flow

```
LOCAL DEVELOPMENT                    AWS DEPLOYMENT
─────────────────                    ──────────────

┌─────────────────┐
│  git push       │
│  (to GitHub)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐                 ┌─────────────────┐
│  eb deploy      │ ───────────────►│ Elastic         │
│  (EB CLI)       │                 │ Beanstalk       │
└─────────────────┘                 └────────┬────────┘
                                             │
         WHAT HAPPENS:                       │
                                             ▼
         1. EB zips your code        ┌─────────────────┐
         2. Uploads to S3            │ S3 Bucket       │
         3. Triggers deployment      │ (app versions)  │
                                     └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ EC2 Instance    │
                                     │                 │
                                     │ 1. Pull zip     │
                                     │ 2. docker build │
                                     │ 3. docker run   │
                                     │ 4. Health check │
                                     └─────────────────┘
```

### 2.5 Key AWS Files in Codebase

| File | Purpose |
|------|---------|
| `.elasticbeanstalk/config.yml` | EB CLI configuration (region, app name, env) |
| `Dockerfile` | Container build instructions |
| `docker-compose.yml` | Local development (mimics production) |
| `.ebextensions/*.config` | EB environment customization (if any) |

### 2.6 Database Connection (RDS)

```javascript
// server/db.js - How we connect to RDS

import pg from "pg";
const { Pool } = pg;

// DATABASE_URL format: postgres://user:password@host:port/database
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }  // Required for RDS
    : false
});
```

**Why `rejectUnauthorized: false`?**
- RDS uses Amazon's certificate authority
- Node.js doesn't trust it by default
- This allows the connection while still using SSL encryption

### 2.7 How Requests Flow in Production

```
1. User visits: https://albakes-app.eu-west-2.elasticbeanstalk.com/menu

2. DNS resolves to AWS ALB IP

3. ALB receives request
   ├── Terminates SSL (HTTPS → HTTP internally)
   └── Forwards to EC2 instance on port 80

4. Nginx (EB default) on EC2
   └── Proxies to Docker container on port 8080

5. Express server receives request
   ├── If path starts with /api/* → Route to controller
   └── Else → Serve static React build (index.html, JS, CSS)

6. For /api/* requests:
   ├── Middleware runs (CORS, cookies, auth)
   ├── Controller executes business logic
   ├── Database query to RDS (if needed)
   └── JSON response returned

7. Response travels back: Express → Nginx → ALB → Browser
```

### 2.8 Scaling Architecture (Future)

Current setup is single-instance. For scaling:

```
                              ┌─────────────────┐
                              │  Auto Scaling   │
                              │     Group       │
                              └────────┬────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
       ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
       │ EC2 (AZ-a)  │          │ EC2 (AZ-b)  │          │ EC2 (AZ-c)  │
       │ Container   │          │ Container   │          │ Container   │
       └─────────────┘          └─────────────┘          └─────────────┘
              │                        │                        │
              └────────────────────────┼────────────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  RDS (Multi-AZ) │
                              │   Primary +     │
                              │   Standby       │
                              └─────────────────┘
```

### 2.9 Common EB CLI Commands

```bash
# Initialize EB in project (first time)
eb init -p docker albakes-app --region eu-west-2

# Create environment
eb create Albakes-env

# Deploy latest code
eb deploy

# View logs
eb logs

# SSH into instance
eb ssh

# Open in browser
eb open

# Check health
eb health

# Set environment variable
eb setenv JWT_SECRET=your_secret_here

# View current config
eb config
```

### 2.10 Monitoring & Debugging in AWS

| Task | How |
|------|-----|
| View application logs | EB Console → Logs → Request Logs |
| Monitor health | EB Console → Health (shows request count, latency) |
| Check errors | CloudWatch → Log Groups → /aws/elasticbeanstalk/... |
| Database metrics | RDS Console → Monitoring (CPU, connections, storage) |
| Real-time logs | `eb logs --stream` (CLI) |

---

## 3. Folder Structure

```
A-L-Bakes2026FYP-BRUNEL/
├── client/                     # FRONTEND (React)
│   ├── src/
│   │   ├── api/               # API client functions (fetch wrappers)
│   │   │   ├── auth.js        # Admin auth API
│   │   │   ├── customerAuth.js # Customer auth API
│   │   │   ├── products.js    # Product fetching
│   │   │   ├── checkout.js    # Stripe session creation
│   │   │   ├── reviews.js     # Review CRUD
│   │   │   ├── admin.js       # Admin order management
│   │   │   ├── adminProducts.js # Product CRUD
│   │   │   ├── reviewReports.js # Report management
│   │   │   └── salesReports.js  # Analytics API
│   │   │
│   │   ├── context/           # Global state providers
│   │   │   ├── CartContext.jsx  # Shopping cart state
│   │   │   └── AuthContext.jsx  # Customer auth state
│   │   │
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ReviewForm.jsx
│   │   │   ├── ReviewsList.jsx
│   │   │   └── ReportReviewModal.jsx
│   │   │
│   │   ├── App.jsx            # Main router + NavBar
│   │   ├── main.jsx           # Entry point (providers wrap here)
│   │   │
│   │   ├── [Pages...]         # 25+ page components
│   │   └── index.css          # Global styles
│   │
│   └── package.json
│
├── server/                     # BACKEND (Express)
│   ├── index.js               # Server entry point (routes registered here)
│   ├── db.js                  # PostgreSQL connection pool
│   │
│   ├── controllers/           # Business logic
│   │   ├── auth.controller.js           # Admin login/logout
│   │   ├── customer.auth.controller.js  # Customer auth + password reset
│   │   ├── orders.controller.js         # Order creation from Stripe
│   │   ├── adminOrders.controller.js    # Order management
│   │   ├── admin.products.controller.js # Product CRUD
│   │   ├── reviews.controller.js        # Review CRUD
│   │   ├── review.reports.controller.js # Report handling
│   │   ├── sales.reports.controller.js  # Analytics queries
│   │   ├── admin.users.controller.js    # Admin approval
│   │   └── stripeWebhook.controller.js  # Stripe events
│   │
│   ├── routes/                # API endpoint definitions
│   │   ├── auth.routes.js
│   │   ├── customer.auth.routes.js
│   │   ├── orders.routes.js
│   │   ├── admin.orders.routes.js
│   │   ├── admin.products.routes.js
│   │   ├── reviews.routes.js
│   │   ├── admin.reviews.routes.js
│   │   ├── review.reports.routes.js
│   │   ├── sales.reports.routes.js
│   │   ├── admin.users.routes.js
│   │   └── webhooks.routes.js
│   │
│   ├── middleware/            # Request interceptors
│   │   ├── requireAdmin.js    # Protects admin routes
│   │   └── requireCustomer.js # Protects customer routes
│   │
│   ├── services/              # External integrations
│   │   └── email.service.js   # Gmail SMTP email sending
│   │
│   ├── migrations/            # Database schema
│   │   ├── 000_base_schema.sql    # Products, orders, order_items
│   │   ├── 001_add_reviews.sql    # product_reviews table
│   │   ├── 002_auth_users.sql     # users, password_reset_tokens
│   │   └── 003_review_reports.sql # review_reports table
│   │
│   └── package.json
│
├── .elasticbeanstalk/         # AWS deployment config
├── docker-compose.yml         # Local development
└── Dockerfile                 # Container definition
```

---

## 3. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Client)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│   │  App.jsx    │    │CartContext  │    │AuthContext  │                    │
│   │  (Router)   │◄───┤  (Global)   │    │  (Global)   │                    │
│   └──────┬──────┘    └─────────────┘    └─────────────┘                    │
│          │                                                                  │
│   ┌──────▼──────────────────────────────────────────────────────────┐      │
│   │                         PAGES                                    │      │
│   │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐ ┌─────────┐ │      │
│   │  │  Home  │ │  Shop  │ │ Checkout │ │ AdminDash  │ │ Login   │ │      │
│   │  └────────┘ └────────┘ └──────────┘ └────────────┘ └─────────┘ │      │
│   └──────┬──────────────────────────────────────────────────────────┘      │
│          │                                                                  │
│   ┌──────▼──────────────────────────────────────────────────────────┐      │
│   │                      API LAYER (client/src/api/)                 │      │
│   │  fetch() calls with credentials: "include" for cookies           │      │
│   └──────┬──────────────────────────────────────────────────────────┘      │
│          │                                                                  │
└──────────┼──────────────────────────────────────────────────────────────────┘
           │ HTTP/HTTPS
           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS SERVER (server/)                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                      index.js (Entry Point)                       │      │
│   │  • CORS config (credentials: true)                               │      │
│   │  • Cookie parser                                                  │      │
│   │  • Route mounting                                                 │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                    │                                         │
│   ┌────────────────────────────────┼────────────────────────────────┐       │
│   │                          ROUTES                                  │       │
│   │                                                                  │       │
│   │  PUBLIC                 CUSTOMER              ADMIN              │       │
│   │  ───────                ────────              ─────              │       │
│   │  GET /products          POST /reviews         GET /admin/orders  │       │
│   │  GET /reviews/:id       GET /customer/me      PUT /admin/orders  │       │
│   │  POST /checkout         POST /forgot-pass     CRUD /products     │       │
│   │  POST /orders/from-     POST /reset-pass      GET /sales/...     │       │
│   │       session                                 DELETE /reviews    │       │
│   └────────────────────────────────┬────────────────────────────────┘       │
│                                    │                                         │
│   ┌────────────────────────────────▼────────────────────────────────┐       │
│   │                       MIDDLEWARE                                 │       │
│   │  requireAdmin.js  ─────► Checks JWT cookie (albakes_admin)      │       │
│   │  requireCustomer.js ───► Checks JWT cookie (albakes_customer)   │       │
│   └────────────────────────────────┬────────────────────────────────┘       │
│                                    │                                         │
│   ┌────────────────────────────────▼────────────────────────────────┐       │
│   │                      CONTROLLERS                                 │       │
│   │  • Validate input                                                │       │
│   │  • Execute business logic                                        │       │
│   │  • Query database (via pool)                                     │       │
│   │  • Return JSON response                                          │       │
│   └────────────────────────────────┬────────────────────────────────┘       │
│                                    │                                         │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
            ┌───────────┐    ┌───────────┐    ┌───────────┐
            │ PostgreSQL│    │  Stripe   │    │   Gmail   │
            │ (AWS RDS) │    │    API    │    │   SMTP    │
            └───────────┘    └───────────┘    └───────────┘
```

---

## 4. Data Flow Examples

### 4.1 Customer Places Order (Happy Path)

```
1. User clicks "Pay with Stripe" on CheckoutReview.jsx
   └─► handlePay() calls createCheckoutSession(payload)
       └─► POST /api/checkout
           └─► checkout.controller.js creates Stripe session
               └─► Returns { url: "https://checkout.stripe.com/..." }

2. Browser redirects to Stripe
   └─► User enters card details on Stripe's hosted page
       └─► Stripe processes payment

3. Stripe redirects to /order-success?session_id=xxx
   └─► OrderSuccess.jsx mounts
       └─► useEffect calls createOrderFromSession(sessionId)
           └─► POST /api/orders/from-session
               └─► orders.controller.js:
                   • Checks idempotency (existing order?)
                   • Retrieves Stripe session
                   • Verifies payment_status === "paid"
                   • BEGIN transaction
                   • INSERT into orders
                   • INSERT into order_items
                   • INSERT into order_events
                   • COMMIT
                   • Send confirmation emails (async)
               └─► Returns { orderId }

4. User sees confirmation + order ID
```

### 4.2 Customer Resets Password

```
1. User clicks "Forgot Password" on login page
   └─► ForgotPassword.jsx renders form

2. User enters email, clicks submit
   └─► POST /api/auth/customer/forgot-password
       └─► forgotPassword() in customer.auth.controller.js:
           • Look up user by email
           • Generate crypto.randomBytes(32) token
           • Invalidate old tokens
           • INSERT new token with 1hr expiry
           • Send email with reset link (async)
           • Return generic "check your email" (no enumeration)

3. User clicks link in email: /reset-password/:token
   └─► ResetPassword.jsx reads token from URL

4. User enters new password, clicks submit
   └─► POST /api/auth/customer/reset-password
       └─► resetPassword() in customer.auth.controller.js:
           • Validate token (unused, not expired, active user)
           • Verify new password differs from current
           • Hash with bcrypt (12 rounds)
           • UPDATE users SET password_hash
           • UPDATE token SET used_at = NOW()
           • Return success

5. User redirected to login
```

### 4.3 Admin Updates Order Status

```
1. Admin views order in AdminDashboard.jsx
   └─► GET /api/admin/orders/:id
       └─► requireAdmin middleware verifies JWT
       └─► getOrderById returns order + items + events

2. Admin changes status dropdown, clicks save
   └─► PUT /api/admin/orders/:id
       └─► updateOrderStatus() in adminOrders.controller.js:
           • UPDATE orders SET status
           • INSERT order_event (audit trail)
           • Return updated order

3. UI updates to show new status
```

---

## 5. Database Schema

```sql
┌─────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ id | name | description | price_pence | category | image_url |          │
│ is_featured | is_active | created_at | updated_at                       │
└─────────────────────────────────────────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRODUCT_REVIEWS                                │
├─────────────────────────────────────────────────────────────────────────┤
│ id | product_id | customer_email | customer_name | rating (1-5) |       │
│ review_text | is_approved | created_at                                  │
└─────────────────────────────────────────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           REVIEW_REPORTS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ id | review_id | reporter_email | reason | details | status |           │
│ reviewed_by | admin_notes | created_at                                  │
└─────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                               ORDERS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ id | stripe_session_id | customer_email | customer_name | status |      │
│ payment_status | currency | subtotal_pence | delivery_pence |           │
│ total_pence | delivery_method | delivery_date | created_at | updated_at │
└─────────────────────────────────────────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            ORDER_ITEMS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ id | order_id | product_id | product_name | quantity | unit_price_pence │
│ line_total_pence | customisation_json                                   │
└─────────────────────────────────────────────────────────────────────────┘
        │
        │ 1:N (sibling)
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           ORDER_EVENTS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ id | order_id | type | message | created_at                             │
│ (Used for order tracking timeline)                                      │
└─────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                               USERS                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ id | email | password_hash | first_name | last_name | role              │
│ is_active | admin_approved | approved_by | created_at | updated_at      │
│                                                                          │
│ role = 'customer' | 'admin'                                             │
└─────────────────────────────────────────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PASSWORD_RESET_TOKENS                               │
├─────────────────────────────────────────────────────────────────────────┤
│ id | user_id | token | expires_at | used_at | created_at                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Key Design Decisions (The "Why")

### 6.1 Why httpOnly Cookies for Auth (not localStorage)?

**Security**: httpOnly cookies cannot be accessed by JavaScript, preventing XSS attacks from stealing tokens.

```javascript
// server/controllers/auth.controller.js:44-53
function cookieOptions() {
  return {
    httpOnly: true,      // XSS protection
    secure: isProd,      // HTTPS only in production
    sameSite: "none",    // Required for cross-origin (frontend ≠ backend domain)
  };
}
```

### 6.2 Why Separate Admin vs Customer Auth?

**Security isolation**: Different cookie names, session lengths, and validation logic.

| Aspect | Admin | Customer |
|--------|-------|----------|
| Cookie name | `albakes_admin` | `albakes_customer` |
| Session length | 8 hours | 7 days |
| Middleware | `requireAdmin.js` | `requireCustomer.js` |

### 6.3 Why Store Prices in Pence (integers)?

**Precision**: Floating point arithmetic causes rounding errors with currency.

```javascript
// Bad:  0.1 + 0.2 = 0.30000000000000004
// Good: 10 + 20 = 30 (pence), then format: £0.30
const formatGBP = (pence) => `£${(pence / 100).toFixed(2)}`;
```

### 6.4 Why Stripe Checkout (not custom payment form)?

**PCI Compliance**: Card details never touch our servers. Stripe handles security.

```
Our App ──► Stripe Checkout (hosted) ──► Our success page
             ↑
        Card entered HERE (on stripe.com domain)
```

### 6.5 Why idempotency check in order creation?

**Duplicate prevention**: Users might refresh the success page.

```javascript
// server/controllers/orders.controller.js:72-79
const existing = await pool.query(
  "SELECT id FROM orders WHERE stripe_session_id = $1",
  [sessionId]
);
if (existing.rows.length) {
  return res.json({ orderId: existing.rows[0].id, alreadyExisted: true });
}
```

### 6.6 Why Context API (not Redux)?

**Simplicity**: Only two pieces of global state (cart, auth). Context is sufficient.

```jsx
// client/src/main.jsx
<AuthProvider>
  <CartProvider>
    <App />
  </CartProvider>
</AuthProvider>
```

---

## 7. Critical Files to Study First

### Priority 1: Entry Points (Start Here)
| File | Why |
|------|-----|
| `server/index.js` | All routes registered, middleware order visible |
| `client/src/App.jsx` | All frontend routes, NavBar logic |
| `client/src/main.jsx` | Context provider hierarchy |

### Priority 2: Core Business Logic
| File | Why |
|------|-----|
| `server/controllers/orders.controller.js` | Order creation flow |
| `server/controllers/customer.auth.controller.js` | Auth + password reset |
| `client/src/context/CartContext.jsx` | Cart state management |
| `client/src/Checkout.jsx` + `CheckoutReview.jsx` | Checkout flow |

### Priority 3: Security
| File | Why |
|------|-----|
| `server/middleware/requireAdmin.js` | JWT verification pattern |
| `server/controllers/auth.controller.js` | Cookie configuration |

### Priority 4: Database
| File | Why |
|------|-----|
| `server/migrations/000_base_schema.sql` | Core tables |
| `server/db.js` | Connection pool setup |

---

## 8. Debugging Entry Points

Set breakpoints at these locations to trace user actions:

| User Action | File:Line | Function |
|-------------|-----------|----------|
| Login (customer) | `customer.auth.controller.js:160` | `customerLogin` |
| Login (admin) | `auth.controller.js:74` | `adminLogin` |
| Add to cart | `CartContext.jsx:107` | `addItem` |
| Place order | `orders.controller.js:62` | `createOrderFromSession` |
| View products | `client/src/Shop.jsx` | `useEffect` fetch |
| Submit review | `reviews.controller.js` | `createReview` |
| Reset password | `customer.auth.controller.js:309` | `resetPassword` |

---

## 9. API Endpoints Quick Reference

### Public (No Auth)
```
GET  /api/products              # List all products
GET  /api/products/:id          # Single product
GET  /api/reviews/:productId    # Reviews for product
POST /api/checkout              # Create Stripe session
POST /api/orders/from-session   # Create order after payment
GET  /api/orders/:id/track      # Customer order tracking
```

### Customer Auth Required
```
POST /api/auth/customer/register
POST /api/auth/customer/login
POST /api/auth/customer/logout
GET  /api/auth/customer/me
POST /api/auth/customer/forgot-password
POST /api/auth/customer/reset-password
POST /api/reviews              # Submit review
```

### Admin Auth Required
```
GET    /api/admin/orders
GET    /api/admin/orders/:id
PUT    /api/admin/orders/:id
GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
DELETE /api/admin/reviews/:id
GET    /api/admin/review-reports
PATCH  /api/admin/review-reports/:id
GET    /api/admin/sales/overview
GET    /api/admin/sales/by-period
GET    /api/admin/sales/top-products
GET    /api/admin/approval-requests
POST   /api/admin/approval-requests/:id/approve
POST   /api/admin/approval-requests/:id/reject
```

---

## 10. Next Steps for Code Ownership

1. **Run locally**: `docker-compose up` (or manual setup)
2. **Open browser**: Navigate each page, observe network tab
3. **Set breakpoints**: Start with login flow
4. **Write tests**: See test file suggestions below
5. **Document discoveries**: Create `LESSONS_LEARNED.md`

---

## 11. Suggested Test Files to Create

```
server/
├── controllers/
│   ├── orders.controller.test.js      # Test order creation
│   ├── customer.auth.controller.test.js # Test auth flows
│   └── reviews.controller.test.js     # Test review CRUD

client/
├── src/
│   ├── context/
│   │   └── CartContext.test.jsx       # Test add/remove/qty
│   └── api/
│       └── checkout.test.js           # Test API calls
```

---

*Document created: 2026-02-02*
*Last updated: 2026-02-02*
