# A&L Bakes - Reviews System Setup Guide

## 🎨 What's New

### 1. **New Color Theme** ✨
Your app now uses the beautiful warm, peachy theme from your wireframes:
- **Primary color**: Peachy coral (#E89088)
- **Background**: Warm cream (#F9F7F4)
- **Success**: Mint green (#51CF66)
- **Cards**: Clean white with soft borders

### 2. **Complete Review System** ⭐
Customers can now leave reviews for products with star ratings and text feedback!

---

## 📋 Setup Instructions

### Step 1: Run Database Migration

You need to create the reviews tables in your PostgreSQL database:

```bash
# Navigate to server directory
cd server

# Run the migration
psql $DATABASE_URL -f migrations/001_add_reviews.sql
```

Or if you're using a different connection method:

```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f migrations/001_add_reviews.sql
```

**What this creates:**
- `product_reviews` table - stores customer reviews
- `review_helpful_votes` table - (optional) for future "helpful" voting feature
- Proper indexes for performance

---

### Step 2: Restart Your Backend Server

The backend now has new routes, so restart it:

```bash
cd server
npm run dev
# or
node index.js
```

**New API endpoints added:**
- `GET /api/products/:productId/reviews` - Get approved reviews for a product
- `POST /api/products/:productId/reviews` - Submit a new review
- `GET /api/admin/reviews` - Admin: List all reviews (requires auth)
- `PATCH /api/admin/reviews/:reviewId/status` - Admin: Approve/reject review

---

### Step 3: Restart Your Frontend

```bash
cd client
npm run dev
```

---

## 🎯 Features Overview

### **For Customers:**

#### 1. **View Reviews**
- See all approved reviews on product pages
- Star ratings with average score
- Verified purchase badges
- Sort by: Newest, Highest Rated, Lowest Rated

#### 2. **Write Reviews**
- 5-star rating system with interactive stars
- Name and email fields
- Review text (minimum 10 characters)
- Automatic verification if order ID provided
- Success confirmation matching your wireframe design

### **For Admins:**

#### 1. **Review Management Dashboard**
Access at: `/admin/reviews`

Features:
- Filter reviews by status (Pending, Approved, Rejected)
- See product name, customer info, rating, and review text
- Approve or reject pending reviews with one click
- Verified purchase badges visible
- Timestamp for each review

#### 2. **Workflow:**
1. Customer submits review → Status: **Pending**
2. Admin reviews it at `/admin/reviews`
3. Admin clicks **Approve** → Status: **Approved** (publicly visible)
4. OR Admin clicks **Reject** → Status: **Rejected** (hidden)

---

## 📂 New Files Created

### Backend (Server):
```
server/
├── migrations/
│   └── 001_add_reviews.sql              ← Database schema
├── controllers/
│   └── reviews.controller.js            ← Review logic
├── routes/
│   ├── reviews.routes.js                ← Public routes
│   └── admin.reviews.routes.js          ← Admin routes
└── index.js                             ← Updated with routes
```

### Frontend (Client):
```
client/src/
├── components/
│   ├── ReviewsList.jsx                  ← Display reviews
│   └── ReviewForm.jsx                   ← Submit review form
├── api/
│   └── reviews.js                       ← API functions
├── AdminReviews.jsx                     ← Admin management page
├── ProductDetail.jsx                    ← Updated with reviews
├── App.jsx                              ← Added admin/reviews route
└── index.css                            ← NEW THEME! 🎨
```

---

## 🧪 Testing Your Review System

### Test 1: Submit a Review
1. Go to any product page (e.g., `/product/1`)
2. Scroll to "Write a Review"
3. Fill out:
   - Click stars to rate (1-5)
   - Enter your name
   - Enter your email
   - Write a review (min 10 chars)
4. Click "Submit Review"
5. You should see the success message matching your wireframe

### Test 2: Admin Review Approval
1. Log in as admin at `/admin/login`
2. Click "Reviews" in the header
3. You should see your pending review
4. Click "Approve"
5. Go back to the product page
6. Your review should now be visible!

### Test 3: Verified Purchase
To test verified purchase badges:
1. Complete a real order through Stripe
2. Wait for order status to be "delivered" (or set it via admin)
3. Submit a review with the same email used for the order
4. The review will get a green "✓ Verified Purchase" badge

---

## 🎨 Design Highlights

Your new theme matches the wireframes perfectly:

### Colors Used:
- **Peachy Coral**: Primary buttons, CTA, links
- **Mint Green**: Success states, verified badges
- **Warm Cream**: Page background
- **White Cards**: Clean, elevated content
- **Soft Borders**: Subtle separation

### Components:
- ✅ Alert boxes (success/error/warning)
- ✅ Badges for status indicators
- ✅ Star ratings in gold (#F5A623)
- ✅ Card hover effects
- ✅ Smooth transitions

---

## 🔐 Security Notes

✅ **Safe & Secure:**
- All reviews require approval before being public
- Email validation on frontend
- SQL injection protected (parameterized queries)
- Admin routes protected by JWT authentication
- No XSS vulnerabilities (React escapes by default)

---

## 🚀 Next Steps (Optional Enhancements)

Consider adding these later:
1. **Review Photos** - Let customers upload images
2. **Helpful Votes** - "Was this review helpful?" buttons
3. **Reply to Reviews** - Admin can respond to reviews
4. **Email Notifications** - Notify customers when review is approved
5. **Review Analytics** - Dashboard with review stats

---

## 📊 Database Schema Reference

```sql
product_reviews:
- id (serial, primary key)
- product_id (references products)
- order_id (references orders, nullable)
- customer_email (varchar)
- customer_name (varchar)
- rating (integer, 1-5)
- review_text (text)
- verified_purchase (boolean)
- status (varchar: pending/approved/rejected)
- created_at, updated_at (timestamps)
```

---

## 🎉 You're All Set!

Your A&L Bakes e-commerce site now has:
- ✅ Beautiful peachy theme matching your wireframes
- ✅ Complete review system with star ratings
- ✅ Admin moderation dashboard
- ✅ Verified purchase badges
- ✅ Modern, accessible UX

Enjoy your upgraded bakery website! 🧁✨
