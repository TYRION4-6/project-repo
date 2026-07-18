import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Outlets from "./pages/Outlets";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import { authAPI } from "./api";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const checkLoggedInUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authAPI.getMe();
      setUser(userData);
    } catch (err) {
      console.error("Session expired or token invalid", err);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Dynamically set title based on current tab
  useEffect(() => {
    if (user) {
      const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      document.title = `${tabName} | MetroOps Admin`;
    } else {
      document.title = "Login | MetroOps Admin Dashboard";
    }
  }, [user, activeTab]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "var(--bg-main)", flexDirection: "column", gap: "16px" }}>
        <div className="dot" style={{ width: "32px", height: "32px" }}></div>
        <p style={{ color: "var(--text-secondary)", fontFamily: "sans-serif" }}>Initializing System...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        handleLogout={handleLogout}
      />
      
      <main className="main-content">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "outlets" && <Outlets />}
        {activeTab === "inventory" && <Inventory />}
        {activeTab === "sales" && <Sales />}
      </main>
    </div>
  );
}

export default App;