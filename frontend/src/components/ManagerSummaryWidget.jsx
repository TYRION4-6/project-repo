import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { 
    DollarSign, 
    AlertTriangle, 
    Wifi, 
    WifiOff, 
    Activity, 
    ShoppingBag, 
    TrendingUp 
} from "lucide-react";

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
};

export default function ManagerSummaryWidget({ token, setActiveTab, refreshDashboard }) {
    const [salesTotal, setSalesTotal] = useState(0);
    const [alertCount, setAlertCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [recentEvents, setRecentEvents] = useState([]);
    
    // Animation triggers
    const [salesPulse, setSalesPulse] = useState(false);
    const [alertPulse, setAlertPulse] = useState(false);

    // Load initial data
    const fetchInitialData = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const [salesData, alertData] = await Promise.all([
                api.getTodaySalesTotal(token),
                api.getAlertCount(token)
            ]);
            setSalesTotal(salesData.todayTotal || 0);
            setAlertCount(alertData.alertCount || 0);
        } catch (err) {
            console.error("Failed to fetch initial widget data", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchInitialData();
    }, [token, fetchInitialData]);

    // Setup real-time listeners
    useEffect(() => {
        if (!token) return;

        const baseUrl = "http://localhost:3000/api";
        const salesSource = new EventSource(`${baseUrl}/sales/feed?token=${token}`);
        const alertsSource = new EventSource(`${baseUrl}/products/alerts/feed?token=${token}`);

        salesSource.onopen = () => {
            setIsConnected(true);
        };

        salesSource.onmessage = async (event) => {
            try {
                const sale = JSON.parse(event.data);
                // Trigger animation
                setSalesPulse(true);
                setTimeout(() => setSalesPulse(false), 1000);

                // Update total locally first
                setSalesTotal(prev => prev + sale.totalAmount);

                // Update other dashboard components
                if (refreshDashboard) {
                    refreshDashboard();
                }

                // Sync exact total from DB
                try {
                    const salesData = await api.getTodaySalesTotal(token);
                    if (salesData && typeof salesData.todayTotal === "number") {
                        setSalesTotal(salesData.todayTotal);
                    }
                } catch (e) {
                    console.error("Failed to sync today sales total", e);
                }

                // Add to recent events
                const eventMsg = {
                    id: Date.now() + Math.random().toString(36).substr(2, 5),
                    type: "sale",
                    message: `Sale at ${sale.outlet?.name || 'Branch'}: +${formatCurrency(sale.totalAmount)}`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                };
                setRecentEvents(prev => [eventMsg, ...prev].slice(0, 4));
            } catch (err) {
                console.error("Error parsing sales feed event", err);
            }
        };

        alertsSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && typeof data.alertCount === "number") {
                    setAlertPulse(true);
                    setTimeout(() => setAlertPulse(false), 1000);
                    
                    setAlertCount(data.alertCount);

                    // Update other dashboard components
                    if (refreshDashboard) {
                        refreshDashboard();
                    }

                    // Add alert notification to local feed
                    const eventMsg = {
                        id: Date.now() + Math.random().toString(36).substr(2, 5),
                        type: "alert",
                        message: `Alert Update: ${data.alertCount} critical item(s) low in stock`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    };
                    setRecentEvents(prev => [eventMsg, ...prev].slice(0, 4));
                }
            } catch (err) {
                console.error("Error parsing alerts feed event", err);
            }
        };

        salesSource.onerror = () => {
            setIsConnected(false);
        };

        alertsSource.onerror = () => {
            setIsConnected(false);
        };

        return () => {
            salesSource.close();
            alertsSource.close();
        };
    }, [token, refreshDashboard]);

    return (
        <div className="summary-widget-container" id="realtime-manager-summary">
            <div className="summary-widget-header">
                <div className="summary-widget-title">
                    <Activity size={18} className="text-primary" />
                    <span>Real-time Operations Summary</span>
                </div>
                <div className={`live-status ${isConnected ? "connected" : "disconnected"}`}>
                    <div className={`live-dot ${isConnected ? "pulse" : ""}`} />
                    <span>{isConnected ? "Live Feed Sync" : "Connecting..."}</span>
                    {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                </div>
            </div>

            <div className="summary-widget-metrics">
                {/* Metric 1: Today's Sales */}
                <div 
                    className={`metric-subcard sales-card ${salesPulse ? "animate-flash-sales" : ""}`}
                    onClick={() => setActiveTab("transactions")}
                    style={{ cursor: "pointer" }}
                    title="Click to view transactions"
                >
                    <div className="metric-icon-wrap sales">
                        <DollarSign size={20} />
                    </div>
                    <div className="metric-details">
                        <div className="metric-title">Today's Sales Total</div>
                        <div className="metric-val">
                            {loading ? "..." : formatCurrency(salesTotal)}
                        </div>
                    </div>
                    <TrendingUp size={16} style={{ position: "absolute", top: "12px", right: "12px", opacity: 0.3 }} />
                </div>

                {/* Metric 2: Alert Count */}
                <div 
                    className={`metric-subcard alerts-card ${alertCount > 0 ? "danger-alert" : ""} ${alertPulse ? "animate-flash-alerts" : ""}`}
                    onClick={() => setActiveTab("inventory")}
                    style={{ cursor: "pointer" }}
                    title="Click to view inventory catalog"
                >
                    <div className={`metric-icon-wrap alerts ${alertCount > 0 ? "critical" : ""}`}>
                        <AlertTriangle size={20} />
                    </div>
                    <div className="metric-details">
                        <div className="metric-title">Active Stock Alerts</div>
                        <div className="metric-val" style={{ color: alertCount > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                            {loading ? "..." : alertCount}
                        </div>
                    </div>
                    <ShoppingBag size={16} style={{ position: "absolute", top: "12px", right: "12px", opacity: 0.3 }} />
                </div>
            </div>

            {/* Live Feed Event Log */}
            <div className="event-feed-container">
                <div className="event-feed-header">
                    <span>Live Event Log</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span className="live-dot" style={{ width: "6px", height: "6px" }} />
                        Real-time feed
                    </span>
                </div>
                <div className="event-feed-list">
                    {recentEvents.length === 0 ? (
                        <div style={{ padding: "8px", fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
                            Waiting for sales transactions or alert feeds...
                        </div>
                    ) : (
                        recentEvents.map((evt) => (
                            <div key={evt.id} className={`event-feed-item ${evt.type === 'alert' ? 'alert' : 'sale'}`}>
                                <div className="event-msg">
                                    {evt.type === 'alert' ? (
                                        <AlertTriangle size={14} style={{ color: "var(--color-warning)" }} />
                                    ) : (
                                        <DollarSign size={14} style={{ color: "var(--color-success)" }} />
                                    )}
                                    <span>{evt.message}</span>
                                </div>
                                <span className="event-time">{evt.time}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
