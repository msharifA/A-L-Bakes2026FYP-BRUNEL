import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOverview, getSalesByPeriod, getTopProducts, getRecentOrders } from "./api/salesReports";
import { formatGBP } from "./utils/formatGBP";

export default function AdminSalesReports() {
  const [overview, setOverview] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("day");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewData, salesPeriod, topProds, recent] = await Promise.all([
          getOverview(),
          getSalesByPeriod(period, 30),
          getTopProducts(5, 30),
          getRecentOrders(5),
        ]);

        setOverview(overviewData.overview);
        setSalesData(salesPeriod.sales);
        setTopProducts(topProds.products);
        setRecentOrders(recent.orders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && !overview) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "var(--color-error)" }}>{error}</p>
        <Link to="/admin" style={{ color: "var(--color-primary)" }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/admin" style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ marginTop: 8 }}>Sales Reports</h1>
      </div>

      {/* Overview Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 4 }}>
            Total Revenue
          </p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "var(--color-primary)" }}>
            {formatGBP(overview?.totalRevenue || 0)}
          </p>
        </div>
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 4 }}>
            Last 30 Days
          </p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>
            {formatGBP(overview?.revenueLast30Days || 0)}
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {overview?.ordersLast30Days || 0} orders
          </p>
        </div>
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 4 }}>
            Last 7 Days
          </p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>
            {formatGBP(overview?.revenueLast7Days || 0)}
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {overview?.ordersLast7Days || 0} orders
          </p>
        </div>
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 4 }}>
            Avg Order Value
          </p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>
            {formatGBP(overview?.avgOrderValue || 0)}
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div className="card" style={{ padding: 16, textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 600 }}>{overview?.paidOrders || 0}</p>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Completed Orders</p>
        </div>
        <div className="card" style={{ padding: 16, textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 600, color: "#f5a623" }}>
            {overview?.pendingOrders || 0}
          </p>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Pending Orders</p>
        </div>
        <div className="card" style={{ padding: 16, textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 600 }}>{overview?.totalCustomers || 0}</p>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Total Customers</p>
        </div>
        <div className="card" style={{ padding: 16, textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 600, color: "#28a745" }}>
            {overview?.newCustomers30Days || 0}
          </p>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>New (30 days)</p>
        </div>
      </div>

      {/* Sales by Period */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Sales Trend</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {["day", "week", "month"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: period === p ? "var(--color-primary)" : "var(--color-bg)",
                  color: period === p ? "#000" : "var(--color-text)",
                  border: "none",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  fontSize: 13,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {salesData.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: 20 }}>
            No sales data available
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: 10 }}>Period</th>
                  <th style={{ textAlign: "right", padding: 10 }}>Orders</th>
                  <th style={{ textAlign: "right", padding: 10 }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: 10 }}>{row.period}</td>
                    <td style={{ padding: 10, textAlign: "right" }}>{row.orders}</td>
                    <td style={{ padding: 10, textAlign: "right", fontWeight: 600 }}>
                      {formatGBP(parseInt(row.revenue))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Top Products */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Top Products (30 days)</h2>
          {topProducts.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", textAlign: "center" }}>No data</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {topProducts.map((product, idx) => (
                <div
                  key={product.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 10,
                    background: "var(--color-bg)",
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: idx < 3 ? "var(--color-primary)" : "var(--color-bg-card)",
                      color: idx < 3 ? "#000" : "var(--color-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {idx + 1}
                  </span>
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, marginBottom: 2 }}>{product.name}</p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {product.total_quantity} sold
                    </p>
                  </div>
                  <p style={{ fontWeight: 600 }}>{formatGBP(parseInt(product.total_revenue))}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", textAlign: "center" }}>No orders</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: 10,
                    background: "var(--color-bg)",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{order.customer_name}</span>
                    <span style={{ fontWeight: 600 }}>{formatGBP(order.total_pence)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-muted)" }}>
                    <span>{formatDate(order.created_at)}</span>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: order.status === "paid" ? "#28a745" : "#f5a623",
                        color: order.status === "paid" ? "#fff" : "#000",
                        fontSize: 11,
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/admin"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: 12,
              color: "var(--color-primary)",
              fontSize: 14,
            }}
          >
            View all orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
