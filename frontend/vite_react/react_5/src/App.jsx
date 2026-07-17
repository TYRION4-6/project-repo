import React, { useState, useEffect } from "react";
import { api } from "./api";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import OutletsView from "./components/OutletsView";
import ProductsView from "./components/ProductsView";
import SalesView from "./components/SalesView";
import { Building, ShieldCheck, Mail, Lock, User, AlertCircle, Sparkles } from "lucide-react";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [currentView, setCurrentView] = useState("dashboard");
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'register'
  
  // Data States
  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Auth Inputs
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  // Fetch initial data if authenticated
  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  const loadAllData = async () => {
    setLoading(true);
    setError("");
    try {
      // Load outlets, products, and analytics
      const [outletsData, productsData, analyticsData, salesData] = await Promise.all([
        api.outlets.getAll(),
        api.products.getAll(),
        api.sales.getAnalytics(),
        api.sales.getAll()
      ]);
      setOutlets(outletsData);
      setProducts(productsData);
      setAnalytics(analyticsData);
      setSales(salesData);
    } catch (err) {
      console.error("Error loading MERN data", err);
      if (err.message.includes("Token") || err.message.includes("unauthorized")) {
        handleLogout();
      } else {
        setError("Failed to sync dashboard data with server.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        const response = await api.auth.login(authForm.email, authForm.password);
        setToken(response.token);
        setUser(response.user);
      } else {
        const response = await api.auth.register(authForm.name, authForm.email, authForm.password);
        setToken(response.token);
        setUser(response.user);
        setSuccessMsg("Account created successfully!");
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setToken(null);
    setUser(null);
    setCurrentView("dashboard");
    setOutlets([]);
    setProducts([]);
    setSales([]);
    setAnalytics(null);
    setAuthForm({ name: "", email: "", password: "" });
  };

  // Outlet Actions
  const handleCreateOutlet = async (outletData) => {
    try {
      await api.outlets.create(outletData);
      loadAllData();
    } catch (err) {
      setError(err.message || "Failed to create outlet");
    }
  };

  const handleUpdateOutlet = async (id, outletData) => {
    try {
      await api.outlets.update(id, outletData);
      loadAllData();
    } catch (err) {
      setError(err.message || "Failed to update outlet");
    }
  };

  const handleDeleteOutlet = async (id) => {
    try {
      await api.outlets.delete(id);
      loadAllData();
    } catch (err) {
      setError(err.message || "Failed to delete outlet");
    }
  };

  // Product Actions
  const handleCreateProduct = async (productData) => {
    try {
      await api.products.create(productData);
      loadAllData();
    } catch (err) {
      setError(err.message || "Failed to create product");
    }
  };

  const handleUpdateProduct = async (id, productData) => {
    try {
      await api.products.update(id, productData);
      loadAllData();
    } catch (err) {
      setError(err.message || "Failed to update product");
    }
  };

  const handleUpdateStock = async (productId, outletId, quantity) => {
    try {
      await api.products.updateStock(productId, outletId, quantity);
      loadAllData();
    } catch (err) {
      setError(err.message || "Failed to adjust stock levels");
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.products.delete(id);
      loadAllData();
    } catch (err) {
      setError(err.message || "Failed to delete product");
    }
  };

  // Sale Actions
  const handleCreateSale = async (saleData) => {
    try {
      await api.sales.create(saleData);
      loadAllData();
    } catch (err) {
      setError(err.message || "Failed to log transaction");
    }
  };

  // Render View helper
  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <DashboardView 
            analyticsData={analytics} 
            loading={loading} 
            onNavigateToSales={() => setCurrentView("sales")}
            onNavigateToProducts={() => setCurrentView("products")}
          />
        );
      case "outlets":
        return (
          <OutletsView 
            outlets={outlets} 
            onCreateOutlet={handleCreateOutlet}
            onUpdateOutlet={handleUpdateOutlet}
            onDeleteOutlet={handleDeleteOutlet}
            loading={loading}
          />
        );
      case "products":
        return (
          <ProductsView 
            products={products}
            outlets={outlets}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onUpdateStock={handleUpdateStock}
            onDeleteProduct={handleDeleteProduct}
            loading={loading}
          />
        );
      case "sales":
        return (
          <SalesView 
            sales={sales}
            products={products}
            outlets={outlets}
            onCreateSale={handleCreateSale}
            loading={loading}
          />
        );
      default:
        return <p>Select a navigation link.</p>;
    }
  };

  // Render Authentication Screen
  if (!token) {
    return (
      <div className="auth-container">
        <div className="glass-card auth-card">
          <div className="text-center mb-6">
            <div className="logo-icon" style={{ margin: "0 auto 16px", width: "48px", height: "48px", borderRadius: "12px" }}>
              <Building size={24} color="#fff" />
            </div>
            <h2 style={{ fontSize: "1.8rem", color: "#fff", marginBottom: "4px" }}>MetroHub</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Metropolitan Multi-Branch Inventory Dashboard
            </p>
          </div>

          <div className="auth-tabs">
            <div 
              className={`auth-tab ${authMode === "login" ? "active" : ""}`}
              onClick={() => { setAuthMode("login"); setError(""); }}
            >
              Log In
            </div>
            <div 
              className={`auth-tab ${authMode === "register" ? "active" : ""}`}
              onClick={() => { setAuthMode("register"); setError(""); }}
            >
              Sign Up
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {authMode === "register" && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Manager Name</label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--text-muted)" }} />
                  <input 
                    type="text" 
                    value={authForm.name} 
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} 
                    placeholder="e.g. Rajesh Kumar" 
                    style={{ paddingLeft: "42px" }}
                    required 
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Work Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--text-muted)" }} />
                <input 
                  type="email" 
                  value={authForm.email} 
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} 
                  placeholder="name@company.com" 
                  style={{ paddingLeft: "42px" }}
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--text-muted)" }} />
                <input 
                  type="password" 
                  value={authForm.password} 
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} 
                  placeholder="••••••••" 
                  style={{ paddingLeft: "42px" }}
                  required 
                />
              </div>
            </div>

            {error && (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                color: "var(--danger)", 
                background: "rgba(239, 68, 68, 0.08)", 
                padding: "10px 14px", 
                borderRadius: "var(--radius-sm)",
                fontSize: "0.85rem",
                border: "1px solid rgba(239, 68, 68, 0.15)"
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                color: "var(--success)", 
                background: "rgba(16, 185, 129, 0.08)", 
                padding: "10px 14px", 
                borderRadius: "var(--radius-sm)",
                fontSize: "0.85rem",
                border: "1px solid rgba(16, 185, 129, 0.15)"
              }}>
                <ShieldCheck size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: "8px" }} disabled={authLoading}>
              {authLoading ? "Syncing..." : authMode === "login" ? "Access Dashboard" : "Register Manager"}
            </button>
          </form>

          <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <Sparkles size={12} color="var(--warning)" />
            <span>MERN-Stack Enterprise Solutions</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Dashboard Layout
  return (
    <div className="dashboard-layout">
      {/* Sidebar Nav */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        user={user} 
        onLogout={handleLogout} 
      />
      
      {/* Main Panel */}
      <main className="main-content">
        <Header 
          currentView={currentView} 
          onRecordSaleClick={() => setCurrentView("sales")} 
        />
        
        {error && (
          <div className="fade-in" style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            color: "var(--danger)", 
            background: "rgba(239, 68, 68, 0.08)", 
            padding: "12px 18px", 
            borderRadius: "var(--radius-md)",
            fontSize: "0.9rem",
            marginBottom: "24px",
            border: "1px solid rgba(239, 68, 68, 0.15)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError("")} 
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Render Selected View */}
        {renderCurrentView()}
      </main>
    </div>
  );
}