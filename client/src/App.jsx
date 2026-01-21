import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useCart } from "./cart/CartContext";
import { useAuth } from "./context/AuthContext";
import Home from "./Home";
import Shop from "./Shop";
import ProductDetail from "./ProductDetail";
import Cart from "./Cart";
import Checkout from "./Checkout";
import CheckoutReview from "./CheckoutReview";
import OrderSuccess from "./OrderSuccess";
import TrackOrder from "./TrackOrder";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AdminReviews from "./AdminReviews";
import About from "./About";
import Contact from "./Contact";
import CustomerLogin from "./CustomerLogin";
import CustomerRegister from "./CustomerRegister";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import AdminRegister from "./AdminRegister";
import AdminApprovalRequests from "./AdminApprovalRequests";
import AdminProducts from "./AdminProducts";
import AdminProductForm from "./AdminProductForm";
import AdminReviewReports from "./AdminReviewReports";
import AdminSalesReports from "./AdminSalesReports";

function NavBar() {
  const { items } = useCart();
  const { customer, isAuthenticated, logout } = useAuth();

  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  const handleLogout = async () => {
    await logout();
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
        {isAuthenticated ? (
          <>
            <span style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
              Hi, {customer?.firstName}
            </span>
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

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/review" element={<CheckoutReview />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/track/:orderId" element={<TrackOrder />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
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
