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
  Coins,
  Package,
  Award,
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

const periodLabels = {
  today: "Today",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  all: "All Time",
};

const Dashboard = () => {
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = async (silent = false, selectedPeriod = period) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    setError("");
    try {
      const res = await salesAPI.getAnalytics(selectedPeriod);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(false, period);

    // Live polling for real-time analytics (every 8 seconds)
    const interval = setInterval(() => {
      fetchAnalytics(true, period);
    }, 8000);

    return () => clearInterval(interval);
  }, [period]);

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
        <button className="btn btn-primary" onClick={() => fetchAnalytics(false, period)}>
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
          {/* Time Range Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "500" }}>Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="filter-select"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                color: "var(--text-primary)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "var(--border-radius-md)",
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="today" style={{ backgroundColor: "var(--bg-sidebar)" }}>Today</option>
              <option value="7d" style={{ backgroundColor: "var(--bg-sidebar)" }}>Last 7 Days</option>
              <option value="30d" style={{ backgroundColor: "var(--bg-sidebar)" }}>Last 30 Days</option>
              <option value="all" style={{ backgroundColor: "var(--bg-sidebar)" }}>All Time</option>
            </select>
          </div>

          <div className="live-indicator">
            <span className="dot"></span>
            <span>Live Sales Feed</span>
          </div>
          <button
            className={`btn btn-secondary ${isRefreshing ? "spinning" : ""}`}
            style={{ padding: "10px", display: "flex", alignItems: "center" }}
            onClick={() => fetchAnalytics(true, period)}
            title="Refresh Live Data"
          >
            <RefreshCw size={16} className={isRefreshing ? "spin-animation" : ""} />
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards for Selected Period */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "3px", height: "14px", backgroundColor: "var(--primary)", borderRadius: "2px" }}></span>
          <span>Period Summary Metrics ({periodLabels[period]})</span>
        </h2>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {/* Total Sales Card */}
          <div className="glass-card kpi-card" style={{
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(17, 24, 39, 0.7) 100%)",
            border: "1px solid rgba(79, 70, 229, 0.2)",
            boxShadow: "0 8px 32px 0 rgba(79, 70, 229, 0.1)"
          }}>
            <div className="kpi-data" style={{ width: "100%" }}>
              <h3>Total Sales</h3>
              <div className="value" style={{ color: "var(--text-primary)" }}>{formatCurrency(summary.totalRevenue)}</div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                {summary.totalTransactions} transactions
              </p>
            </div>
            <div className="kpi-icon" style={{
              background: "rgba(79, 70, 229, 0.1)",
              color: "var(--primary)",
              border: "1px solid rgba(79, 70, 229, 0.2)"
            }}>
              <Coins size={24} />
            </div>
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "3px",
              background: "linear-gradient(to right, var(--primary), var(--secondary))"
            }}></div>
          </div>

          {/* Average Inventory Card */}
          <div className="glass-card kpi-card" style={{
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(17, 24, 39, 0.7) 100%)",
            border: "1px solid rgba(6, 182, 212, 0.2)",
            boxShadow: "0 8px 32px 0 rgba(6, 182, 212, 0.1)"
          }}>
            <div className="kpi-data" style={{ width: "100%" }}>
              <h3>Avg Inventory Level</h3>
              <div className="value" style={{ color: "var(--text-primary)" }}>
                {summary.averageInventory} <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-secondary)" }}>units/item</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Across {summary.totalProducts} products
              </p>
            </div>
            <div className="kpi-icon" style={{
              background: "rgba(6, 182, 212, 0.1)",
              color: "var(--secondary)",
              border: "1px solid rgba(6, 182, 212, 0.2)"
            }}>
              <Package size={24} />
            </div>
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "3px",
              background: "linear-gradient(to right, var(--secondary), var(--success))"
            }}></div>
          </div>

          {/* Best-Selling Product Card */}
          <div className="glass-card kpi-card" style={{
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(17, 24, 39, 0.7) 100%)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            boxShadow: "0 8px 32px 0 rgba(245, 158, 11, 0.1)"
          }}>
            <div className="kpi-data" style={{ width: "calc(100% - 56px)" }}>
              <h3>Best-Selling Product</h3>
              <div className="value" style={{
                fontSize: "18px",
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                margin: "4px 0",
                fontWeight: "700"
              }} title={summary.bestSellingProduct ? summary.bestSellingProduct.name : "No sales record"}>
                {summary.bestSellingProduct ? summary.bestSellingProduct.name : "N/A"}
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {summary.bestSellingProduct
                  ? `${summary.bestSellingProduct.quantity} sold (${formatCurrency(summary.bestSellingProduct.revenue)})`
                  : "No sales recorded"
                }
              </p>
            </div>
            <div className="kpi-icon" style={{
              background: "rgba(245, 158, 11, 0.1)",
              color: "var(--warning)",
              border: "1px solid rgba(245, 158, 11, 0.2)"
            }}>
              <Award size={24} />
            </div>
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "3px",
              background: "linear-gradient(to right, var(--warning), var(--accent))"
            }}></div>
          </div>
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
            <span className="chart-title">Revenue Trend ({periodLabels[period]})</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" tickFormatter={(str) => str.includes("-") ? str.split("-").slice(1).join("/") : str} />
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
