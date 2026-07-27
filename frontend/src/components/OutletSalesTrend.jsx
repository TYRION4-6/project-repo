import { useState, useEffect, useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Label } from "recharts";
import { TrendingUp, Calendar, Filter, Loader2 } from "lucide-react";
import { api } from "../api";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6"];

export default function OutletSalesTrend({ outlets, token, addToast }) {
    const [selectedOutlets, setSelectedOutlets] = useState([]);
    const [timeRange, setTimeRange] = useState("30d");
    const [interval, setInterval] = useState("daily");
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initialize all outlets as selected on load
    useEffect(() => {
        if (outlets && outlets.length > 0) {
            setSelectedOutlets(outlets.map(o => o._id));
        }
    }, [outlets]);

    // Fetch trends when selectedOutlets, timeRange, or interval changes
    useEffect(() => {
        const fetchTrends = async () => {
            if (!token || selectedOutlets.length === 0) {
                setTrends([]);
                return;
            }
            setLoading(true);
            try {
                const data = await api.getSalesTrends({
                    outlets: selectedOutlets.join(","),
                    timeRange,
                    interval
                }, token);
                setTrends(data);
            } catch (err) {
                console.error("Failed to load outlet sales trends", err);
                if (addToast) {
                    addToast(err.message || "Failed to load sales trends", "error");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTrends();
    }, [selectedOutlets, timeRange, interval, token, addToast]);

    // Toggle outlet selection
    const toggleOutlet = (outletId) => {
        setSelectedOutlets(prev => {
            if (prev.includes(outletId)) {
                return prev.filter(id => id !== outletId);
            } else {
                return [...prev, outletId];
            }
        });
    };

    const toggleAllOutlets = () => {
        if (selectedOutlets.length === outlets.length) {
            setSelectedOutlets([]);
        } else {
            setSelectedOutlets(outlets.map(o => o._id));
        }
    };

    // Format currency (INR)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Map API data to chart format
    const chartData = useMemo(() => {
        if (!trends || trends.length === 0) return [];

        // 1. Get all unique periods sorted chronologically
        const uniquePeriods = Array.from(new Set(trends.map(t => t.period))).sort();

        // 2. Map periods to objects
        return uniquePeriods.map(period => {
            const dataPoint = { period };
            
            // Initialize all selected outlets to 0 to handle missing dates gracefully
            outlets.forEach(outlet => {
                if (selectedOutlets.includes(outlet._id)) {
                    dataPoint[outlet.name] = 0;
                }
            });

            // Populate actual values
            trends.forEach(item => {
                if (item.period === period && selectedOutlets.includes(item.outletId)) {
                    dataPoint[item.outletName] = item.revenue;
                }
            });

            return dataPoint;
        });
    }, [trends, outlets, selectedOutlets]);

    // Get list of outlet names that are selected
    const activeOutletNames = useMemo(() => {
        return outlets
            .filter(o => selectedOutlets.includes(o._id))
            .map(o => o.name);
    }, [outlets, selectedOutlets]);

    return (
        <div className="chart-card" id="chart-outlet-sales-trend" style={{ width: "100%", gridColumn: "1 / -1" }}>
            <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TrendingUp size={20} style={{ color: "var(--color-primary)" }} />
                    <div>
                        <h3 className="chart-title" style={{ margin: 0 }}>Outlet Performance Comparison</h3>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>Compare sales revenue across different branches over time</p>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {/* Time Range Selector */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar size={14} style={{ color: "var(--text-secondary)" }} />
                        <select 
                            className="form-select" 
                            style={{ padding: "8px 32px 8px 12px", fontSize: "13px", width: "auto" }}
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            aria-label="Select Time Range"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>

                    {/* Interval Selector */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Filter size={14} style={{ color: "var(--text-secondary)" }} />
                        <select 
                            className="form-select" 
                            style={{ padding: "8px 32px 8px 12px", fontSize: "13px", width: "auto" }}
                            value={interval}
                            onChange={(e) => setInterval(e.target.value)}
                            aria-label="Select Interval"
                        >
                            <option value="daily">Daily View</option>
                            <option value="weekly">Weekly View</option>
                            <option value="monthly">Monthly View</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Outlets Selection Pills / Legend */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px", padding: "10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "8px", border: "1px solid var(--border-color)", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginRight: "8px" }}>Outlets:</span>
                <button 
                    onClick={toggleAllOutlets}
                    style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: "600",
                        borderRadius: "6px",
                        background: selectedOutlets.length === outlets.length ? "rgba(99, 102, 241, 0.1)" : "transparent",
                        color: selectedOutlets.length === outlets.length ? "var(--color-primary)" : "var(--text-secondary)",
                        border: "1px solid " + (selectedOutlets.length === outlets.length ? "var(--color-primary)" : "var(--border-color)"),
                        cursor: "pointer",
                        transition: "var(--transition-smooth)"
                    }}
                >
                    {selectedOutlets.length === outlets.length ? "Deselect All" : "Select All"}
                </button>
                
                {outlets.map((outlet, index) => {
                    const isSelected = selectedOutlets.includes(outlet._id);
                    const color = COLORS[index % COLORS.length];
                    return (
                        <button
                            key={outlet._id}
                            onClick={() => toggleOutlet(outlet._id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 10px",
                                fontSize: "12px",
                                borderRadius: "20px",
                                background: isSelected ? `${color}15` : "transparent",
                                color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                                border: `1px solid ${isSelected ? color : "var(--border-color)"}`,
                                cursor: "pointer",
                                transition: "var(--transition-smooth)"
                            }}
                        >
                            <span style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: color,
                                display: "inline-block",
                                opacity: isSelected ? 1 : 0.4
                            }} />
                            {outlet.name}
                        </button>
                    );
                })}
            </div>

            {/* Chart Rendering Area */}
            <div className="chart-container" style={{ position: "relative", minHeight: "350px", height: "350px" }}>
                {loading ? (
                    <div className="flex-center" style={{ height: "100%", flexDirection: "column", gap: "12px" }}>
                        <Loader2 className="text-primary" size={32} style={{ animation: "spin 1s linear infinite" }} />
                        <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Loading trend data...</span>
                    </div>
                ) : selectedOutlets.length === 0 ? (
                    <div className="flex-center" style={{ height: "100%", color: "var(--text-secondary)", fontSize: "14px" }}>
                        Please select at least one outlet to compare sales.
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex-center" style={{ height: "100%", color: "var(--text-secondary)", fontSize: "14px" }}>
                        No sales data found for the selected outlets and time range.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 15, right: 10, left: 35, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                            <XAxis 
                                dataKey="period" 
                                stroke="var(--text-secondary)" 
                                fontSize={11} 
                                tickLine={false} 
                                tickFormatter={(val) => {
                                    if (!val) return "";
                                    if (interval === "monthly") {
                                        const parts = val.split("-");
                                        if (parts.length < 2) return val;
                                        const [year, month] = parts;
                                        const date = new Date(year, parseInt(month) - 1);
                                        return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
                                    } else if (interval === "weekly") {
                                        const parts = val.split("-");
                                        if (parts.length < 2) return val;
                                        const [year, week] = parts;
                                        return `Wk ${week}, ${year.substring(2)}`;
                                    } else {
                                        const date = new Date(val);
                                        if (isNaN(date.getTime())) return val;
                                        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                                    }
                                }}
                            >
                                <Label 
                                    value="Time Period" 
                                    offset={-10} 
                                    position="insideBottom" 
                                    fill="var(--text-secondary)" 
                                    style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }} 
                                />
                            </XAxis>
                            <YAxis 
                                stroke="var(--text-secondary)" 
                                fontSize={11} 
                                tickLine={false} 
                                tickFormatter={(val) => {
                                    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                                    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                                    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                                    return `₹${val}`;
                                }}
                            >
                                <Label 
                                    value="Revenue (INR)" 
                                    angle={-90} 
                                    position="insideLeft" 
                                    offset={-20}
                                    fill="var(--text-secondary)" 
                                    style={{ textAnchor: "middle", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }} 
                                />
                            </YAxis>
                            <Tooltip 
                                formatter={(value, name) => [formatCurrency(value), name]}
                                contentStyle={{ 
                                    backgroundColor: "var(--bg-secondary)", 
                                    border: "1px solid var(--border-color)", 
                                    borderRadius: "8px",
                                    boxShadow: "var(--shadow-lg)"
                                }}
                                labelStyle={{ color: "white", fontWeight: "bold", marginBottom: "6px" }}
                                labelFormatter={(label) => {
                                    if (!label) return "";
                                    if (interval === "monthly") {
                                        const parts = label.split("-");
                                        if (parts.length < 2) return label;
                                        const [year, month] = parts;
                                        const date = new Date(year, parseInt(month) - 1);
                                        return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
                                    } else if (interval === "weekly") {
                                        const parts = label.split("-");
                                        if (parts.length < 2) return label;
                                        const [year, week] = parts;
                                        return `Week ${week} of Year ${year}`;
                                    } else {
                                        const date = new Date(label);
                                        if (isNaN(date.getTime())) return label;
                                        return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                                    }
                                }}
                            />
                            {activeOutletNames.map((name, index) => (
                                <Line 
                                    key={name}
                                    type="monotone" 
                                    dataKey={name} 
                                    name={name}
                                    stroke={COLORS[index % COLORS.length]} 
                                    strokeWidth={3} 
                                    dot={{ r: activeOutletNames.length > 3 ? 2 : 4 }} 
                                    activeDot={{ r: 6 }} 
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
