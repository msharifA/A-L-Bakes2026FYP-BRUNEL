
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import CheckoutReview from "./pages/CheckoutReview";
import OrderSuccess from "./pages/OrderSuccess";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { authMe } from "./api/auth";
import "./styles/app.css";

export default function App() {
  const [isAdminAuth, setIsAdminAuth] = useState(null); // null = loading, true/false = checked

  useEffect(() => {
    checkAdminAuth();
  }, []);

  async function checkAdminAuth() {
    try {
      const data = await authMe();
      setIsAdminAuth(data.authenticated || false);
    } catch (err) {
      console.log("Not authenticated:", err.message);
      setIsAdminAuth(false);
    }
  }

  return (
    <CartProvider>
      <Router>
        <header className="app-header">
          <Link to="/" className="logo">A&L Bakes</Link>
          <nav className="nav-links">
            <Link to="/">Shop</Link>
            {isAdminAuth === true && <Link to="/admin">Admin</Link>}
            {isAdminAuth === true && (
              <button
                className="logout-btn"
                onClick={() => {
                  // Logout handled in AdminDashboard, but can trigger here
                  setIsAdminAuth(false);
                }}
              >
                Account
              </button>
            )}
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/review" element={<CheckoutReview />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/admin/login" element={<AdminLogin onAuthSuccess={() => setIsAdminAuth(true)} />} />
          <Route path="/admin" element={isAdminAuth ? <AdminDashboard onLogout={() => setIsAdminAuth(false)} /> : <AdminLogin onAuthSuccess={() => setIsAdminAuth(true)} />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}