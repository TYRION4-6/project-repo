import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import OutletsManager from "./components/OutletsManager";
import ProductsManager from "./components/ProductsManager";
import POSTerminal from "./components/POSTerminal";
import OutletProductEntryForm from "./components/OutletProductEntryForm";
import SalesHistory from "./components/SalesHistory";
import InventoryAlerts from "./components/InventoryAlerts";
import {
  BarChart3,
  Building2,
  Package,
  ShoppingCart,
  Receipt,
  Bell,
  FilePlus,
} from "lucide-react";
import { api } from "./api";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("entry-form");
  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [selectedOutlet, setSelectedOutlet] = useState("ALL");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loadInitialData = async () => {
    try {
      // 1. Get profile if logged in
      const profRes = await api.getProfile();
      if (profRes.user) {
        setUser(profRes.user);
      }

      // 2. Get outlets
      const outletsData = await api.getOutlets();
      if (Array.isArray(outletsData)) {
        setOutlets(outletsData);
      }

      // 3. Get products with stock breakdown
      const productsData = await api.getProducts();
      if (Array.isArray(productsData)) {
        setProducts(productsData);
      }

      // 4. Get alert count
      const alertsData = await api.getInventoryAlerts();
      if (alertsData && alertsData.totalAlerts !== undefined) {
        setAlertsCount(alertsData.totalAlerts);
      }
    } catch (err) {
      console.error("Initialization error", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSeedDemoData = async () => {
    try {
      await api.seedDemoData();
      await loadInitialData();
      alert("Multi-branch Metro Retail demo data successfully populated!");
    } catch (err) {
      alert("Failed to seed demo data");
    }
  };

  const handleLogout = () => {
    // 1. Remove JWT token & authentication data from client storage
    localStorage.removeItem("metro_token");
    localStorage.removeItem("token");
    localStorage.removeItem("jwt");
    sessionStorage.removeItem("metro_token");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("jwt");

    // 2. Clear user state
    setUser(null);

    // 3. Navigate/redirect user to login screen modal
    setIsAuthModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        alertsCount={alertsCount}
        onSeedData={handleSeedDemoData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Navigation Subheader Tabs */}
      <div className="tabs-bar">
        <button
          className={`tab-btn ${activeTab === "entry-form" ? "active" : ""}`}
          onClick={() => setActiveTab("entry-form")}
        >
          <FilePlus size={16} /> Outlet & Product Entry Form
        </button>

        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart3 size={16} /> Analytics Dashboard
        </button>

        <button
          className={`tab-btn ${activeTab === "outlets" ? "active" : ""}`}
          onClick={() => setActiveTab("outlets")}
        >
          <Building2 size={16} /> Branch Outlets ({outlets.length})
        </button>

        <button
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <Package size={16} /> Product Inventory ({products.length})
        </button>

        <button
          className={`tab-btn ${activeTab === "pos" ? "active" : ""}`}
          onClick={() => setActiveTab("pos")}
        >
          <ShoppingCart size={16} /> Record Sales (POS)
        </button>

        <button
          className={`tab-btn ${activeTab === "sales" ? "active" : ""}`}
          onClick={() => setActiveTab("sales")}
        >
          <Receipt size={16} /> Sales Audit Log
        </button>

        <button
          className={`tab-btn ${activeTab === "alerts" ? "active" : ""}`}
          onClick={() => setActiveTab("alerts")}
        >
          <Bell size={16} /> Inventory Alerts
          {alertsCount > 0 && <span className="badge-counter">{alertsCount}</span>}
        </button>
      </div>

      {/* Main View Area */}
      <main className="main-content">
        {activeTab === "entry-form" && (
          <OutletProductEntryForm
            outlets={outlets}
            products={products}
            onSubmit={async (formData) => {
              console.log("Form Submitted:", formData);
              // Option to sync with backend inventory restock if needed
              if (formData.outletId && formData.productId) {
                try {
                  await api.restockInventory(formData.outletId, formData.productId, formData.quantity);
                  loadInitialData();
                } catch (e) {
                  // Fallback for standalone demo
                }
              }
            }}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsDashboard
            outlets={outlets}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
            user={user}
            onLogout={handleLogout}
          />
        )}

        {activeTab === "outlets" && (
          <OutletsManager outlets={outlets} onRefresh={loadInitialData} />
        )}

        {activeTab === "products" && (
          <ProductsManager products={products} outlets={outlets} onRefresh={loadInitialData} />
        )}

        {activeTab === "pos" && (
          <POSTerminal outlets={outlets} products={products} onSaleSuccess={loadInitialData} />
        )}

        {activeTab === "sales" && <SalesHistory outlets={outlets} />}

        {activeTab === "alerts" && (
          <InventoryAlerts onRefreshMaster={loadInitialData} />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(userData) => {
          setUser(userData);
          loadInitialData();
        }}
      />
    </div>
  );
}

export default App;