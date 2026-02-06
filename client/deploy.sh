#!/bin/bash
# =============================================================================
# FRONTEND DEPLOY SCRIPT
# =============================================================================
# Builds the React app and deploys to S3 + invalidates CloudFront cache
#
# Usage: ./deploy.sh
# =============================================================================

set -e  # Exit on any error

# Configuration
S3_BUCKET="albakescomingsoon2026"
CLOUDFRONT_DIST_ID="E3AJKL534XOW59"
AWS_REGION="eu-west-2"

echo "========================================="
echo "  A&L Bakes Frontend Deploy"
echo "========================================="

# Step 1: Build
echo ""
echo "[1/3] Building production bundle..."
npm run build

# Step 2: Upload to S3
echo ""
echo "[2/3] Uploading to S3..."
aws s3 sync dist/ s3://$S3_BUCKET \
  --delete \
  --region $AWS_REGION \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --exclude "*.json"

# Upload index.html and JSON with no-cache (so updates are immediate)
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
  --region $AWS_REGION \
  --cache-control "no-cache, no-store, must-revalidate"

# Upload any JSON files (like manifest) with short cache
if ls dist/*.json 1> /dev/null 2>&1; then
  aws s3 sync dist/ s3://$S3_BUCKET \
    --region $AWS_REGION \
    --exclude "*" \
    --include "*.json" \
    --cache-control "public, max-age=0, must-revalidate"
fi

# Step 3: Invalidate CloudFront
echo ""
echo "[3/3] Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DIST_ID \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text)

echo ""
echo "========================================="
echo "  Deploy complete!"
echo "========================================="
echo ""
echo "CloudFront invalidation: $INVALIDATION_ID"
echo "Site: https://dizqgvrbhxb2t.cloudfront.net"
echo ""
echo "Note: Cache invalidation takes 1-2 minutes to propagate."
