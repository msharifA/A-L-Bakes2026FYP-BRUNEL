# A&L Bakes — Custom Bakery E-Commerce Platform

Final Year Project (2025–2026) — Brunel University London

A full-stack e-commerce platform built for artisan bakeries, featuring a custom cake enquiry system with automated two-stage payment workflow (deposit + final payment). Deployed on AWS Free Tier infrastructure.

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React, Vite                         |
| Backend      | Node.js, Express.js                 |
| Database     | PostgreSQL (AWS RDS)                |
| Payments     | Stripe (Checkout + Payment Links)   |
| Storage      | AWS S3 (images + static assets)     |
| CDN          | AWS CloudFront                      |
| Hosting      | AWS Elastic Beanstalk (Docker)      |
| CI/CD        | GitHub Actions (OIDC authentication)|
| Testing      | Vitest                              |

## Project Structure

```
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── api/                     # API client modules
│   │   │   ├── auth.js              # Admin auth API calls
│   │   │   ├── customerAuth.js      # Customer auth API calls
│   │   │   ├── checkout.js          # Stripe checkout integration
│   │   │   ├── enquiries.js         # Custom cake enquiry API
│   │   │   ├── products.js          # Product listing API
│   │   │   ├── reviews.js           # Review submission API
│   │   │   ├── adminProducts.js     # Admin product management
│   │   │   ├── adminEnquiries.js    # Admin enquiry management
│   │   │   ├── reviewReports.js     # Review moderation API
│   │   │   └── salesReports.js      # Sales reporting API
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ReviewForm.jsx       # Product review form
│   │   │   ├── ReviewsList.jsx      # Review display component
│   │   │   └── ReportReviewModal.jsx# Review reporting modal
│   │   ├── context/                 # React context providers
│   │   │   ├── AuthContext.js       # Authentication state
│   │   │   ├── AuthProvider.jsx     # Auth context provider
│   │   │   ├── CartContext.js       # Shopping cart state
│   │   │   └── CartProvider.jsx     # Cart context provider
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.js           # Authentication hook
│   │   │   └── useCart.js           # Cart management hook
│   │   ├── utils/
│   │   │   └── formatGBP.js         # Currency formatting
│   │   ├── test/
│   │   │   └── setup.js             # Vitest test setup
│   │   ├── App.jsx                  # Root component + routing
│   │   ├── Home.jsx                 # Landing page
│   │   ├── Shop.jsx                 # Product catalogue
│   │   ├── ProductDetail.jsx        # Single product view
│   │   ├── Cart.jsx                 # Shopping cart
│   │   ├── Checkout.jsx             # Checkout flow
│   │   ├── CheckoutReview.jsx       # Order review before payment
│   │   ├── OrderSuccess.jsx         # Post-payment confirmation
│   │   ├── CustomCakeBuilder.jsx    # 5-step custom cake wizard
│   │   ├── CustomCakeSuccess.jsx    # Deposit payment confirmation
│   │   ├── CustomCakeFinalPaymentSuccess.jsx  # Final payment confirmation
│   │   ├── CustomerLogin.jsx        # Customer authentication
│   │   ├── CustomerRegister.jsx     # Customer registration
│   │   ├── CustomerProfile.jsx      # Customer account page
│   │   ├── ForgotPassword.jsx       # Password reset request
│   │   ├── ResetPassword.jsx        # Password reset form
│   │   ├── TrackOrder.jsx           # Order tracking
│   │   ├── Contact.jsx              # Contact page
│   │   ├── About.jsx                # About page
│   │   ├── AdminLogin.jsx           # Admin authentication
│   │   ├── AdminRegister.jsx        # Admin registration (requires approval)
│   │   ├── AdminDashboard.jsx       # Admin overview
│   │   ├── AdminProducts.jsx        # Product management
│   │   ├── AdminProductForm.jsx     # Product create/edit form
│   │   ├── AdminEnquiries.jsx       # Enquiry management + status workflow
│   │   ├── AdminReviews.jsx         # Review moderation
│   │   ├── AdminReviewReports.jsx   # Reported review management
│   │   ├── AdminApprovalRequests.jsx# Admin user approval
│   │   └── AdminSalesReports.jsx    # Sales analytics
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── deploy.sh                    # S3/CloudFront deployment script
│
├── server/                          # Express.js backend
│   ├── controllers/                 # Route handlers (business logic)
│   │   ├── auth.controller.js             # Admin authentication + JWT
│   │   ├── customer.auth.controller.js    # Customer auth + password reset
│   │   ├── orders.controller.js           # Stripe checkout + order processing
│   │   ├── enquiries.controller.js        # Custom cake enquiry + two-stage payments
│   │   ├── admin.products.controller.js   # Product CRUD
│   │   ├── admin.users.controller.js      # Admin user approval workflow
│   │   ├── adminOrders.controller.js      # Order management
│   │   ├── reviews.controller.js          # Verified purchase reviews
│   │   ├── review.reports.controller.js   # Review moderation
│   │   ├── sales.reports.controller.js    # Sales analytics
│   │   ├── customer.profile.controller.js # Customer account management
│   │   └── stripeWebhook.controller.js    # Stripe event handling
│   ├── routes/                      # Express route definitions
│   ├── services/
│   │   ├── email.service.js         # Nodemailer transactional emails
│   │   └── s3.service.js            # AWS S3 image upload
│   ├── middleware/
│   │   ├── requireAdmin.js          # Admin JWT verification
│   │   ├── requireCustomer.js       # Customer JWT verification
│   │   └── upload.js                # Multer file upload handling
│   ├── db/
│   │   └── pool.js                  # PostgreSQL connection pool
│   ├── migrations/                  # SQL schema migrations (000–007)
│   ├── tests/
│   │   └── auth.test.js             # Authentication unit tests
│   ├── Dockerfile                   # Production container (Alpine)
│   ├── index.js                     # Express app entry point
│   ├── db.js                        # Database initialisation
│   ├── vitest.config.js             # Test configuration
│   └── .env.example                 # Environment variable template
│
├── .github/workflows/
│   ├── deploy-backend.yml           # Backend CI/CD (ECR + Elastic Beanstalk)
│   └── deploy-frontend.yml          # Frontend CI/CD (S3 + CloudFront)
│
├── policy-backend.json              # IAM policy for backend deployments
├── policy-frontend.json             # IAM policy for frontend deployments
├── gh-oidc-trust.json               # GitHub OIDC trust policy for AWS
├── docker-compose.yml               # Local development setup
└── Dockerfile                       # Root Dockerfile
```

