import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { formatGBP } from "./utils/formatGBP";

const API = import.meta.env.VITE_API_URL || "";

function formatGBPFromPence(pence) {
  if (typeof pence !== "number") return "";
  return formatGBP(pence);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const colors = {
    paid: { bg: "#22c55e", text: "#000" },
    processing: { bg: "#3b82f6", text: "#fff" },
    ready: { bg: "#f59e0b", text: "#000" },
    delivered: { bg: "#10b981", text: "#000" },
    cancelled: { bg: "#ef4444", text: "#fff" },
    pending: { bg: "#6b7280", text: "#fff" },
    approved: { bg: "#22c55e", text: "#000" },
    rejected: { bg: "#ef4444", text: "#fff" },
  };
  const c = colors[status] || colors.pending;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

function StarRating({ rating }) {
  return (
    <span style={{ color: "#f5a623" }}>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export default function CustomerProfile() {
  const { customer, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch orders and reviews
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchData() {
      try {
        setLoadingData(true);
        setError(null);

        const [ordersRes, reviewsRes] = await Promise.all([
          fetch(`${API}/api/customer/orders`, { credentials: "include" }),
          fetch(`${API}/api/customer/reviews`, { credentials: "include" }),
        ]);

        if (!ordersRes.ok || !reviewsRes.ok) {
          throw new Error("Failed to load profile data");
        }

        const [ordersData, reviewsData] = await Promise.all([
          ordersRes.json(),
          reviewsRes.json(),
        ]);

        setOrders(ordersData.orders || []);
        setReviews(reviewsData.reviews || []);
      } catch (e) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div style={{ padding: 16, maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabStyle = (isActive) => ({
    padding: "10px 20px",
    border: "none",
    background: isActive ? "var(--color-primary)" : "transparent",
    color: isActive ? "#000" : "var(--color-text)",
    fontWeight: isActive ? 600 : 400,
    cursor: "pointer",
    borderRadius: 8,
    fontSize: 14,
  });

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>My Account</h1>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          Welcome back, {customer?.firstName}!
        </p>
      </div>

      {/* Account Info Card */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700,
            color: "#000",
          }}
        >
          {customer?.firstName?.[0]?.toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, marginBottom: 4 }}>
            {customer?.firstName} {customer?.lastName}
          </h3>
          <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 14 }}>
            {customer?.email}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button style={tabStyle(activeTab === "orders")} onClick={() => setActiveTab("orders")}>
          Order History
        </button>
        <button style={tabStyle(activeTab === "reviews")} onClick={() => setActiveTab("reviews")}>
          My Reviews
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: 12,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid #ef4444",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Loading State */}
      {loadingData && <p>Loading your data...</p>}

      {/* Orders Tab */}
      {!loadingData && activeTab === "orders" && (
        <div>
          {orders.length === 0 ? (
            <div
              className="card"
              style={{ padding: 32, textAlign: "center" }}
            >
              <p style={{ fontSize: 48, margin: 0 }}>&#128722;</p>
              <h3 style={{ marginTop: 12, marginBottom: 8 }}>No orders yet</h3>
              <p style={{ color: "var(--color-text-muted)", marginBottom: 16 }}>
                When you place an order, it will appear here.
              </p>
              <Link
                to="/menu"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "var(--color-primary)",
                  color: "#000",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {orders.map((order) => (
                <div key={order.id} className="card" style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                        {formatDate(order.createdAt)}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 18 }}>
                        {formatGBPFromPence(order.totalPence)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <StatusBadge status={order.status} />
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-muted)",
                          marginTop: 4,
                        }}
                      >
                        {order.deliveryMethod === "delivery" ? "Delivery" : "Pickup"}
                        {order.deliveryDate && ` - ${formatDate(order.deliveryDate)}`}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div
                    style={{
                      background: "var(--color-bg-secondary)",
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 14,
                          padding: "4px 0",
                          borderBottom:
                            idx < order.items.length - 1
                              ? "1px solid var(--color-border)"
                              : "none",
                        }}
                      >
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span style={{ color: "var(--color-text-muted)" }}>
                          {formatGBPFromPence(item.lineTotalPence)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Track Order Link */}
                  <div style={{ marginTop: 12 }}>
                    <Link
                      to={`/track/${order.id}`}
                      style={{
                        fontSize: 14,
                        color: "var(--color-primary)",
                        textDecoration: "none",
                      }}
                    >
                      Track Order &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {!loadingData && activeTab === "reviews" && (
        <div>
          {reviews.length === 0 ? (
            <div
              className="card"
              style={{ padding: 32, textAlign: "center" }}
            >
              <p style={{ fontSize: 48, margin: 0 }}>&#9733;</p>
              <h3 style={{ marginTop: 12, marginBottom: 8 }}>No reviews yet</h3>
              <p style={{ color: "var(--color-text-muted)", marginBottom: 16 }}>
                Share your thoughts after trying our bakes!
              </p>
              <Link
                to="/menu"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "var(--color-primary)",
                  color: "#000",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {reviews.map((review) => (
                <div key={review.id} className="card" style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Product Image */}
                    {review.productImage && (
                      <img
                        src={review.productImage}
                        alt={review.productName}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    )}

                    <div style={{ flex: 1 }}>
                      {/* Product Name & Status */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <Link
                            to={`/product/${review.productId}`}
                            style={{
                              fontWeight: 600,
                              color: "var(--color-text)",
                              textDecoration: "none",
                            }}
                          >
                            {review.productName}
                          </Link>
                          <div style={{ marginTop: 2 }}>
                            <StarRating rating={review.rating} />
                          </div>
                        </div>
                        <StatusBadge status={review.status} />
                      </div>

                      {/* Review Text */}
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          color: "var(--color-text-muted)",
                          lineHeight: 1.5,
                        }}
                      >
                        "{review.reviewText}"
                      </p>

                      {/* Date & Badge */}
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          gap: 12,
                          fontSize: 12,
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <span>{formatDate(review.createdAt)}</span>
                        {review.verifiedPurchase && (
                          <span style={{ color: "#22c55e" }}>Verified Purchase</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
