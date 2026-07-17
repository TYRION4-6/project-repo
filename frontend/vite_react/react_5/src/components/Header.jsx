import React from "react";
import { Plus, Calendar } from "lucide-react";

export default function Header({ currentView, onRecordSaleClick }) {
  const getViewName = () => {
    switch (currentView) {
      case "dashboard":
        return "Real-time Sales Analytics";
      case "outlets":
        return "Metro Branches Management";
      case "products":
        return "Inventory & Products catalog";
      case "sales":
        return "Transactions Log & Recording";
      default:
        return "Dashboard";
    }
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="top-bar">
      <div>
        <h1 style={{ marginBottom: "4px" }}>{getViewName()}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Welcome back! Manage, analyze, and scale your outlets in real time.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--text-secondary)",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--border-light)",
          padding: "10px 16px",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.9rem"
        }}>
          <Calendar size={16} className="text-muted" />
          <span>{formattedDate}</span>
        </div>

        {currentView !== "sales" && (
          <button onClick={onRecordSaleClick} className="btn btn-primary">
            <Plus size={16} />
            <span>New Sale</span>
          </button>
        )}
      </div>
    </div>
  );
}
