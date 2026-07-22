import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

export default function ThresholdAlerts({ alerts, onNavigateToProducts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div 
      className="glass-card fade-in" 
      style={{ 
        border: "1px solid rgba(239, 68, 68, 0.25)", 
        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)",
        padding: "20px",
        marginBottom: "24px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{ 
          background: "rgba(239, 68, 68, 0.15)", 
          padding: "8px", 
          borderRadius: "8px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center"
        }}>
          <AlertTriangle color="#ef4444" size={20} className="pulse-animation" />
        </div>
        <div>
          <h3 style={{ margin: 0, color: "#fff", fontSize: "1.1rem", fontWeight: 700 }}>
            Critical Stock Breach Alerts
          </h3>
          <p style={{ margin: "2px 0 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            The following items have fallen below their minimum required stock levels.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {alerts.map((alert) => {
          const product = alert.productId || {};
          const outlet = alert.outletId || {};
          return (
            <div 
              key={alert._id} 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                background: "rgba(255, 255, 255, 0.03)", 
                padding: "12px 16px", 
                borderRadius: "var(--radius-md)",
                fontSize: "0.9rem",
                border: "1px solid rgba(255, 255, 255, 0.05)"
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: "#fff" }}>{product.name || "Unknown Product"}</span>{" "}
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>({product.sku || "N/A"})</span>
                <span style={{ color: "var(--text-secondary)" }}> at </span>
                <span style={{ color: "var(--primary-light)", fontWeight: 500 }}>
                  {outlet.name || "Unknown Outlet"} ({outlet.city || "Unknown City"})
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  Stock: <strong style={{ color: "var(--danger)" }}>{alert.quantity}</strong> / {alert.threshold} min
                </span>
                <span className="badge badge-danger" style={{ textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 700 }}>
                  Breached
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={onNavigateToProducts}
        className="btn btn-secondary btn-sm"
        style={{ 
          marginTop: "16px", 
          borderColor: "rgba(239, 68, 68, 0.3)", 
          background: "rgba(239, 68, 68, 0.05)",
          color: "#f87171",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        <span>Refill Inventory at Products tab</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
