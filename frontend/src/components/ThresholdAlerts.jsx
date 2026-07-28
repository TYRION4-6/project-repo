import { AlertTriangle, AlertCircle, PlusCircle, CheckCircle } from "lucide-react";

export default function ThresholdAlerts({ alerts = [], onRestockTrigger }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="card-panel">
        <h2>Critical Low Stock Warnings & Refill Center</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
          Automated real-time inventory monitoring and quick restock recommendations.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {alerts.length > 0 ? (
          alerts.map((alt, idx) => {
            const isCritical = alt.severity === "CRITICAL" || alt.currentStock <= 5;
            return (
              <div 
                key={alt._id || alt.id || idx} 
                className="card-panel" 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  borderLeft: isCritical ? "4px solid var(--color-danger)" : "4px solid var(--color-warning)" 
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ background: isCritical ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)", padding: "12px", borderRadius: "12px" }}>
                    {isCritical ? <AlertCircle size={24} color="var(--color-danger)" /> : <AlertTriangle size={24} color="var(--color-warning)" />}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h4 style={{ fontSize: "1rem", color: "var(--text-primary)", margin: 0 }}>
                        {alt.productName || "Product Item"}
                      </h4>
                      <span className={isCritical ? "badge badge-danger" : "badge badge-warning"}>
                        {isCritical ? "CRITICAL" : "LOW STOCK"}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Branch: <strong>{alt.outletName || "Shipbasket Branch"}</strong> • Current Level: <strong style={{ color: "var(--text-primary)" }}>{alt.currentStock || 0} pcs</strong> (Threshold: {alt.minThreshold || 10} pcs)
                    </p>
                  </div>
                </div>

                {onRestockTrigger && (
                  <button className="btn btn-primary" onClick={() => onRestockTrigger(alt)}>
                    <PlusCircle size={16} /> Quick Refill
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="card-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
            <CheckCircle size={36} color="var(--color-success)" style={{ margin: "0 auto 12px" }} />
            <h3>All Inventory Levels Optimal</h3>
            <p style={{ fontSize: "0.85rem" }}>No stock items are currently below their minimum threshold limit.</p>
          </div>
        )}
      </div>
    </div>
  );
}
