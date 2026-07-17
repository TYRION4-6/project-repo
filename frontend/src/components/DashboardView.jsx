import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { DollarSign, ShoppingBag, MapPin, AlertTriangle, TrendingUp } from "lucide-react";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6"];

export default function DashboardView({ analytics, products, setActiveTab }) {
    const {
        totalRevenue = 0,
        totalSalesCount = 0,
        lowStockCount = 0,
        activeOutletsCount = 0,
        salesByDate = [],
        salesByOutlet = [],
        salesByCategory = []
    } = analytics;

    // Filter products that are low in stock
    const lowStockItems = products.filter(
        p => p.stockLevel <= (p.lowStockAlertThreshold !== undefined ? p.lowStockAlertThreshold : 10)
    ).slice(0, 5); // display only top 5 recent low stock items

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div>
            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card" id="stat-revenue">
                    <div className="stat-icon success">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Revenue</span>
                        <span className="stat-value">{formatCurrency(totalRevenue)}</span>
                    </div>
                </div>

                <div className="stat-card" id="stat-sales">
                    <div className="stat-icon info">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Transactions</span>
                        <span className="stat-value">{totalSalesCount}</span>
                    </div>
                </div>

                <div className="stat-card" id="stat-outlets">
                    <div className="stat-icon primary">
                        <MapPin size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Active Outlets</span>
                        <span className="stat-value">{activeOutletsCount}</span>
                    </div>
                </div>

                <div 
                    className="stat-card" 
                    id="stat-low-stock" 
                    style={{ cursor: lowStockCount > 0 ? "pointer" : "default" }}
                    onClick={() => lowStockCount > 0 && setActiveTab("inventory")}
                >
                    <div className={`stat-icon ${lowStockCount > 0 ? "danger" : "success"}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Low Stock Alerts</span>
                        <span className="stat-value" style={{ color: lowStockCount > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                            {lowStockCount}
                        </span>
                    </div>
                </div>
            </div>

            {activeOutletsCount === 0 ? (
                <div className="card-panel empty-state">
                    <MapPin className="empty-state-icon" size={60} />
                    <h2>Setup Your Business Outlets</h2>
                    <p style={{ marginTop: "10px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                        It looks like you haven't added any branch outlets yet. Add your first outlet branch to start managing inventory and sales performance.
                    </p>
                    <button 
                        id="empty-add-outlet-btn"
                        className="btn btn-primary"
                        onClick={() => setActiveTab("outlets")}
                    >
                        Go to Outlets
                    </button>
                </div>
            ) : (
                <>
                    {/* Charts Grid */}
                    <div className="analytics-grid">
                        {/* Sales Trend Line Chart */}
                        <div className="chart-card" id="chart-sales-trend">
                            <div className="chart-header">
                                <h3 className="chart-title">Revenue Trend (Last 30 Days)</h3>
                                <TrendingUp size={20} style={{ color: "var(--color-primary)" }} />
                            </div>
                            <div className="chart-container">
                                {salesByDate.length === 0 ? (
                                    <div className="flex-center" style={{ height: "100%", color: "var(--text-secondary)" }}>
                                        No transaction data available yet. Add sales in the POS tab to view the trend.
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={salesByDate} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                                            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                                            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px" }}
                                                labelStyle={{ color: "white", fontWeight: "bold" }}
                                            />
                                            <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Category Sales Pie Chart */}
                        <div className="chart-card" id="chart-category-dist">
                            <div className="chart-header">
                                <h3 className="chart-title">Sales by Category</h3>
                            </div>
                            <div className="chart-container">
                                {salesByCategory.length === 0 ? (
                                    <div className="flex-center" style={{ height: "100%", color: "var(--text-secondary)" }}>
                                        No category data available.
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={salesByCategory}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="revenue"
                                                nameKey="category"
                                            >
                                                {salesByCategory.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px" }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="analytics-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        {/* Outlet Performance Bar Chart */}
                        <div className="chart-card" id="chart-outlet-perf">
                            <div className="chart-header">
                                <h3 className="chart-title">Revenue by Outlet</h3>
                            </div>
                            <div className="chart-container">
                                {salesByOutlet.length === 0 ? (
                                    <div className="flex-center" style={{ height: "100%", color: "var(--text-secondary)" }}>
                                        No sales logged across outlets yet.
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salesByOutlet}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                                            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                                            <Tooltip 
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px" }}
                                            />
                                            <Bar dataKey="revenue" name="Revenue (₹)" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Recent Low Stock Alerts Table */}
                        <div className="chart-card" id="low-stock-panel">
                            <div className="chart-header">
                                <h3 className="chart-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <AlertTriangle size={18} className="text-warning" />
                                    Critical Low Stock Items
                                </h3>
                                {lowStockCount > 5 && (
                                    <button 
                                        className="btn btn-secondary" 
                                        style={{ padding: "6px 12px", fontSize: "12px" }}
                                        onClick={() => setActiveTab("inventory")}
                                    >
                                        View All
                                    </button>
                                )}
                            </div>
                            
                            {lowStockItems.length === 0 ? (
                                <div className="flex-center" style={{ height: "230px", flexDirection: "column", color: "var(--text-secondary)" }}>
                                    <span style={{ fontSize: "28px", marginBottom: "8px" }}>🎉</span>
                                    <span>All stock levels are optimal!</span>
                                </div>
                            ) : (
                                <div className="table-wrapper" style={{ border: "none" }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Branch</th>
                                                <th>Stock</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lowStockItems.map((item) => (
                                                <tr key={item._id}>
                                                    <td style={{ fontWeight: "500", color: "white" }}>
                                                        {item.name}
                                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                            SKU: {item.sku}
                                                        </div>
                                                    </td>
                                                    <td>{item.outlet?.name || "N/A"}</td>
                                                    <td style={{ fontWeight: "600" }}>{item.stockLevel} units</td>
                                                    <td>
                                                        <span className={`badge ${item.stockLevel === 0 ? "badge-danger" : "badge-warning"}`}>
                                                            {item.stockLevel === 0 ? "Out of Stock" : "Low Stock"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
