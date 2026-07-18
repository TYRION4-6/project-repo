import React from "react";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  LogOut,
} from "lucide-react";

const Sidebar = ({ activeTab, setActiveTab, user, handleLogout }) => {
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "outlets", label: "Outlets", icon: Store },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "sales", label: "Sales & POS", icon: ShoppingCart },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">M</div>
        <div className="logo-text">MetroOps</div>
      </div>

      <nav style={{ flexGrow: 1 }}>
        <ul className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <a
                  className={`nav-link ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">{getInitials(user.name)}</div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
