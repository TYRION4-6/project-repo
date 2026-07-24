import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Layers,
  BarChart2,
  LogOut,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { api } from "../api";

const CATEGORY_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function AnalyticsDashboard({ outlets, selectedOutlet, setSelectedOutlet, user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("ALL");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, prodsRes] = await Promise.all([
        api.getAnalytics(selectedOutlet),
        api.getProducts(),
      ]);
      setData(analyticsRes);
      if (Array.isArray(prodsRes)) {
        setProducts(prodsRes);
      }
    } catch (err) {
      console.error("Failed to load analytics data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedOutlet]);

  if (loading || !data) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        <h3>Loading Real-time Analytics & Multi-Branch Metrics...</h3>
      </div>
    );
  }

  const { metrics, dailyTrend, outletPerformance, topProducts, categoryBreakdown } = data;

  // Selected Product breakdown data
  const selectedProduct = products.find((p) => String(p._id) === String(selectedProductId));
  const selectedProductOutletData = selectedProduct
    ? selectedProduct.outletBreakdown.map((ob) => ({
        name: ob.city,
        stock: ob.stock,
        outletName: ob.outletName,
      }))
    : [];

  return (
    <div>
      {/* Page Header & Filters */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Performance Analytics & Decision Support Dashboard</h2>
          <p>Compare outlet revenue, stock velocity, and per-product metrics for data-driven retail decisions</p>
        </div>

        <div className="filter-controls">
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "0.2rem" }}>
              Branch Outlet Filter:
            </label>
            <select
              className="select-input"
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
            >
              <option value="ALL">All Metro Outlets</option>
              {outlets.map((out) => (
                <option key={out._id} value={out._id}>
                  {out.name} ({out.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "0.2rem" }}>
              Deep Product Drill-down:
            </label>
            <select
              className="select-input"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="ALL">All Product Items</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {onLogout && (
            <div>
              <label style={{ fontSize: "0.8rem", color: "transparent", display: "block", marginBottom: "0.2rem" }}>
                Actions
              </label>
              <button
                className="btn btn-danger btn-sm logout-btn"
                onClick={onLogout}
                title="Logout"
                style={{ height: "38px" }}
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <p>Total Revenue</p>
            <div className="metric-value">₹{metrics.totalRevenue.toLocaleString("en-IN")}</div>
          </div>
          <div className="metric-icon-box indigo">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <p>Sales Transactions</p>
            <div className="metric-value">{metrics.totalOrders}</div>
          </div>
          <div className="metric-icon-box blue">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <p>Units Sold</p>
            <div className="metric-value">{metrics.totalItemsSold}</div>
          </div>
          <div className="metric-icon-box emerald">
            <Layers size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <p>Avg Order Value</p>
            <div className="metric-value">₹{metrics.averageOrderValue.toLocaleString("en-IN")}</div>
          </div>
          <div className="metric-icon-box amber">
            <BarChart2 size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <p>Low Stock Alerts</p>
            <div className="metric-value" style={{ color: metrics.lowStockCount > 0 ? "#ef4444" : "white" }}>
              {metrics.lowStockCount}
            </div>
          </div>
          <div className="metric-icon-box rose">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Specific Product Deep Drilldown view if selected */}
      {selectedProduct && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(30, 41, 59, 0.9) 100%)",
            border: "1px solid var(--primary)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>
                Product Specific Drill-Down Analysis
              </div>
              <h3 style={{ color: "white", fontSize: "1.3rem", fontWeight: 800 }}>{selectedProduct.name}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                SKU: <strong>{selectedProduct.sku}</strong> | Category: <strong>{selectedProduct.category}</strong>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#34d399" }}>
                ₹{selectedProduct.price.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Cost Price: ₹{selectedProduct.costPrice} | Est. Unit Profit: ₹{selectedProduct.price - selectedProduct.costPrice}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <h4 style={{ color: "white", fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                Stock Distribution per Branch Outlet
              </h4>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedProductOutletData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e3b52" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", borderColor: "#2e3b52", borderRadius: "8px", color: "white" }}
                      formatter={(val) => [`${val} ${selectedProduct.unit}`, "Current Stock"]}
                    />
                    <Bar dataKey="stock" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 style={{ color: "white", fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                Branch Inventory Breakdown Table
              </h4>
              <div className="table-container" style={{ borderRadius: "var(--radius-md)" }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Branch Outlet</th>
                      <th>Stock Quantity</th>
                      <th>Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.outletBreakdown.map((ob) => (
                      <tr key={ob.outletId}>
                        <td style={{ fontWeight: 600, color: "white" }}>{ob.outletName} ({ob.city})</td>
                        <td style={{ fontWeight: 700 }}>{ob.stock} {selectedProduct.unit}</td>
                        <td>
                          <span
                            style={{
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              background: ob.isLowStock ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                              color: ob.isLowStock ? "#fca5a5" : "#34d399",
                            }}
                          >
                            {ob.isLowStock ? "LOW STOCK ALERT" : "OPTIMAL"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="charts-grid">
        {/* Sales & Revenue Trend (AreaChart) */}
        <div className="chart-card col-8">
          <div className="chart-header">
            <div>
              <div className="chart-title">7-Day Sales & Revenue Velocity</div>
              <div className="chart-subtitle">Daily aggregated revenue across urban branches</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#34d399", fontSize: "0.82rem", fontWeight: 700 }}>
              <TrendingUp size={16} /> Live Analytics Engine
            </div>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3b52" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#2e3b52", borderRadius: "8px", color: "white" }}
                  formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (PieChart) */}
        <div className="chart-card col-4">
          <div className="chart-header">
            <div>
              <div className="chart-title">Category Revenue Share</div>
              <div className="chart-subtitle">Sales contribution per retail sector</div>
            </div>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#2e3b52", borderRadius: "8px", color: "white" }}
                  formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Legend formatter={(value) => <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outlet Performance Comparison (BarChart) */}
        <div className="chart-card col-6">
          <div className="chart-header">
            <div>
              <div className="chart-title">Branch Outlet Revenue Comparison</div>
              <div className="chart-subtitle">Comparative sales across metro city locations</div>
            </div>
          </div>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outletPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3b52" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#2e3b52", borderRadius: "8px", color: "white" }}
                  formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="chart-card col-6">
          <div className="chart-header">
            <div>
              <div className="chart-title">Top 5 Revenue Generating Products</div>
              <div className="chart-subtitle">Highest grossing inventory items</div>
            </div>
          </div>
          <div className="table-container" style={{ border: "none", borderRadius: "0" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Units Sold</th>
                  <th>Total Gross Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: "white" }}>{p.name}</td>
                    <td>{p.unitsSold} pcs</td>
                    <td style={{ color: "#34d399", fontWeight: 700 }}>₹{p.revenue.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
