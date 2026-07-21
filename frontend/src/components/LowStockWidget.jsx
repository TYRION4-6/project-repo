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
          
          // Whenever a new sale is made or inventory is manually updated/deleted/created,
          // trigger a silent refresh of the low stock list.
          if (message.type === "NEW_SALE" || message.type === "INVENTORY_CHANGE") {
            console.log(`Inventory change event (${message.type}) received. Updating low stock list...`);
            fetchLowStock(true);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      socket.onclose = () => {
        if (!isMountedRef.current) return;
        setWsStatus("disconnected");
        console.log("WebSocket closed in LowStockWidget. Reconnecting in 5s...");
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
          badgeColor: "var(--accent)",
          badgeBg: "rgba(244, 63, 94, 0.15)",
          textGlow: "0 0 8px var(--accent-glow)",
          className: "severity-out-of-stock"
        };
      case "critical":
        return {
          borderLeft: "4px solid #F97316",
          badgeColor: "#FB923C",
          badgeBg: "rgba(249, 115, 22, 0.15)",
          textGlow: "none",
          className: "severity-critical"
        };
      case "warning":
        return {
          borderLeft: "4px solid var(--warning)",
          badgeColor: "#FBBF24",
          badgeBg: "rgba(245, 158, 11, 0.12)",
          textGlow: "none",
          className: "severity-warning"
        };
      default:
        return {
          borderLeft: "4px solid var(--primary)",
          badgeColor: "#818CF8",
          badgeBg: "rgba(79, 70, 229, 0.12)",
          textGlow: "none",
          className: "severity-attention"
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
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>Low Stock Radar</h3>
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
              title={`WebSocket status: ${wsStatus}`}
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
            <div className="empty-stock-state">
              <div className="empty-stock-icon-wrapper">
                <ShieldCheck size={28} />
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
                  className={`low-stock-item ${styles.className}`}
                  style={{
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
                              fontSize: "9px", 
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
                        {severity === "critical" && (
                          <span 
                            style={{ 
                              fontSize: "9px", 
                              color: "#F97316", 
                              backgroundColor: "rgba(249, 115, 22, 0.15)", 
                              padding: "1px 6px", 
                              borderRadius: "4px", 
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px"
                            }}
                          >
                            CRITICAL
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
                    <div style={{ width: "100%", height: "5px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div 
                        style={{ 
                          width: `${stockPercentage}%`, 
                          height: "100%", 
                          backgroundColor: styles.badgeColor,
                          borderRadius: "3px",
                          transition: "width 0.4s ease-out" 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Row 3: Location / Outlet & action indicator */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Store size={12} style={{ color: "var(--secondary)" }} />
                      <span style={{ fontWeight: "500" }}>
                        {product.outlet ? `${product.outlet.name} (${product.outlet.city})` : "Unknown Branch"}
                      </span>
                    </div>
                    
                    <span 
                      style={{ 
                        fontSize: "11px", 
                        color: severity === "out-of-stock" ? "var(--accent)" : severity === "critical" ? "#F97316" : "var(--primary)",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px"
                      }}
                    >
                      {severity === "out-of-stock" 
                        ? "⚠️ Urgent Restock" 
                        : severity === "critical" 
                        ? "⚠️ Critical Action Required"
                        : `Needs ${threshold - product.stock} units`}
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
          transform: translateX(3px) !important;
          background-color: rgba(255, 255, 255, 0.03) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        
        .severity-out-of-stock {
          border-left: 4px solid var(--accent) !important;
          background: linear-gradient(90deg, rgba(244, 63, 94, 0.07) 0%, rgba(17, 24, 39, 0.2) 100%) !important;
          box-shadow: 0 0 12px rgba(244, 63, 94, 0.04);
          animation: pulseOutOfStock 2.5s infinite alternate ease-in-out, slideInLowStock 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .severity-critical {
          border-left: 4px solid #F97316 !important;
          background: linear-gradient(90deg, rgba(249, 115, 22, 0.05) 0%, rgba(17, 24, 39, 0.2) 100%) !important;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.03);
          animation: slideInLowStock 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .severity-warning {
          border-left: 4px solid var(--warning) !important;
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.03) 0%, rgba(17, 24, 39, 0.1) 100%) !important;
        }
        .severity-attention {
          border-left: 4px solid var(--primary) !important;
          background: linear-gradient(90deg, rgba(79, 70, 229, 0.02) 0%, rgba(17, 24, 39, 0.1) 100%) !important;
        }
        
        @keyframes pulseOutOfStock {
          0% { box-shadow: inset 0 0 4px rgba(244, 63, 94, 0.05), 0 0 8px rgba(244, 63, 94, 0.02); border-color: rgba(244, 63, 94, 0.7); }
          100% { box-shadow: inset 0 0 10px rgba(244, 63, 94, 0.15), 0 0 14px rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 1); }
        }

        @keyframes pulse {
          0% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.4; transform: scale(1); }
        }
        
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .empty-stock-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-grow: 1;
          padding: 40px 20px;
          text-align: center;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
          border-radius: 16px;
          border: 1px dashed rgba(16, 185, 129, 0.2);
          animation: slideInLowStock 0.4s ease-out;
        }
        
        .empty-stock-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: rgba(16, 185, 129, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--success);
          margin-bottom: 16px;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
          animation: floatAnimation 3s ease-in-out infinite;
        }
        
        @keyframes floatAnimation {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};

export default LowStockWidget;
