import React from "react";
import { 
  TrendingUp, 
  Store, 
  Package, 
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";
import ThresholdAlerts from "./ThresholdAlerts";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";

const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#3b82f6", "#ef4444"];

export default function DashboardView({ analyticsData, alerts = [], loading, onNavigateToSales, onNavigateToProducts }) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading analytics data...</p>
      </div>
    );
  }

  const {
    summary = { totalRevenue: 0, totalSalesCount: 0, totalItemsSold: 0, activeOutlets: 0, totalProducts: 0 },
    salesOverTime = [],
    salesByCity = [],
    salesByOutlet = [],
    topProducts = [],
    lowStockAlerts = []
  } = analyticsData || {};

  // Formatter for Indian Rupees
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="fade-in">
      {/* Dynamic Stock Threshold Alerts */}
      <ThresholdAlerts alerts={alerts} onNavigateToProducts={onNavigateToProducts} />

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="glass-card interactive">
          <div className="flex-between mb-4">
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>Total Revenue</span>
            <div style={{ background: "rgba(99, 102, 241, 0.1)", padding: "8px", borderRadius: "8px", color: "var(--primary)" }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
            {formatCurrency(summary.totalRevenue)}
          </h2>
          <p style={{ color: "var(--success)", fontSize: "0.8rem", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <ArrowUpRight size={14} /> Live Sync Active
          </p>
        </div>

        <div className="glass-card interactive">
          <div className="flex-between mb-4">
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>Transactions</span>
            <div style={{ background: "rgba(236, 72, 153, 0.1)", padding: "8px", borderRadius: "8px", color: "#ec4899" }}>
              <ShoppingCart size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
            {summary.totalSalesCount}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "4px" }}>
            Total items sold: {summary.totalItemsSold}
          </p>
        </div>

        <div className="glass-card interactive">
          <div className="flex-between mb-4">
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>Active Outlets</span>
            <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "8px", borderRadius: "8px", color: "var(--success)" }}>
              <Store size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
            {summary.activeOutlets}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "4px" }}>
            Across metro cities
          </p>
        </div>

        <div className="glass-card interactive">
          <div className="flex-between mb-4">
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>Products catalog</span>
            <div style={{ background: "rgba(6, 182, 212, 0.1)", padding: "8px", borderRadius: "8px", color: "var(--info)" }}>
              <Package size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
            {summary.totalProducts}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "4px" }}>
            Unique SKUs defined
          </p>
        </div>
      </div>

      {summary.totalSalesCount === 0 ? (
        <div className="glass-card text-center" style={{ padding: "48px 24px" }}>
          <ShoppingCart size={48} className="text-muted" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ color: "#fff" }}>No sales recorded yet</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: "400px", margin: "8px auto 24px" }}>
            Record your first sale to populate live interactive charts, track city-wise demand, and monitor business growth.
          </p>
          <button onClick={onNavigateToSales} className="btn btn-primary">
            Record First Transaction
          </button>
        </div>
      ) : (
        <>
          {/* Charts Row 1 */}
          <div className="charts-grid">
            {/* Sales over time */}
            <div className="glass-card">
              <h3 style={{ marginBottom: "20px" }}>Revenue Trend</h3>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid var(--border-light)", borderRadius: "8px", color: "#fff" }}
                      formatter={(value) => [formatCurrency(value), "Revenue"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by city */}
            <div className="glass-card">
              <h3 style={{ marginBottom: "20px" }}>Metro Demand</h3>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByCity} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <YAxis type="category" dataKey="city" stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid var(--border-light)", borderRadius: "8px", color: "#fff" }}
                      formatter={(value) => [formatCurrency(value), "Sales"]}
                    />
                    <Bar dataKey="revenue" fill="#ec4899" radius={[0, 4, 4, 0]}>
                      {salesByCity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
            {/* Sales by Outlet */}
            <div className="glass-card">
              <h3 style={{ marginBottom: "20px" }}>Outlet Share</h3>
              <div style={{ width: "100%", height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "60%", height: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByOutlet}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="revenue"
                      >
                        {salesByOutlet.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid var(--border-light)", borderRadius: "8px", color: "#fff" }}
                        formatter={(value) => [formatCurrency(value), "Sales"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: "40%", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", overflowY: "auto", maxHeight: "200px" }}>
                  {salesByOutlet.map((entry, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: COLORS[index % COLORS.length] }} />
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 600 }}>{entry.name}</span>: {formatCurrency(entry.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="glass-card">
              <h3 style={{ marginBottom: "20px" }}>Top Selling Products</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {topProducts.map((prod, index) => (
                  <div 
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      background: "rgba(255, 255, 255, 0.02)",
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-light)"
                    }}
                  >
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: index === 0 ? "var(--warning-gradient)" : "rgba(255, 255, 255, 0.05)",
                      color: index === 0 ? "#000" : "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem"
                    }}>
                      #{index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{prod.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{prod.quantity} units sold</div>
                    </div>
                    <div style={{ fontWeight: 700, color: "var(--success)" }}>
                      {formatCurrency(prod.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
