import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Layers,
  BarChart2,
  LogOut,
  Filter,
  ArrowUpDown,
  HelpCircle,
  Activity,
  CheckCircle2,
  PieChart as PieChartIcon
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
  ComposedChart,
  Line
} from "recharts";
import { api } from "../api";

const CATEGORY_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function AnalyticsDashboard({ outlets, selectedOutlet, setSelectedOutlet, user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("ALL");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Outlet Turnover Interactive Controls State
  const [selectedMetric, setSelectedMetric] = useState("turnoverRatioCOGS");
  const [overlayMetric, setOverlayMetric] = useState("revenue");
  const [performanceFilter, setPerformanceFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("turnoverRatioCOGS");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFormulaModal, setShowFormulaModal] = useState(false);

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

  // Process & Filter Outlet Metrics for Recharts
  const processedOutlets = useMemo(() => {
    if (!data || !data.outletPerformance) return [];
    let list = [...data.outletPerformance];

    // City Filter
    if (cityFilter !== "ALL") {
      list = list.filter((out) => out.city.toLowerCase() === cityFilter.toLowerCase());
    }

    // Performance Tier Filter
    if (performanceFilter === "HIGH") {
      list = list.filter((out) => out.turnoverRatioCOGS >= 0.25);
    } else if (performanceFilter === "MODERATE") {
      list = list.filter((out) => out.turnoverRatioCOGS >= 0.10 && out.turnoverRatioCOGS < 0.25);
    } else if (performanceFilter === "LOW") {
      list = list.filter((out) => out.turnoverRatioCOGS < 0.10);
    }

    // Sorting
    list.sort((a, b) => {
      let valA = a[sortBy] ?? 0;
      let valB = b[sortBy] ?? 0;

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return list;
  }, [data, cityFilter, performanceFilter, sortBy, sortOrder]);

  if (loading || !data) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        <h3>Loading Real-time Analytics & Multi-Branch Metrics...</h3>
      </div>
    );
  }

  const { metrics, dailyTrend, outletPerformance, topProducts, categoryBreakdown } = data;

  // Available unique cities for filter dropdown
  const uniqueCities = Array.from(new Set(outletPerformance.map((o) => o.city)));

  // Selected Product breakdown data
  const selectedProduct = products.find((p) => String(p._id) === String(selectedProductId));
  const selectedProductOutletData = selectedProduct
    ? selectedProduct.outletBreakdown.map((ob) => ({
        name: ob.city,
        stock: ob.stock,
        outletName: ob.outletName,
      }))
    : [];

  // Metric Labels & Formatter Helpers
  const metricConfigs = {
    turnoverRatioCOGS: { label: "Inventory Turnover Ratio (COGS)", unit: "x", isCurrency: false, color: "#10b981" },
    turnoverRatioSales: { label: "Inventory Turnover Ratio (Retail)", unit: "x", isCurrency: false, color: "#3b82f6" },
    revenue: { label: "Total Sales Revenue", unit: "₹", isCurrency: true, color: "#6366f1" },
    cogs: { label: "Cost of Goods Sold (COGS)", unit: "₹", isCurrency: true, color: "#f59e0b" },
    grossProfit: { label: "Gross Profit Margin", unit: "₹", isCurrency: true, color: "#ec4899" },
    inventoryValueCost: { label: "Inventory Stock Value (Cost)", unit: "₹", isCurrency: true, color: "#8b5cf6" },
    totalStock: { label: "Inventory Stock Units", unit: "pcs", isCurrency: false, color: "#06b6d4" },
    unitsSold: { label: "Units Sold", unit: "pcs", isCurrency: false, color: "#f43f5e" },
  };

  const formatMetricVal = (val, key) => {
    const config = metricConfigs[key] || { isCurrency: false, unit: "" };
    if (config.isCurrency) {
      return `₹${Number(val || 0).toLocaleString("en-IN")}`;
    }
    return `${val} ${config.unit}`.trim();
  };

  return (
    <div>
      {/* Page Header & Filters */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Performance Analytics & Inventory Turnover Dashboard</h2>
          <p>Multi-branch turnover ratios, sales velocity, and stock management insights</p>
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
            <p>Total Sales Revenue</p>
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

      {/* Turnover Calculation Definition & Help Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ background: "rgba(99, 102, 241, 0.15)", padding: "0.6rem", borderRadius: "10px", color: "#818cf8" }}>
              <Activity size={24} />
            </div>
            <div>
              <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                Inventory Turnover & Sales Analytics Engine
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0, marginTop: "2px" }}>
                Measures how quickly inventory stock is converted into sales revenue across branch outlets.
              </p>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <HelpCircle size={16} />
            <span>{showFormulaModal ? "Hide Calculation Formulas" : "View Formulas & Definitions"}</span>
          </button>
        </div>

        {showFormulaModal && (
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border-color)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "0.85rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                1. Inventory Turnover Ratio (COGS Basis)
              </div>
              <div style={{ fontFamily: "monospace", color: "white", fontSize: "0.8rem", background: "rgba(0,0,0,0.3)", padding: "0.4rem", borderRadius: "4px" }}>
                Turnover (COGS) = COGS / Inventory Value at Cost
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.4rem", margin: 0 }}>
                Measures stock rotation efficiency relative to wholesale product cost.
              </p>
            </div>

            <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "0.85rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ color: "#3b82f6", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                2. Inventory Turnover Ratio (Retail Basis)
              </div>
              <div style={{ fontFamily: "monospace", color: "white", fontSize: "0.8rem", background: "rgba(0,0,0,0.3)", padding: "0.4rem", borderRadius: "4px" }}>
                Turnover (Retail) = Total Sales Revenue / Inventory Value at Retail
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.4rem", margin: 0 }}>
                Measures revenue generated relative to retail value of held inventory.
              </p>
            </div>

            <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "0.85rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ color: "#ec4899", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                3. Unit Turnover Ratio
              </div>
              <div style={{ fontFamily: "monospace", color: "white", fontSize: "0.8rem", background: "rgba(0,0,0,0.3)", padding: "0.4rem", borderRadius: "4px" }}>
                Unit Turnover = Total Units Sold / Total Stock Units
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.4rem", margin: 0 }}>
                Measures physical unit sales velocity against on-hand store inventory.
              </p>
            </div>
          </div>
        )}
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

      {/* DYNAMIC OUTLET METRICS & TURNOVER RECHARTS VISUALIZATION */}
      <div
        className="chart-card"
        style={{
          marginBottom: "2rem",
          padding: "1.5rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <div className="chart-title" style={{ fontSize: "1.2rem", color: "white", fontWeight: 800 }}>
              Interactive Outlet Performance & Inventory Turnover Chart
            </div>
            <div className="chart-subtitle" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Filter, sort, and visualize turnover velocity across all store locations
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(99, 102, 241, 0.1)", padding: "0.4rem 0.8rem", borderRadius: "20px", color: "#818cf8", fontSize: "0.8rem", fontWeight: 700 }}>
            <TrendingUp size={16} /> Showing {processedOutlets.length} Outlets
          </div>
        </div>

        {/* UI CONTROLS BAR */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            padding: "1rem",
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            marginBottom: "1.5rem",
          }}
        >
          {/* Primary Metric Select */}
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
              Primary Chart Metric:
            </label>
            <select
              className="select-input"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              style={{ width: "100%", height: "36px" }}
            >
              <option value="turnoverRatioCOGS">Turnover Ratio (COGS Basis)</option>
              <option value="turnoverRatioSales">Turnover Ratio (Retail Basis)</option>
              <option value="revenue">Total Sales Revenue (₹)</option>
              <option value="cogs">Cost of Goods Sold (COGS ₹)</option>
              <option value="grossProfit">Gross Profit Margin (₹)</option>
              <option value="inventoryValueCost">Inventory Valuation (Cost ₹)</option>
              <option value="unitsSold">Units Sold (pcs)</option>
            </select>
          </div>

          {/* Secondary Metric Overlay (Line) */}
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
              Overlay Line Metric:
            </label>
            <select
              className="select-input"
              value={overlayMetric}
              onChange={(e) => setOverlayMetric(e.target.value)}
              style={{ width: "100%", height: "36px" }}
            >
              <option value="none">None (Single Metric)</option>
              <option value="turnoverRatioCOGS">Turnover Ratio (COGS)</option>
              <option value="revenue">Sales Revenue (₹)</option>
              <option value="inventoryValueCost">Inventory Value (Cost ₹)</option>
              <option value="unitsSold">Units Sold (pcs)</option>
            </select>
          </div>

          {/* Performance Tier Filter */}
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
              Turnover Velocity Tier:
            </label>
            <select
              className="select-input"
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value)}
              style={{ width: "100%", height: "36px" }}
            >
              <option value="ALL">All Performance Tiers</option>
              <option value="HIGH">High Turnover (&ge; 0.25x)</option>
              <option value="MODERATE">Moderate Turnover (0.10x - 0.25x)</option>
              <option value="LOW">Low Turnover (&lt; 0.10x)</option>
            </select>
          </div>

          {/* City Location Filter */}
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
              City Location:
            </label>
            <select
              className="select-input"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              style={{ width: "100%", height: "36px" }}
            >
              <option value="ALL">All Cities</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Field */}
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
              Sort Outlets By:
            </label>
            <select
              className="select-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: "100%", height: "36px" }}
            >
              <option value="turnoverRatioCOGS">Turnover Ratio (COGS)</option>
              <option value="revenue">Sales Revenue (₹)</option>
              <option value="cogs">COGS (₹)</option>
              <option value="inventoryValueCost">Inventory Value (Cost ₹)</option>
              <option value="unitsSold">Units Sold (pcs)</option>
              <option value="name">Outlet Name</option>
            </select>
          </div>

          {/* Sort Direction Toggle */}
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
              Sort Order:
            </label>
            <button
              className="btn btn-secondary"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              style={{ width: "100%", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              <ArrowUpDown size={15} />
              <span>{sortOrder === "desc" ? "Highest First (Desc)" : "Lowest First (Asc)"}</span>
            </button>
          </div>
        </div>

        {/* RECHARTS COMPOSED CHART */}
        <div style={{ width: "100%", height: 350 }}>
          {processedOutlets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              No outlets match the selected filter criteria.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedOutlets} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3b52" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />

                {/* Left Y Axis for Primary Metric */}
                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (metricConfigs[selectedMetric]?.isCurrency) {
                      return `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;
                    }
                    return `${v}${metricConfigs[selectedMetric]?.unit || ""}`;
                  }}
                />

                {/* Right Y Axis if Overlay Metric selected */}
                {overlayMetric !== "none" && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#ec4899"
                    tickLine={false}
                    tickFormatter={(v) => {
                      if (metricConfigs[overlayMetric]?.isCurrency) {
                        return `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;
                      }
                      return `${v}${metricConfigs[overlayMetric]?.unit || ""}`;
                    }}
                  />
                )}

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#2e3b52",
                    borderRadius: "10px",
                    color: "white",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                  formatter={(value, name) => {
                    const metricKey = name === "Primary Metric" ? selectedMetric : overlayMetric;
                    return [formatMetricVal(value, metricKey), metricConfigs[metricKey]?.label || name];
                  }}
                  labelFormatter={(name, payload) => {
                    if (payload && payload.length > 0) {
                      const item = payload[0].payload;
                      return `${item.fullName || name} (${item.city})`;
                    }
                    return name;
                  }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: "10px" }}
                  formatter={(value) => {
                    if (value === "Primary Metric") return metricConfigs[selectedMetric]?.label;
                    if (value === "Overlay Line") return metricConfigs[overlayMetric]?.label;
                    return value;
                  }}
                />

                {/* Bar for Primary Metric */}
                <Bar
                  yAxisId="left"
                  name="Primary Metric"
                  dataKey={selectedMetric}
                  radius={[6, 6, 0, 0]}
                  fill={metricConfigs[selectedMetric]?.color || "#3b82f6"}
                >
                  {processedOutlets.map((entry, index) => {
                    // Color bar by turnover tier if primary metric is turnover
                    let cellColor = metricConfigs[selectedMetric]?.color || "#3b82f6";
                    if (selectedMetric === "turnoverRatioCOGS" || selectedMetric === "turnoverRatioSales") {
                      if (entry.turnoverRatioCOGS >= 0.25) cellColor = "#10b981"; // High Green
                      else if (entry.turnoverRatioCOGS >= 0.10) cellColor = "#f59e0b"; // Moderate Amber
                      else cellColor = "#ef4444"; // Low Red
                    }
                    return <Cell key={`cell-${index}`} fill={cellColor} />;
                  })}
                </Bar>

                {/* Line overlay for Secondary Metric */}
                {overlayMetric !== "none" && (
                  <Line
                    yAxisId="right"
                    name="Overlay Line"
                    type="monotone"
                    dataKey={overlayMetric}
                    stroke={metricConfigs[overlayMetric]?.color || "#ec4899"}
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#ec4899" }}
                    activeDot={{ r: 8 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* OUTLET DETAILED PERFORMANCE DATA TABLE */}
        <div style={{ marginTop: "2rem" }}>
          <h4 style={{ color: "white", fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Branch Outlet Financial & Inventory Turnover Audit Table
          </h4>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Branch Outlet</th>
                  <th>Location</th>
                  <th>Total Sales Revenue</th>
                  <th>COGS</th>
                  <th>Inventory Value (Cost)</th>
                  <th>Turnover Ratio (COGS)</th>
                  <th>Turnover Tier</th>
                </tr>
              </thead>
              <tbody>
                {processedOutlets.map((out) => {
                  let tierLabel = "Low Velocity";
                  let tierBg = "rgba(239, 68, 68, 0.2)";
                  let tierColor = "#fca5a5";

                  if (out.turnoverRatioCOGS >= 0.25) {
                    tierLabel = "High Velocity";
                    tierBg = "rgba(16, 185, 129, 0.2)";
                    tierColor = "#34d399";
                  } else if (out.turnoverRatioCOGS >= 0.10) {
                    tierLabel = "Moderate Velocity";
                    tierBg = "rgba(245, 158, 11, 0.2)";
                    tierColor = "#fcd34d";
                  }

                  return (
                    <tr key={out.id}>
                      <td style={{ fontWeight: 700, color: "white" }}>
                        {out.fullName || out.name} ({out.code})
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {out.locality}, {out.city}
                      </td>
                      <td style={{ color: "#818cf8", fontWeight: 700 }}>
                        ₹{out.revenue.toLocaleString("en-IN")}
                      </td>
                      <td style={{ color: "#f59e0b", fontWeight: 600 }}>
                        ₹{out.cogs.toLocaleString("en-IN")}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        ₹{out.inventoryValueCost.toLocaleString("en-IN")}
                      </td>
                      <td style={{ fontWeight: 800, fontSize: "1rem", color: "white" }}>
                        {out.turnoverRatioCOGS}x
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: tierBg,
                            color: tierColor,
                          }}
                        >
                          {tierLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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

        {/* Top Products Table */}
        <div className="chart-card col-12">
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
