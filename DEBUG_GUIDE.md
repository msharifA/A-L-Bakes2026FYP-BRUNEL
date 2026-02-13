# Debugging Guide - A&L Bakes

> Step-by-step instructions for tracing code execution in VSCode

---

## 1. VSCode Debug Setup

### Backend (Node.js/Express)

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "node",
      "runtimeArgs": ["--inspect"],
      "program": "${workspaceFolder}/server/index.js",
      "envFile": "${workspaceFolder}/server/.env",
      "console": "integratedTerminal",
      "restart": true
    }
  ]
}
```

### Frontend (React/Vite)

Use browser DevTools:
1. Open Chrome DevTools (F12)
2. Go to Sources tab
3. Find your component under `src/`
4. Click line number to add breakpoint

---

## 2. Debugging Exercises

### Exercise 1: Trace Customer Login

**Goal**: Understand the complete login flow from button click to cookie set.

**Steps**:

1. **Frontend breakpoint** - `client/src/CustomerLogin.jsx`
   - Find the `handleSubmit` function
   - Set breakpoint on the API call line

2. **API layer** - `client/src/api/customerAuth.js`
   - Set breakpoint in `customerLogin` function
   - Observe the fetch request being built

3. **Backend route** - `server/routes/customer.auth.routes.js`
   - Note which controller function handles POST /login

4. **Backend controller** - `server/controllers/customer.auth.controller.js`
   - Set breakpoints at:
     - Line ~160: Function entry
     - Line ~175: Password comparison
     - Line ~185: JWT signing
     - Line ~190: Cookie setting

5. **Run through it**:
   - Start server in debug mode
   - Open browser, go to login page
   - Enter credentials, click Login
   - Step through each breakpoint
   - Inspect variables: `email`, `password`, `passwordHash`, `token`

**Questions to answer**:
- [ ] What data is in the request body?
- [ ] How does bcrypt.compare work?
- [ ] What's in the JWT payload?
- [ ] What cookie options are set?

---

### Exercise 2: Trace Add to Cart

**Goal**: Understand React Context state management.

**Steps**:

1. **Component** - `client/src/ProductDetail.jsx`
   - Find the "Add to Cart" button onClick handler
   - Set breakpoint

2. **Context** - `client/src/context/CartContext.jsx`
   - Set breakpoint in `addItem` function (line ~107)
   - Set breakpoint in `setItems` callback

3. **Run through it**:
   - Go to a product page
   - Click "Add to Cart"
   - Step through the code
   - Watch the `items` state array change

**Questions to answer**:
- [ ] How is the cart item key generated?
- [ ] What happens if the same item is added twice?
- [ ] Where does localStorage get updated?

---

### Exercise 3: Trace Order Creation

**Goal**: Understand the Stripe → Backend → Database flow.

**Steps**:

1. **Start with a completed Stripe payment** (use test mode)

2. **Backend entry** - `server/controllers/orders.controller.js`
   - Set breakpoints at:
     - Line ~72: Idempotency check
     - Line ~86: Stripe session retrieval
     - Line ~93: Payment status verification
     - Line ~137: Database transaction BEGIN
     - Line ~155: Email sending

3. **Watch the database transaction**:
   - Observe `client.query("BEGIN")`
   - See INSERT into orders
   - See INSERT into order_items
   - See COMMIT

**Questions to answer**:
- [ ] What happens if you refresh the success page?
- [ ] What data comes from Stripe's session?
- [ ] Why is email sending done with `.catch()` instead of `await`?

---

### Exercise 4: Trace Password Reset

**Goal**: Understand security token flow.

**Steps**:

1. **Forgot password request** - `customer.auth.controller.js:215`
   - Set breakpoint at `forgotPassword` entry
   - Watch token generation with `crypto.randomBytes`
   - See token stored in database

2. **Reset password** - `customer.auth.controller.js:309`
   - Set breakpoint at `resetPassword` entry
   - Watch token validation query
   - See password hash comparison
   - Watch token marked as used

**Questions to answer**:
- [ ] Why does forgot-password always return the same message?
- [ ] What makes the token expire?
- [ ] Why check if new password differs from current?

---

## 3. Debugging Tips

### Inspect Network Requests (Browser)

1. Open DevTools → Network tab
2. Perform action (login, checkout, etc.)
3. Click the request
4. Check:
   - Request headers (especially cookies)
   - Request body
   - Response body
   - Status code

### Inspect Cookies

1. DevTools → Application → Cookies
2. Look for:
   - `albakes_customer` (customer JWT)
   - `albakes_admin` (admin JWT)
3. Note: Value is encrypted, but you can see expiry

### Decode JWT (for learning)

1. Go to https://jwt.io
2. Paste the cookie value
3. See the payload (role, email, userId, exp)
4. **Note**: Never do this with production tokens!

### Database Queries

While debugging, you can check database state:

```bash
# Connect to local Postgres
docker exec -it albakes-db psql -U postgres -d albakes

# Useful queries
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
SELECT * FROM users WHERE role = 'customer';
SELECT * FROM password_reset_tokens WHERE used_at IS NULL;
```

---

## 4. Common Debugging Scenarios

### "Why isn't my request reaching the server?"

1. Check CORS - look for preflight OPTIONS request
2. Check cookie included - `credentials: "include"` in fetch
3. Check server is running on correct port

### "Why is auth failing?"

1. Check cookie exists in browser
2. Check cookie is sent with request (Network tab)
3. Set breakpoint in requireAdmin/requireCustomer middleware
4. Check JWT_SECRET matches between login and verification

### "Why isn't data saving?"

1. Check for database errors in server console
2. Set breakpoint after pool.query
3. Check result.rows to see what was returned
4. Check for ROLLBACK in transaction

---

## 5. Using Console Logs Strategically

When breakpoints aren't enough, add temporary console logs:

```javascript
// Pattern: Log entry/exit with data
async function createOrder(req, res) {
  console.log(">>> createOrder ENTRY", { body: req.body });

  // ... logic ...

  console.log(">>> createOrder EXIT", { orderId });
  return res.json({ orderId });
}
```

**Remember**: Remove console.logs before committing!

---

## 6. Debugging Checklist

Before each session:
- [ ] Server running in debug mode
- [ ] Browser DevTools open
- [ ] Network tab visible
- [ ] Correct breakpoints set

After each session:
- [ ] Document findings in LESSONS_LEARNED.md
- [ ] Remove temporary console.logs
- [ ] Note any bugs discovered
- [ ] Update study hours log

---

*Happy debugging! Each traced flow deepens your understanding.*
