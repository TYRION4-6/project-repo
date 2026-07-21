import React, { useState, useEffect, useRef, useCallback } from "react";
import { productsAPI } from "../api";
import { AlertTriangle, Plus, Minus, RefreshCw, ShieldCheck, Store, Radio } from "lucide-react";

const LowStockWidget = () => {
  const [threshold, setThreshold] = useState(() => {
    const saved = localStorage.getItem("lowStockThreshold");
    return saved ? parseInt(saved) : 10;
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wsStatus, setWsStatus] = useState("disconnected");
  
  const isMountedRef = useRef(true);

  // Fetch low stock products
  const fetchLowStock = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError("");
    try {
      const data = await productsAPI.getLowStock(threshold);
      if (isMountedRef.current) {
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching low stock products:", err);
      if (isMountedRef.current) {
        setError("Failed to fetch low-stock products");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [threshold]);

  // Keep localStorage updated when threshold changes
  useEffect(() => {
    localStorage.setItem("lowStockThreshold", threshold.toString());
    fetchLowStock();
  }, [threshold, fetchLowStock]);

  // Set up WebSocket listener for instant inventory updates
  useEffect(() => {
    isMountedRef.current = true;

    let socket;
    let reconnectTimeout;
    const token = localStorage.getItem("token");
    const wsUrl = `ws://localhost:5000${token ? `?token=${token}` : ""}`;

    const connectWebSocket = () => {
      if (!isMountedRef.current) return;
      setWsStatus("connecting");
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (!isMountedRef.current) return;
        console.log("WebSocket connected (LowStockWidget)");
        setWsStatus("connected");
      };

      socket.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const message = JSON.parse(event.data);
          
          // Whenever a new sale is made, it reduces product stock.
          // Trigger a silent refresh of the low stock list.
          if (message.type === "NEW_SALE") {
            console.log("Inventory changed due to sale. Updating low stock list...");
            fetchLowStock(true);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      socket.onclose = () => {
        if (!isMountedRef.current) return;
        setWsStatus("disconnected");
        console.log("WebSocket closed in LowStockWidget. Reconnecting...");
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error in LowStockWidget:", err);
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
      isMountedRef.current = false;
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [fetchLowStock]);

  const handleAdjustThreshold = (amount) => {
    setThreshold((prev) => Math.max(1, Math.min(100, prev + amount)));
  };

  const getSeverity = (stock) => {
    if (stock === 0) return "out-of-stock";
    if (stock <= 3) return "critical";
    if (stock <= 8) return "warning";
    return "attention";
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "out-of-stock":
        return {
          borderLeft: "4px solid var(--accent)",
          background: "linear-gradient(90deg, rgba(244, 63, 94, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%)",
          badgeColor: "var(--accent)",
          badgeBg: "rgba(244, 63, 94, 0.15)",
          textGlow: "0 0 8px var(--accent-glow)",
        };
      case "critical":
        return {
          borderLeft: "4px solid #EF4444",
          background: "linear-gradient(90deg, rgba(239, 68, 68, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%)",
          badgeColor: "#F87171",
          badgeBg: "rgba(239, 68, 68, 0.12)",
          textGlow: "none",
        };
      case "warning":
        return {
          borderLeft: "4px solid var(--warning)",
          background: "linear-gradient(90deg, rgba(245, 158, 11, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)",
          badgeColor: "#FBBF24",
          badgeBg: "rgba(245, 158, 11, 0.12)",
          textGlow: "none",
        };
      default:
        return {
          borderLeft: "4px solid var(--primary)",
          background: "rgba(255, 255, 255, 0.01)",
          badgeColor: "#818CF8",
          badgeBg: "rgba(79, 70, 229, 0.12)",
          textGlow: "none",
        };
    }
  };

  const getStatusBadgeColor = () => {
    if (wsStatus === "connected") return "var(--success)";
    if (wsStatus === "connecting") return "var(--warning)";
    return "var(--accent)";
  };

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "480px" }}>
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>Low Inventory Radar</h3>
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "5px", 
                fontSize: "11px", 
                padding: "2px 8px", 
                borderRadius: "12px", 
                backgroundColor: "rgba(255, 255, 255, 0.03)", 
                border: "1px solid rgba(255, 255, 255, 0.05)",
                color: "var(--text-secondary)"
              }}
              title={`Websocket connection for inventory: ${wsStatus}`}
            >
              <Radio 
                size={11} 
                style={{ 
                  color: getStatusBadgeColor(), 
                  animation: wsStatus === "connected" ? "pulse 2s infinite" : "none" 
                }} 
              />
              <span style={{ textTransform: "capitalize" }}>Live</span>
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Monitoring items with stock levels below standard thresholds
          </p>
        </div>

        {/* Adjusting Threshold and Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              backgroundColor: "rgba(255, 255, 255, 0.03)", 
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px", 
              padding: "4px" 
            }}
          >
            <button 
              className="btn btn-secondary" 
              style={{ padding: "6px 8px", minWidth: "28px", borderRadius: "6px" }}
              onClick={() => handleAdjustThreshold(-1)}
              title="Decrease Alert Threshold"
            >
              <Minus size={12} />
            </button>
            
            <div style={{ padding: "0 10px", textAlign: "center", minWidth: "100px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Alert Threshold</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>{threshold} units</span>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ padding: "6px 8px", minWidth: "28px", borderRadius: "6px" }}
              onClick={() => handleAdjustThreshold(1)}
              title="Increase Alert Threshold"
            >
              <Plus size={12} />
            </button>
          </div>

          <button
            className={`btn btn-secondary ${isRefreshing ? "spinning" : ""}`}
            style={{ padding: "10px", display: "flex", alignItems: "center", height: "42px" }}
            onClick={() => fetchLowStock(true)}
            disabled={loading || isRefreshing}
            title="Force Scan Inventory"
          >
            <RefreshCw size={14} className={isRefreshing ? "spin-animation" : ""} />
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Presets:</span>
        {[5, 10, 15, 25, 50].map((presetVal) => (
          <button
            key={presetVal}
            onClick={() => setThreshold(presetVal)}
            style={{
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "var(--transition-smooth)",
              backgroundColor: threshold === presetVal ? "var(--primary)" : "rgba(255, 255, 255, 0.03)",
              border: threshold === presetVal ? "1px solid var(--primary)" : "1px solid rgba(255, 255, 255, 0.05)",
              color: threshold === presetVal ? "white" : "var(--text-secondary)",
            }}
          >
            {presetVal}
          </button>
        ))}
      </div>

      {/* Widget Body */}
      {error && (
        <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 16px" }}>
          <AlertTriangle size={16} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: "13px", color: "var(--accent)" }}>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexGrow: 1, flexDirection: "column", gap: "12px" }}>
          <div className="dot" style={{ width: "24px", height: "24px" }}></div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Scanning stock levels...</p>
        </div>
      ) : (
        <div 
          style={{ 
            flexGrow: 1, 
            overflowY: "auto", 
            paddingRight: "4px", 
            maxHeight: "360px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          {products.length === 0 ? (
            <div 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                flexGrow: 1, 
                padding: "40px 20px", 
                textAlign: "center",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)",
                borderRadius: "16px",
                border: "1px dashed rgba(16, 185, 129, 0.2)",
              }}
            >
              <div 
                style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "50%", 
                  backgroundColor: "rgba(16, 185, 129, 0.1)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "var(--success)", 
                  marginBottom: "16px",
                  boxShadow: "0 0 15px rgba(16, 185, 129, 0.15)"
                }}
              >
                <ShieldCheck size={26} />
              </div>
              <h4 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                All Outlets Fully Stocked
              </h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "280px" }}>
                No products are currently under the warning threshold of {threshold} units.
              </p>
            </div>
          ) : (
            products.map((product) => {
              const severity = getSeverity(product.stock);
              const styles = getSeverityStyle(severity);
              const stockPercentage = Math.min(100, Math.max(0, (product.stock / threshold) * 100));

              return (
                <div
                  key={product._id}
                  className="low-stock-item"
                  style={{
                    backgroundColor: styles.background,
                    borderLeft: styles.borderLeft,
                    borderTop: "1px solid rgba(255, 255, 255, 0.03)",
                    borderRight: "1px solid rgba(255, 255, 255, 0.03)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  {/* Row 1: Product Info and Stock Badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: "600", fontSize: "14px", color: "var(--text-primary)" }}>
                          {product.name}
                        </span>
                        {severity === "out-of-stock" && (
                          <span 
                            style={{ 
                              fontSize: "10px", 
                              color: "var(--accent)", 
                              backgroundColor: "rgba(244, 63, 94, 0.15)", 
                              padding: "1px 6px", 
                              borderRadius: "4px", 
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px"
                            }}
                          >
                            OUT OF STOCK
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        <span style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>{product.sku}</span>
                        <span>•</span>
                        <span>{product.category}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span 
                        style={{ 
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "700",
                          color: styles.badgeColor,
                          backgroundColor: styles.badgeBg,
                          boxShadow: styles.textGlow,
                        }}
                      >
                        {product.stock} {product.stock === 1 ? "unit" : "units"} left
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Progress bar representation */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "2px", overflow: "hidden" }}>
                      <div 
                        style={{ 
                          width: `${stockPercentage}%`, 
                          height: "100%", 
                          backgroundColor: styles.badgeColor,
                          borderRadius: "2px",
                          transition: "width 0.4s ease-out" 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Row 3: Location / Outlet & action indicator */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Store size={12} style={{ color: "var(--secondary)" }} />
                      <span>{product.outlet ? `${product.outlet.name} (${product.outlet.city})` : "Unknown Branch"}</span>
                    </div>
                    
                    <span 
                      style={{ 
                        fontSize: "11px", 
                        color: severity === "out-of-stock" ? "var(--accent)" : severity === "critical" ? "var(--warning)" : "var(--primary)",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px"
                      }}
                    >
                      {severity === "out-of-stock" ? "⚠️ Urgent Restock" : "Needs Restock"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        .low-stock-item {
          animation: slideInLowStock 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInLowStock {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .low-stock-item:hover {
          transform: translateX(2px);
          background-color: rgba(255, 255, 255, 0.03) !important;
        }
      `}</style>
    </div>
  );
};

export default LowStockWidget;
