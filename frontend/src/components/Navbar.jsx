import React from "react";
import { Building2, Bell, RefreshCw, UserCheck, ShieldAlert, LogOut } from "lucide-react";

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
          <div className="user-profile-btn" onClick={onLogout} title="Click to Logout">
            <UserCheck size={18} className="text-emerald" />
            <div style={{ textTransform: "capitalize", fontSize: "0.85rem", fontWeight: 600 }}>
              {user.name}
            </div>
            <LogOut size={14} style={{ opacity: 0.6 }} />
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            Manager Login
          </button>
        )}
      </div>
    </header>
  );
}
