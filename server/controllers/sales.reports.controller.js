import { pool } from "../db.js";

// GET /api/admin/reports/overview - Summary stats
export async function getOverview(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_orders,
        COALESCE(SUM(total_pence) FILTER (WHERE status = 'paid'), 0) as total_revenue,
        COALESCE(AVG(total_pence) FILTER (WHERE status = 'paid'), 0) as avg_order_value,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days' AND status = 'paid') as orders_last_7_days,
        COALESCE(SUM(total_pence) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days' AND status = 'paid'), 0) as revenue_last_7_days,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'paid') as orders_last_30_days,
        COALESCE(SUM(total_pence) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'paid'), 0) as revenue_last_30_days
      FROM orders
    `);

    const stats = result.rows[0];

    // Get customer stats
    const customerStats = await pool.query(`
      SELECT
        COUNT(DISTINCT customer_email) as total_customers,
        COUNT(DISTINCT customer_email) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_customers_30_days
      FROM orders WHERE status = 'paid'
    `);

    return res.json({
      overview: {
        totalOrders: parseInt(stats.total_orders),
        paidOrders: parseInt(stats.paid_orders),
        totalRevenue: parseInt(stats.total_revenue),
        avgOrderValue: Math.round(parseFloat(stats.avg_order_value)),
        pendingOrders: parseInt(stats.pending_orders),
        ordersLast7Days: parseInt(stats.orders_last_7_days),
        revenueLast7Days: parseInt(stats.revenue_last_7_days),
        ordersLast30Days: parseInt(stats.orders_last_30_days),
        revenueLast30Days: parseInt(stats.revenue_last_30_days),
        totalCustomers: parseInt(customerStats.rows[0].total_customers),
        newCustomers30Days: parseInt(customerStats.rows[0].new_customers_30_days),
      },
    });
  } catch (e) {
    console.error("getOverview error:", e);
    return res.status(500).json({ error: "Failed to fetch overview" });
  }
}

// GET /api/admin/reports/sales-by-period - Sales grouped by day/week/month
export async function getSalesByPeriod(req, res) {
  try {
    const { period = "day", days = 30 } = req.query;

    let dateFormat;
    let interval;

    switch (period) {
      case "week":
        dateFormat = "YYYY-IW"; // Year and ISO week
        interval = `${Math.min(days * 7, 365)} days`;
        break;
      case "month":
        dateFormat = "YYYY-MM";
        interval = `${Math.min(days * 30, 365)} days`;
        break;
      default: // day
        dateFormat = "YYYY-MM-DD";
        interval = `${Math.min(parseInt(days), 90)} days`;
    }

    const result = await pool.query(
      `SELECT
        TO_CHAR(created_at, $1) as period,
        COUNT(*) as orders,
        COALESCE(SUM(total_pence), 0) as revenue
       FROM orders
       WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY TO_CHAR(created_at, $1)
       ORDER BY period ASC`,
      [dateFormat]
    );

    return res.json({ sales: result.rows });
  } catch (e) {
    console.error("getSalesByPeriod error:", e);
    return res.status(500).json({ error: "Failed to fetch sales data" });
  }
}

// GET /api/admin/reports/top-products - Best selling products
export async function getTopProducts(req, res) {
  try {
    const { limit = 10, days = 30 } = req.query;

    const result = await pool.query(
      `SELECT
        p.id, p.name, p.image_url, p.category,
        COUNT(oi.id) as order_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.unit_price_pence * oi.quantity) as total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE o.status = 'paid' AND o.created_at >= NOW() - INTERVAL '${Math.min(parseInt(days), 365)} days'
       GROUP BY p.id, p.name, p.image_url, p.category
       ORDER BY total_quantity DESC
       LIMIT $1`,
      [Math.min(parseInt(limit), 50)]
    );

    return res.json({ products: result.rows });
  } catch (e) {
    console.error("getTopProducts error:", e);
    return res.status(500).json({ error: "Failed to fetch top products" });
  }
}

// GET /api/admin/reports/recent-orders - Recent orders list
export async function getRecentOrders(req, res) {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(
      `SELECT id, customer_name, customer_email, total_pence, status, delivery_method, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT $1`,
      [Math.min(parseInt(limit), 100)]
    );

    return res.json({ orders: result.rows });
  } catch (e) {
    console.error("getRecentOrders error:", e);
    return res.status(500).json({ error: "Failed to fetch recent orders" });
  }
}
