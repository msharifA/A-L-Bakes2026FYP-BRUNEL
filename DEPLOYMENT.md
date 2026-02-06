
A&L Bakes – Deployment & Operations Guide
Last updated: 6 Feb 2026

1. Overview
This document describes how the A&L; Bakes platform is deployed and operated in AWS.
Key components:
- Frontend: React (Vite) app
- Built by GitHub Actions
- Hosted in S3 bucket albakescomingsoon2026
- Served via CloudFront distribution E3AJKL534XOW59
- Backend: Node.js/Express API (Docker)
- Container image stored in ECR repository albakes-backend
- Deployed to Elastic Beanstalk environment albakes-backend-env
- Exposes /api/* endpoints
- Database: PostgreSQL
- Hosted in AWS RDS
- Security group only allows traffic from the EB instance
- CI/CD: GitHub Actions
- deploy-backend.yml → Builds Docker image, pushes to ECR, deploys to EB
- deploy-frontend.yml → Builds React app, syncs to S3, invalidates CloudFront

2. Environments
Production Environment
- AWS Region: eu-west-2 (London)
- Frontend URL (CloudFront): https://dizqgvrbhxb2t.cloudfront.net
- Backend URL (Elastic Beanstalk):
http://albakes-backend-env.eba-yfctfve9.eu-west-2.elasticbeanstalk.com
- Database: RDS PostgreSQL instance in same VPC
- Networking:
- EB instance → allowed to access RDS
- S3 is private; CloudFront is the public entry point
Staging (planned)
A future separate EB environment and optional RDS instance for testing.

3. Backend Deployment Flow (EB + ECR)
3.1 Local Development
Start local services using Docker Compose:
docker compose up -d --build
Local endpoints:
- Backend API: http://localhost:5001/api/health
- Database: postgres://albakes:albakes@localhost:5432/albakes_dev
docker-compose.yml includes:
- db → postgres:16-alpine
- web → Node API container (port 5000 mapped to host 5001)
3.2 CI/CD Pipeline — Backend
Workflow file: .github/workflows/deploy-backend.yml
Triggers:
- Push to main affecting server/**
- Manual workflow_dispatch
Pipeline summary:
 1. Checkout repo
 2. Setup Node.js
 3. Install dependencies & run tests (npm ci && npm test)
 4. Configure AWS via OIDC
 5. Login to ECR
 6. Build Docker image
 7. Tag & push image
 8. Generate unique version
 9. Render Dockerrun.aws.json
 10. Package ZIP for Elastic Beanstalk
 11. Create Application Version in EB
 12. Update EB Environment

Note: If tests fail, deployment stops and production remains unchanged.

4. Frontend Deployment Flow (S3 + CloudFront)
Workflow file: .github/workflows/deploy-frontend.yml
Triggers:
- Push to main affecting client/**
- Manual workflow_dispatch
Pipeline summary:
1. Checkout repo
2. Configure AWS via OIDC
3. Setup Node.js
4. Install dependencies (npm ci)
5. Run ESLint (npm run lint)
6. Run tests (npm test)
7. Build frontend (npm run build)
8. Sync build to S3
9. Create CloudFront invalidation

Result:
- If lint or tests fail, deployment stops
- New frontend version goes live instantly
- Old cached files are forced to refresh

5. Environment Variables & Secrets
Backend (Elastic Beanstalk Env Vars)
Configured in EB console.
GitHub Actions Secrets:
AWS_REGION
EB_APP_NAME
EB_ENV_NAME
AWS_ACCOUNT_ID

6. Rollback Strategy
Backend Rollback: Use EB console → Application Versions → Deploy older version.
Frontend Rollback: Restore older S3 object version and invalidate CloudFront.

7. Scaling & Cost Notes
- EB single-instance environment → low cost
- RDS instance sized for moderate traffic
- CloudFront reduces S3 transfer cost

8. Testing

8.1 Test Framework
Both frontend and backend use Vitest for unit testing.

8.2 Running Tests Locally
Backend:
  cd server && npm test

Frontend:
  cd client && npm test

Watch mode (re-runs on file changes):
  npm run test:watch

8.3 Test Coverage
Backend (server/tests/):
- auth.test.js: Customer registration, login, logout validation

Frontend (client/src/):
- context/CartContext.test.jsx: Cart operations, quantity limits, persistence

8.4 CI Integration
Tests run automatically in GitHub Actions before deployment.
If any test fails, deployment is blocked.

9. Future Improvements & Staging
- Create staging EB + RDS
- Add monitoring alarms
- Expand test coverage for checkout flow