## Key Features

- **Custom Cake Enquiry System** — Five-step wizard with image upload, real-time pricing, and automated deposit collection
- **Two-Stage Payment Workflow** — 50% deposit at enquiry, automated final payment email when order is marked ready
- **Verified Purchase Reviews** — Only customers with confirmed orders can leave reviews
- **Admin Approval System** — New admin accounts require approval from existing administrators
- **Dual Authentication** — Separate JWT-based auth flows for customers and admins
- **Automated Email Notifications** — Order confirmations, invoices, final payment requests, and password resets

## AWS Architecture

```
                    ┌─────────────────┐
                    │   CloudFront    │
                    │  (E3AJKL534...) │
                    └────┬───────┬────┘
                         │       │
              Static     │       │  /api/*
              Assets     │       │
                    ┌────▼──┐ ┌──▼──────────────┐
                    │  S3   │ │ Elastic Beanstalk│
                    │Bucket │ │   (t3.micro)     │
                    └───────┘ └──────┬───────────┘
                                     │ port 5432
                              ┌──────▼───────┐
                              │  RDS         │
                              │  PostgreSQL  │
                              │ (db.t4g.micro)│
                              └──────────────┘
                              Private Subnet
```

All services run within AWS Free Tier limits.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (local) or AWS RDS connection
- Stripe account (test keys)
- AWS account (for S3 image uploads)

### Backend
```bash
cd server
cp .env.example .env    # Configure environment variables
npm install
npm run dev             # Starts on port 3000
```

### Frontend
```bash
cd client
npm install
npm run dev             # Starts on port 5173
```

### Environment Variables

See `server/.env.example` for required configuration including:
- Database connection (`DATABASE_URL`)
- JWT secret (`JWT_SECRET`)
- Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`)
- Email SMTP configuration (`EMAIL_USER`, `EMAIL_PASS`)

## CI/CD

Deployments are automated via GitHub Actions using OIDC authentication (no long-lived AWS credentials):

- **Backend**: Push to `main` → Docker build → ECR push → Elastic Beanstalk deploy
- **Frontend**: Push to `main` → Vite build → S3 sync → CloudFront invalidation

## Development Sprints

| Sprint | Period              | Focus                                    |
|--------|---------------------|------------------------------------------|
| 1      | Sep–Dec 2025        | AWS infrastructure + environment setup   |
| 2      | Nov 2025–Jan 2026   | Auth, payments, products, reviews, email |
| 3      | Jan 2026            | Docker containerisation + schema consolidation |
| 4      | Feb 2026            | Testing (Vitest) + CI/CD pipeline        |
| 5      | Feb–Mar 2026        | Custom cake enquiry + two-stage payments |
