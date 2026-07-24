import React, { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";
import { api } from "../api";

export default function InventoryAlerts({ onRefreshMaster }) {
  const [alertData, setAlertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replenishingId, setReplenishingId] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getInventoryAlerts();
      setAlertData(data);
    } catch (err) {
      console.error("Failed to load inventory alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleInstantReplenish = async (alert) => {
    setReplenishingId(alert.id);
    try {
      await api.restockInventory(
        alert.outletId,
        alert.productId,
        alert.suggestedReorderQty
      );
      await fetchAlerts();
      onRefreshMaster();
    } catch (err) {
      alert("Failed to replenish stock");
    } finally {
      setReplenishingId(null);
    }
  };

  if (loading || !alertData) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading Inventory Alerts & Risk Monitoring...
      </div>
    );
  }

  const { totalAlerts, criticalCount, warningCount, alerts } = alertData;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Inventory Alert Command Center</h2>
          <p>Automated stock threshold monitoring to prevent out-of-stock situations across metro branches</p>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <div className="status-badge" style={{ background: "rgba(239, 68, 68, 0.15)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#f87171" }}>
            <AlertCircle size={16} />
            <span>Critical (Out of Stock / &le;5): {criticalCount}</span>
          </div>

          <div className="status-badge" style={{ background: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.3)", color: "#fbbf24" }}>
            <AlertTriangle size={16} />
            <span>Warning (&le; Threshold): {warningCount}</span>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <CheckCircle2 size={48} className="text-emerald" style={{ marginBottom: "1rem" }} />
          <h3 style={{ color: "white", fontSize: "1.3rem" }}>All Inventories Optimal</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Every branch outlet has sufficient stock above safety threshold limits.
          </p>
        </div>
      ) : (
        <div>
          {alerts.map((item) => (
            <div
              key={item.id}
              className={`alert-card ${item.severity === "CRITICAL" ? "critical" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div
                  style={{
                    padding: "0.65rem",
                    borderRadius: "var(--radius-md)",
                    background: item.severity === "CRITICAL" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                    color: item.severity === "CRITICAL" ? "#ef4444" : "#f59e0b",
                  }}
                >
                  <ShieldAlert size={24} />
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h4 style={{ color: "white", fontSize: "1.05rem" }}>{item.productName}</h4>
                    <span
                      style={{
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        background: item.severity === "CRITICAL" ? "#ef4444" : "#f59e0b",
                        color: "white",
                      }}
                    >
                      {item.severity}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Branch: <strong style={{ color: "white" }}>{item.outletName}</strong> ({item.city}) | SKU: {item.sku}
                  </div>

                  <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.65rem", fontSize: "0.85rem" }}>
                    <div>
                      Current Stock:{" "}
                      <strong style={{ color: item.severity === "CRITICAL" ? "#ef4444" : "#fbbf24", fontSize: "1rem" }}>
                        {item.currentStock} units
                      </strong>
                    </div>
                    <div>
                      Min Threshold: <strong style={{ color: "white" }}>{item.minThreshold} units</strong>
                    </div>
                    <div>
                      Suggested Reorder: <strong style={{ color: "#34d399" }}>+{item.suggestedReorderQty} units</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleInstantReplenish(item)}
                  disabled={replenishingId === item.id}
                >
                  <RefreshCw size={16} className={replenishingId === item.id ? "animate-spin" : ""} />
                  {replenishingId === item.id ? "Replenishing..." : `Instantly Refill (+${item.suggestedReorderQty})`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
