import React from "react";
import { 
  LayoutDashboard, 
  Store, 
  Package, 
  ShoppingCart, 
  LogOut,
  Building
} from "lucide-react";

export default function Sidebar({ currentView, onViewChange, user, onLogout }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "outlets", label: "Outlets", icon: Store },
    { id: "products", label: "Products", icon: Package },
    { id: "sales", label: "Sales & Logs", icon: ShoppingCart },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">
          <Building size={20} color="#fff" />
        </div>
        <h2 className="brand-name" style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700 }}>
          MetroHub
        </h2>
      </div>

      <nav style={{ flex: 1, padding: "24px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "12px 16px",
                background: isActive ? "var(--primary-gradient)" : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-outfit)",
                fontSize: "0.95rem",
                fontWeight: 600,
                transition: "all 0.2s"
              }}
              className={!isActive ? "btn-secondary-hover" : ""}
            >
              <Icon size={18} />
              <span className="nav-text">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {user && (
        <div style={{
          padding: "20px 24px",
          borderTop: "1px solid var(--border-light)",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <div className="nav-text" style={{ fontSize: "0.85rem" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Manager
            </div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name}
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              width: "100%",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
            }}
          >
            <LogOut size={14} />
            <span className="nav-text">Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
