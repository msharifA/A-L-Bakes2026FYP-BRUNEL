/**
 * =============================================================================
 * APP.JSX - MAIN APPLICATION ROUTING
 * =============================================================================
 *
 * PURPOSE:
 * This is the root component of the A&L Bakes React application.
 * It defines all client-side routes and the global navigation bar.
 *
 * ROUTING ARCHITECTURE:
 * Uses React Router v6 for client-side navigation. Routes are organized into:
 *
 * PUBLIC ROUTES (no auth required):
 * - /              → Home page (landing)
 * - /menu          → Product catalog (Shop)
 * - /product/:id   → Individual product details
 * - /cart          → Shopping cart
 * - /about, /contact → Static pages
 *
 * CHECKOUT FLOW:
 * - /checkout        → Customer details form (Step 1)
 * - /checkout/review → Order review + Stripe redirect (Step 2)
 * - /order-success   → Post-payment confirmation (Step 3)
 * - /track/:orderId  → Order tracking page
 *
 * CUSTOMER AUTH:
 * - /login           → Customer login
 * - /register        → Customer registration
 * - /forgot-password → Request password reset
 * - /reset-password/:token → Set new password
 *
 * ADMIN ROUTES (protected by auth check in components):
 * - /admin/login     → Admin login page
 * - /admin           → Admin dashboard
 * - /admin/products  → Product management (CRUD)
 * - /admin/reviews   → Review moderation
 * - /admin/sales     → Sales analytics
 *
 * WHY CLIENT-SIDE ROUTING?
 * - Single Page Application (SPA) for fast navigation
 * - No full page reloads between routes
 * - State (cart, auth) persists across navigation
 *
 * =============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "./hooks/useCart";
import { useAuth } from "./hooks/useAuth";

// Page Components - grouped by feature area
// PUBLIC PAGES
import Home from "./Home";
import Shop from "./Shop";
import ProductDetail from "./ProductDetail";
import Cart from "./Cart";
import About from "./About";
import Contact from "./Contact";

// CUSTOM CAKE
import CustomCakeBuilder from "./CustomCakeBuilder";
import CustomCakeSuccess from "./CustomCakeSuccess";

// CHECKOUT FLOW
import Checkout from "./Checkout";
import CheckoutReview from "./CheckoutReview";
import OrderSuccess from "./OrderSuccess";
import TrackOrder from "./TrackOrder";

// CUSTOMER AUTH
import CustomerLogin from "./CustomerLogin";
import CustomerRegister from "./CustomerRegister";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import CustomerProfile from "./CustomerProfile";

// ADMIN PAGES
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AdminReviews from "./AdminReviews";
import AdminRegister from "./AdminRegister";
import AdminApprovalRequests from "./AdminApprovalRequests";
import AdminProducts from "./AdminProducts";
import AdminProductForm from "./AdminProductForm";
import AdminReviewReports from "./AdminReviewReports";
import AdminSalesReports from "./AdminSalesReports";

/**
 * NAVBAR COMPONENT
 *
 * Global navigation bar displayed on all pages.
 *
 * FEATURES:
 * - Logo links to home
 * - Cart icon with live item count badge
 * - Conditional auth display (Login button vs user name + Logout)
 *
 * CONTEXT USAGE:
 * - useCart() → Gets cart items to show count
 * - useAuth() → Gets customer info and auth state
 */
function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  // Cart context - used to display item count badge
  const { items } = useCart();
  // Auth context - used for login/logout state
  const { customer, isAuthenticated, logout } = useAuth();
  // Admin state - check if admin is logged in
  const [isAdmin, setIsAdmin] = useState(false);

  // Function to check admin auth status
  const checkAdminAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      setIsAdmin(data.authenticated === true);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  // Check admin auth status on mount, route change, and auth events
  useEffect(() => {
    checkAdminAuth();

    // Listen for admin login/logout events from other components
    const handleAuthChange = () => checkAdminAuth();
    window.addEventListener("adminAuthChange", handleAuthChange);

    return () => window.removeEventListener("adminAuthChange", handleAuthChange);
  }, [checkAdminAuth, location.pathname]);

  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  const handleLogout = async () => {
    await logout();
  };

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Continue even if request fails
    }
    setIsAdmin(false);
    window.dispatchEvent(new Event("adminAuthChange"));
    navigate("/");
  };

  return (
    <nav
      style={{
        padding: "10px 24px",
        display: "flex",
        gap: 20,
        alignItems: "center",
        background: "var(--color-bg-card)",
        borderBottom: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Link to="/" style={{ display: "flex", alignItems: "center" }}>
        <img
          src="/logo.jpg"
          alt="A&L Bakes"
          style={{
            width: 45,
            height: 45,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </Link>
      <Link to="/">Home</Link>
      <Link to="/menu">Menu</Link>
      <Link to="/custom-cake">Custom Cake</Link>
      <Link to="/cart" style={{ position: "relative" }}>
        Cart
        {cartCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -8,
              right: -12,
              background: "var(--color-primary)",
              color: "#000",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: "50%",
              width: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </Link>

      <div style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center" }}>
        {/* Admin indicator - shows when admin is logged in */}
        {isAdmin && (
          <>
            <Link
              to="/admin"
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: "#dc3545",
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 13,
              }}
            >
              Admin Dashboard
            </Link>
            <button
              onClick={handleAdminLogout}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid #dc3545",
                color: "#dc3545",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Admin Logout
            </button>
          </>
        )}

        {/* Customer auth */}
        {isAuthenticated ? (
          <>
            <Link
              to="/profile"
              style={{
                color: "var(--color-text)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Hi, {customer?.firstName}
            </Link>
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              background: "var(--color-primary)",
              color: "#000",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

/**
 * MAIN APP COMPONENT
 *
 * Root component that sets up:
 * - BrowserRouter for client-side navigation
 * - NavBar (always visible)
 * - All route definitions
 *
 * NOTE: Context providers (CartProvider, AuthProvider) wrap this
 * component in main.jsx to provide global state.
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* Global navigation - visible on all pages */}
      <NavBar />

      {/* Route definitions - React Router v6 syntax */}
      <Routes>
        {/* ===== PUBLIC PAGES ===== */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* ===== CUSTOM CAKE ===== */}
        <Route path="/custom-cake" element={<CustomCakeBuilder />} />
        <Route path="/custom-cake/success" element={<CustomCakeSuccess />} />

        {/* ===== CHECKOUT FLOW ===== */}
        {/* Step 1: Customer enters details */}
        <Route path="/checkout" element={<Checkout />} />
        {/* Step 2: Review order + redirect to Stripe */}
        <Route path="/checkout/review" element={<CheckoutReview />} />
        {/* Step 3: Post-payment success page */}
        <Route path="/order-success" element={<OrderSuccess />} />
        {/* Order tracking (linked from confirmation email) */}
        <Route path="/track/:orderId" element={<TrackOrder />} />

        {/* ===== CUSTOMER AUTH ===== */}
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* :token param comes from email reset link */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Customer profile with order history and reviews */}
        <Route path="/profile" element={<CustomerProfile />} />

        {/* ===== ADMIN ROUTES ===== */}
        {/* Auth is checked inside each component (redirects if not admin) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin/approvals" element={<AdminApprovalRequests />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/products/new" element={<AdminProductForm />} />
        <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
        <Route path="/admin/review-reports" element={<AdminReviewReports />} />
        <Route path="/admin/sales" element={<AdminSalesReports />} />
      </Routes>
    </BrowserRouter>
  );
}
