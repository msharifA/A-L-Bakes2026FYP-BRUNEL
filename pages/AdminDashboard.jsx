
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogout } from "../api/auth";
import "../styles/admin-dashboard.css";

export default function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setIsLoggingOut(true);
    setError("");
    try {
      await adminLogout();
      onLogout(); // Update App.jsx state
      navigate("/");
    } catch (err) {
      setError(err.message || "Logout failed");
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button
          className="btn-logout"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-content">
        {/* ...existing code... */}
      </div>
    </div>
  );
}