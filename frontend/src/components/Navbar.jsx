import React from "react";
import { Building2, Bell, RefreshCw, UserCheck, LogOut } from "lucide-react";

export default function Navbar({
  user,
  onOpenAuth,
  onLogout,
  alertsCount,
  onSeedData,
  activeTab,
  setActiveTab,
}) {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-icon">
          <Building2 size={24} />
        </div>
        <div>
          <div className="brand-name">MetroStock</div>
          <div className="brand-tagline">Urban Multi-Branch Inventory & Sales Analytics</div>
        </div>
      </div>

      <div className="nav-actions">
        <div className="status-badge" title="Real-time Synchronization Active">
          <span className="pulse-dot"></span>
          <span>Live Sync Active</span>
        </div>

        <button
          className="alert-bell-btn"
          onClick={() => setActiveTab("alerts")}
          title="View Low-Stock Alerts"
        >
          <Bell size={18} className={alertsCount > 0 ? "text-amber" : ""} />
          <span>Alerts</span>
          {alertsCount > 0 && <span className="badge-counter">{alertsCount}</span>}
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onSeedData}
          title="Reset / Seed Multi-Branch Demo Data"
        >
          <RefreshCw size={14} />
          <span>Seed Demo Data</span>
        </button>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div className="user-profile-badge" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
              <UserCheck size={18} className="text-emerald" />
              <div style={{ textTransform: "capitalize", fontSize: "0.85rem", fontWeight: 600 }}>
                {user.name}
              </div>
            </div>
            <button
              className="btn btn-danger btn-sm logout-btn"
              onClick={onLogout}
              title="Logout"
              id="logout-btn"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              Manager Login
            </button>
            <button
              className="btn btn-danger btn-sm logout-btn"
              onClick={onLogout}
              title="Logout"
              id="logout-btn"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
