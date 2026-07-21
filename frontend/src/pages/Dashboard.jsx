import React, { useState, useEffect } from "react";
import { salesAPI } from "../api";
import RecentSalesFeed from "../components/RecentSalesFeed";
import LowStockWidget from "../components/LowStockWidget";
import {
  TrendingUp,
  Store,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#F43F5E", "#8B5CF6"];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    setError("");
    try {
      const res = await salesAPI.getAnalytics();
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Live polling for real-time analytics (every 8 seconds)
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh", flexDirection: "column", gap: "16px" }}>
        <div className="dot" style={{ width: "30px", height: "30px" }}></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading Live Metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "40px 20px" }}>
        <AlertTriangle size={48} style={{ color: "var(--accent)", marginBottom: "16px" }} />
        <h3 style={{ marginBottom: "8px" }}>Could not load data</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>{error}</p>
        <button className="btn btn-primary" onClick={() => fetchAnalytics()}>
          Try Again
        </button>
      </div>
    );
  }

  const { summary, salesByOutlet, salesByCity, salesByCategory, salesOverTime, topSellingProducts } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Metro Operations Dashboard</h1>
          <p className="page-description">Real-time outlet performance and sales statistics</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="live-indicator">
            <span className="dot"></span>
            <span>Live Sales Feed</span>
          </div>
          <button
            className={`btn btn-secondary ${isRefreshing ? "spinning" : ""}`}
            style={{ padding: "10px", display: "flex", alignItems: "center" }}
            onClick={() => fetchAnalytics(true)}
            title="Refresh Live Data"
          >
            <RefreshCw size={16} className={isRefreshing ? "spin-animation" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-data">
            <h3>Total Revenue</h3>
            <div className="value">{formatCurrency(summary.totalRevenue)}</div>
          </div>
          <div className="kpi-icon blue">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-data">
            <h3>Total Transactions</h3>
            <div className="value">{summary.totalTransactions}</div>
          </div>
          <div className="kpi-icon green">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-data">
            <h3>Metro Outlets</h3>
            <div className="value">{summary.totalOutlets}</div>
          </div>
          <div className="kpi-icon cyan">
            <Store size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card text-alert">
          <div className="kpi-data">
            <h3>Low Stock Items</h3>
            <div className="value" style={{ color: summary.lowStockCount > 0 ? "var(--accent)" : "var(--success)" }}>
              {summary.lowStockCount}
            </div>
          </div>
          <div className="kpi-icon orange" style={{ color: summary.lowStockCount > 0 ? "var(--accent)" : "var(--success)" }}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Sales Over Time Line Chart */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Revenue Trend (Last 7 Days)</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" tickFormatter={(str) => str.split("-").slice(1).join("/")} />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-sidebar)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "var(--text-primary)" }}
                  formatter={(val) => [formatCurrency(val), "Revenue"]}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales By City Bar Chart */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Revenue by City</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByCity} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="city" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-sidebar)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "var(--text-primary)" }}
                  formatter={(val) => [formatCurrency(val), "Revenue"]}
                />
                <Bar dataKey="revenue" fill="var(--secondary)" radius={[4, 4, 0, 0]}>
                  {salesByCity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales By Category Pie Chart */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Revenue by Product Category</span>
          </div>
          <div className="chart-wrapper" style={{ display: "flex", justifyContent: "center" }}>
            {salesByCategory.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", color: "var(--text-secondary)" }}>
                No sales recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="category"
                  >
                    {salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--bg-sidebar)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    formatter={(val) => formatCurrency(val)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", color: "var(--text-primary)" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Revenue by Outlet */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Revenue by Outlet</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByOutlet} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="var(--text-secondary)" />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" width={120} style={{ fontSize: "11px" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-sidebar)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  formatter={(val) => formatCurrency(val)}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Sales Feed Row */}
      <div style={{ marginTop: "24px", marginBottom: "24px" }}>
        <RecentSalesFeed />
      </div>

      {/* Lists Row */}
      <div className="grid-cols-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Top Products */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>Top Performing Products</h3>
          <div className="data-table-container" style={{ flexGrow: 1 }}>
            {topSellingProducts.length === 0 ? (
              <div className="empty-state">No products sold yet.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category/SKU</th>
                    <th>Qty Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topSellingProducts.map((p) => (
                    <tr key={p.productId}>
                      <td>{p.name}</td>
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{p.sku}</span>
                      </td>
                      <td>{p.quantity}</td>
                      <td style={{ fontWeight: "600", color: "var(--success)" }}>{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <LowStockWidget />
      </div>
      
      {/* CSS spin animation */}
      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
