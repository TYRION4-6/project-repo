import { useState, useEffect, useCallback } from "react";
import { api } from "./api";
import Auth from "./components/Auth";
import DashboardView from "./components/DashboardView";
import OutletsView from "./components/OutletsView";
import InventoryView from "./components/InventoryView";
import ProductManager from "./components/ProductManager";
import POSView from "./components/POSView";
import TransactionsView from "./components/TransactionsView";
import { 
    Store, 
    Layers, 
    TrendingUp, 
    ShoppingCart, 
    History, 
    LogOut, 
    AlertCircle, 
    CheckCircle2, 
    Info,
    X,
    Loader2,
    Package
} from "lucide-react";

function App() {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    
    // Core data state
    const [outlets, setOutlets] = useState([]);
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [analytics, setAnalytics] = useState({});
    
    // Toast notification state
    const [toasts, setToasts] = useState([]);

    // Add a toast notification helper
    const addToast = (text, type = "info") => {
        const id = Date.now() + Math.random().toString(36).substr(2, 5);
        setToasts((prev) => [...prev, { id, text, type }]);
        
        // Auto remove toast after 4.5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4500);
    };

    // Load profile on start if token exists
    useEffect(() => {
        const loadProfile = async () => {
            if (!token) return;
            try {
                const profile = await api.getProfile(token);
                setUser(profile);
            } catch (err) {
                console.error("Token verification failed, logging out", err.message);
                handleLogout();
            }
        };
        loadProfile();
    }, [token]);

    // Set document title and meta description dynamically for SEO
    useEffect(() => {
        if (!user) {
            document.title = "Sign In - MetroRetail Dashboard";
            return;
        }

        const titles = {
            dashboard: "Dashboard Overview - MetroRetail",
            outlets: "Manage Branch Outlets - MetroRetail",
            products: "Product Management - MetroRetail",
            inventory: "Inventory Management Catalog - MetroRetail",
            pos: "POS Transaction Terminal - MetroRetail",
            transactions: "Sales Receipt History - MetroRetail"
        };
        
        document.title = titles[activeTab] || "MetroRetail Multi-branch Dashboard";
    }, [activeTab, user]);

    // Fetch dashboard dataset
    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [outletsData, productsData, salesData, analyticsData] = await Promise.all([
                api.getOutlets(token),
                api.getProducts({}, token),
                api.getSales(token),
                api.getAnalytics(token)
            ]);

            setOutlets(outletsData);
            setProducts(productsData);
            setSales(salesData);
            setAnalytics(analyticsData);
            
            // Check for low stock alerts and warn user
            const lowStockProductsCount = productsData.filter(
                p => p.stockLevel <= (p.lowStockAlertThreshold !== undefined ? p.lowStockAlertThreshold : 10)
            ).length;
            
            if (lowStockProductsCount > 0 && activeTab === "dashboard") {
                addToast(`Attention: You have ${lowStockProductsCount} products with critical low stock levels.`, "warning");
            }
        } catch (err) {
            addToast(err.message || "Failed to load dashboard data", "error");
        } finally {
            setLoading(false);
        }
    }, [token, activeTab]);

    // Load data when authenticated
    useEffect(() => {
        if (token && user) {
            fetchData();
        }
    }, [token, user, fetchData]);

    const handleAuthSuccess = (newToken, newUser) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(newUser);
        setActiveTab("dashboard");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setOutlets([]);
        setProducts([]);
        setSales([]);
        setAnalytics({});
        addToast("Logged out successfully", "info");
    };

    if (!user) {
        return (
            <>
                <Auth onAuthSuccess={handleAuthSuccess} addToast={addToast} />
                {/* Toasts */}
                <div className="toast-container">
                    {toasts.map((toast) => (
                        <div key={toast.id} className={`toast toast-${toast.type}`}>
                            {toast.type === "success" && <CheckCircle2 size={18} className="text-success" />}
                            {toast.type === "error" && <AlertCircle size={18} className="text-danger" />}
                            {toast.type === "warning" && <AlertCircle size={18} className="text-warning" />}
                            {toast.type === "info" && <Info size={18} style={{ color: "var(--color-info)" }} />}
                            <span style={{ fontSize: "14px", flexGrow: 1 }}>{toast.text}</span>
                            <button
                                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </>
        );
    }

    return (
        <div className="app-layout">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Store size={22} />
                    </div>
                    <span className="sidebar-logo-text">MetroRetail</span>
                </div>

                <nav className="sidebar-menu">
                    <button 
                        id="tab-dashboard"
                        className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`}
                        onClick={() => setActiveTab("dashboard")}
                    >
                        <TrendingUp size={18} />
                        Dashboard
                    </button>
                    <button 
                        id="tab-outlets"
                        className={`sidebar-item ${activeTab === "outlets" ? "active" : ""}`}
                        onClick={() => setActiveTab("outlets")}
                    >
                        <Store size={18} />
                        Outlets
                    </button>
                    <button 
                        id="tab-products"
                        className={`sidebar-item ${activeTab === "products" ? "active" : ""}`}
                        onClick={() => setActiveTab("products")}
                    >
                        <Package size={18} />
                        Products
                    </button>
                    <button 
                        id="tab-inventory"
                        className={`sidebar-item ${activeTab === "inventory" ? "active" : ""}`}
                        onClick={() => setActiveTab("inventory")}
                    >
                        <Layers size={18} />
                        Inventory
                    </button>
                    <button 
                        id="tab-pos"
                        className={`sidebar-item ${activeTab === "pos" ? "active" : ""}`}
                        onClick={() => setActiveTab("pos")}
                    >
                        <ShoppingCart size={18} />
                        POS Terminal
                    </button>
                    <button 
                        id="tab-transactions"
                        className={`sidebar-item ${activeTab === "transactions" ? "active" : ""}`}
                        onClick={() => setActiveTab("transactions")}
                    >
                        <History size={18} />
                        Transactions
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">
                            {user.name ? user.name[0].toUpperCase() : "M"}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-role">Branch Manager</div>
                        </div>
                    </div>
                    
                    <button 
                        id="logout-btn"
                        className="sidebar-item" 
                        style={{ width: "100%", background: "none", border: "none", color: "var(--color-danger)" }}
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Pane */}
            <main className="main-content">
                {/* Loader Screen overlay */}
                {loading && (
                    <div style={{
                        position: "fixed",
                        top: "24px",
                        right: "24px",
                        zIndex: 1500,
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "var(--shadow-lg)"
                    }}>
                        <Loader2 className="text-primary" size={16} style={{ animation: "spin 1s linear infinite" }} />
                        <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>Syncing data...</span>
                    </div>
                )}

                {/* Sub-Views Router */}
                {activeTab === "dashboard" && (
                    <DashboardView 
                        analytics={analytics} 
                        products={products}
                        addToast={addToast}
                        setActiveTab={setActiveTab}
                    />
                )}
                {activeTab === "outlets" && (
                    <OutletsView 
                        outlets={outlets} 
                        token={token} 
                        refreshData={fetchData} 
                        addToast={addToast} 
                    />
                )}
                {activeTab === "products" && (
                    <ProductManager 
                        outlets={outlets} 
                        token={token} 
                        refreshData={fetchData} 
                        addToast={addToast} 
                    />
                )}
                {activeTab === "inventory" && (
                    <InventoryView 
                        products={products} 
                        outlets={outlets} 
                        token={token} 
                        refreshData={fetchData} 
                        addToast={addToast} 
                    />
                )}
                {activeTab === "pos" && (
                    <POSView 
                        products={products} 
                        outlets={outlets} 
                        token={token} 
                        refreshData={fetchData} 
                        addToast={addToast} 
                    />
                )}
                {activeTab === "transactions" && (
                    <TransactionsView 
                        sales={sales} 
                        outlets={outlets} 
                    />
                )}
            </main>

            {/* Style spin animation for loader */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>

            {/* Toasts */}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.type === "success" && <CheckCircle2 size={18} className="text-success" />}
                        {toast.type === "error" && <AlertCircle size={18} className="text-danger" />}
                        {toast.type === "warning" && <AlertCircle size={18} className="text-warning" />}
                        {toast.type === "info" && <Info size={18} style={{ color: "var(--color-info)" }} />}
                        <span style={{ fontSize: "14px", flexGrow: 1 }}>{toast.text}</span>
                        <button
                            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;