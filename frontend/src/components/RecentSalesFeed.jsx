import React, { useState, useEffect } from "react";
import { salesAPI, outletsAPI } from "../api";
import { Clock, Store, ShoppingBag, Radio, RefreshCw, AlertCircle } from "lucide-react";

const RecentSalesFeed = () => {
  const [salesFeed, setSalesFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [highlightSaleId, setHighlightSaleId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wsStatus, setWsStatus] = useState("disconnected"); // disconnected, connecting, connected

  const loadInitialFeed = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    setError("");
    try {
      // 1. Fetch all outlets
      const outletsList = await outletsAPI.getAll();
      
      // 2. Query sales by outlet for each outlet (aggregating feed)
      const salesPromises = outletsList.map(async (outlet) => {
        try {
          return await salesAPI.getByOutlet(outlet._id);
        } catch (e) {
          console.error(`Failed to fetch sales for outlet ${outlet.name}:`, e);
          return [];
        }
      });
      
      const salesResults = await Promise.all(salesPromises);
      
      // 3. Combine and sort feed
      const allSales = salesResults.flat();
      
      // Deduplicate to ensure no double counting
      const uniqueSalesMap = {};
      allSales.forEach(sale => {
        if (sale && sale._id) {
          uniqueSalesMap[sale._id] = sale;
        }
      });
      const uniqueSales = Object.values(uniqueSalesMap);
      
      // Sort by timestamp (newest first)
      uniqueSales.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      
      // Keep top 15-20 records
      setSalesFeed(uniqueSales.slice(0, 15));
    } catch (err) {
      console.error("Error aggregating sales feed:", err);
      // Fallback: try using GET /sales/recent
      try {
        const recentSales = await salesAPI.getRecent(15);
        setSalesFeed(recentSales);
      } catch (fallbackErr) {
        console.error("Fallback error loading sales:", fallbackErr);
        setError("Failed to load initial sales feed");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialFeed();

    let socket;
    let reconnectTimeout;
    const token = localStorage.getItem("token");
    const wsUrl = `ws://localhost:5000${token ? `?token=${token}` : ""}`;

    const connectWebSocket = () => {
      setWsStatus("connecting");
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("WebSocket connected to live sales feed");
        setWsStatus("connected");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "NEW_SALE") {
            const newSale = message.data;
            
            // Inject new sale in local feed state
            setSalesFeed((prevFeed) => {
              // Ensure no duplicate transactions
              if (prevFeed.some((s) => s._id === newSale._id)) {
                return prevFeed;
              }
              const updatedFeed = [newSale, ...prevFeed];
              updatedFeed.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
              return updatedFeed.slice(0, 15);
            });

            // Trigger temporary visual highlight
            setHighlightSaleId(newSale._id);
            setTimeout(() => {
              setHighlightSaleId(null);
            }, 3000);
          }
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
        }
      };

      socket.onclose = () => {
        setWsStatus("disconnected");
        console.log("WebSocket disconnected. Retrying in 5 seconds...");
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadgeColor = () => {
    if (wsStatus === "connected") return "#10B981";
    if (wsStatus === "connecting") return "#F59E0B";
    return "#F43F5E";
  };

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "500px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>Live Sales Stream</h3>
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "6px", 
                fontSize: "11px", 
                padding: "2px 8px", 
                borderRadius: "12px", 
                backgroundColor: "rgba(255, 255, 255, 0.03)", 
                border: "1px solid rgba(255, 255, 255, 0.05)",
                color: "var(--text-secondary)"
              }}
            >
              <Radio 
                size={12} 
                style={{ 
                  color: getStatusBadgeColor(), 
                  animation: wsStatus === "connected" ? "pulse 2s infinite" : "none" 
                }} 
              />
              <span style={{ textTransform: "capitalize" }}>{wsStatus}</span>
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Real-time aggregate transactions across all metro outlets
          </p>
        </div>

        <button
          className={`btn btn-secondary ${isRefreshing ? "spinning" : ""}`}
          style={{ padding: "8px", display: "flex", alignItems: "center" }}
          onClick={() => loadInitialFeed(true)}
          disabled={loading || isRefreshing}
          title="Manual Sync Feed"
        >
          <RefreshCw size={14} className={isRefreshing ? "spin-animation" : ""} />
        </button>
      </div>

      {/* Feed Body */}
      {error && (
        <div className="alert alert-danger" style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 16px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexGrow: 1, flexDirection: "column", gap: "12px" }}>
          <div className="dot" style={{ width: "24px", height: "24px" }}></div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Aggregating system sales...</p>
        </div>
      ) : (
        <div 
          style={{ 
            flexGrow: 1, 
            overflowY: "auto", 
            paddingRight: "4px", 
            maxHeight: "440px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          {salesFeed.length === 0 ? (
            <div className="empty-state" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
              No transactions recorded in the system.
            </div>
          ) : (
            salesFeed.map((sale) => {
              const isHighlighted = highlightSaleId === sale._id;
              return (
                <div
                  key={sale._id}
                  className={`feed-item ${isHighlighted ? "feed-item-new" : ""}`}
                  style={{
                    backgroundColor: isHighlighted ? "rgba(79, 70, 229, 0.15)" : "rgba(255, 255, 255, 0.02)",
                    border: isHighlighted ? "1px solid var(--primary)" : "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.5s ease-in-out",
                    boxShadow: isHighlighted ? "0 0 15px rgba(79, 70, 229, 0.25)" : "none",
                  }}
                >
                  {/* Left Side: Product and Outlet */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <ShoppingBag size={14} style={{ color: "var(--secondary)" }} />
                      <span style={{ fontWeight: "600", fontSize: "14px", color: "var(--text-primary)" }}>
                        {sale.product ? sale.product.name : "Deleted Product"}
                      </span>
                      <span 
                        style={{ 
                          fontSize: "11px", 
                          backgroundColor: "rgba(255,255,255,0.04)", 
                          padding: "1px 6px", 
                          borderRadius: "4px", 
                          color: "var(--text-secondary)" 
                        }}
                      >
                        Qty: {sale.quantity}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Store size={12} style={{ color: "var(--primary)" }} />
                        <span>{sale.outlet ? sale.outlet.name : "Unknown Outlet"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} style={{ color: "var(--text-muted)" }} />
                        <span>{formatTime(sale.date || sale.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Total Amount */}
                  <div style={{ textAlign: "right" }}>
                    <span 
                      style={{ 
                        fontWeight: "700", 
                        fontSize: "16px", 
                        color: isHighlighted ? "var(--success)" : "var(--text-primary)" 
                      }}
                    >
                      {formatCurrency(sale.totalAmount)}
                    </span>
                    {sale.product?.sku && (
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {sale.product.sku}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Embedded Animations and Keyframes */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .feed-item {
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .feed-item-new {
          animation: glowNew 3s ease-in-out;
        }
        @keyframes glowNew {
          0% { border-color: var(--primary); background-color: rgba(79, 70, 229, 0.2); }
          50% { border-color: var(--success); background-color: rgba(16, 185, 129, 0.1); }
          100% { border-color: rgba(255, 255, 255, 0.05); background-color: rgba(255, 255, 255, 0.02); }
        }
      `}</style>
    </div>
  );
};

export default RecentSalesFeed;
