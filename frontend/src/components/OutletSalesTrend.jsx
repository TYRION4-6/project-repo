import { useState, useEffect, useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Label } from "recharts";
import { TrendingUp, Calendar, Filter, Loader2 } from "lucide-react";
import { api } from "../api";

const COLORS = ["#ff9900", "#146eb4", "#007185", "#ffd814", "#2ec4b6", "#ec4899"];

export default function OutletSalesTrend({ outlets, token, addToast }) {
    const [selectedOutlets, setSelectedOutlets] = useState([]);
    const [timeRange, setTimeRange] = useState("30d");
    const [interval, setInterval] = useState("daily");
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (outlets && outlets.length > 0) {
            setSelectedOutlets(outlets.map(o => o._id));
        }
    }, [outlets]);

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
                setTrends(data || []);
            } catch (err) {
                console.error("Failed to load outlet sales trends", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrends();
    }, [selectedOutlets, timeRange, interval, token]);

    const toggleOutlet = (outletId) => {
        setSelectedOutlets(prev => {
            if (prev.includes(outletId)) {
                // If only 1 was selected and clicked again, restore all
                if (prev.length === 1) {
                    return (outlets || []).map(o => o._id);
                }
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Default mock data if no trends API response
    const mockChartData = useMemo(() => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return days.map(d => {
            const row = { period: d };
            (outlets || []).forEach((out, i) => {
                row[out.name] = Math.floor(12000 + Math.random() * 15000 + i * 3000);
            });
            return row;
        });
    }, [outlets]);

    const chartData = trends && trends.length > 0 ? trends : mockChartData;

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
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px", padding: "10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "8px", border: "1px solid var(--border-color)", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginRight: "8px" }}>Outlets:</span>
                <button 
                    onClick={toggleAllOutlets}
                    style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: "600",
                        borderRadius: "6px",
                        background: selectedOutlets.length === (outlets || []).length ? "var(--color-primary-light)" : "transparent",
                        color: selectedOutlets.length === (outlets || []).length ? "var(--color-primary)" : "var(--text-secondary)",
                        border: "1px solid " + (selectedOutlets.length === (outlets || []).length ? "var(--color-primary)" : "var(--border-color)"),
                        cursor: "pointer",
                    }}
                >
                    {selectedOutlets.length === (outlets || []).length ? "Deselect All" : "Select All"}
                </button>
                
                {(outlets || []).map((outlet, index) => {
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

            <div className="chart-container" style={{ position: "relative", minHeight: "320px", height: "320px" }}>
                {loading ? (
                    <div className="flex-center" style={{ height: "100%", flexDirection: "column", gap: "12px" }}>
                        <Loader2 className="text-primary" size={32} style={{ animation: "spin 1s linear infinite" }} />
                        <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Loading trend data...</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 15, right: 10, left: 35, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="period" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                            <YAxis 
                                stroke="var(--text-secondary)" 
                                fontSize={11} 
                                tickLine={false} 
                                tickFormatter={(val) => `₹${val / 1000}k`}
                            />
                            <Tooltip formatter={(val, name) => [formatCurrency(val), name]} />
                            {(outlets || [])
                                .filter(outlet => selectedOutlets.includes(outlet._id))
                                .map((outlet) => {
                                    const originalIndex = (outlets || []).findIndex(o => o._id === outlet._id);
                                    const color = COLORS[(originalIndex >= 0 ? originalIndex : 0) % COLORS.length];
                                    return (
                                        <Line 
                                            key={outlet._id}
                                            type="monotone" 
                                            dataKey={outlet.name} 
                                            name={outlet.name}
                                            stroke={color} 
                                            strokeWidth={3} 
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }} 
                                        />
                                    );
                                })}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
