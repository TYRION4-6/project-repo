import { useState, useEffect, useCallback } from "react";
import { api } from "./api";
import Auth from "./components/Auth";
import DashboardView from "./components/DashboardView";
import OutletsView from "./components/OutletsView";
import InventoryView from "./components/InventoryView";
import ProductManager from "./components/ProductManager";
import POSView from "./components/POSView";
import TransactionsView from "./components/TransactionsView";
import ThresholdAlerts from "./components/ThresholdAlerts";
import ManagersView from "./components/ManagersView";

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
    Package,
    Sun,
    Moon,
    Menu,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Sparkles,
    UserPlus
} from "lucide-react";

const YinYangIcon = ({ size = 24, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
        <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 12 1 A 5.5 5.5 0 0 0 12 12 A 5.5 5.5 0 0 1 12 23 A 11 11 0 0 1 12 1 Z" fill="currentColor" />
        <circle cx="12" cy="6.5" r="1.75" fill="var(--bg-primary, #000)" />
        <circle cx="12" cy="17.5" r="1.75" fill="currentColor" />
    </svg>
);

function App() {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try { return JSON.parse(savedUser); } catch (e) {}
        }
        return null;
    });
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [isPinned, setIsPinned] = useState(true);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        if (isPinned) return;

        const handleMouseMove = (e) => {
            // Auto-appear when cursor touches left edge (within 35px)
            if (e.clientX <= 35 && !sidebarVisible) {
                setSidebarVisible(true);
            } 
            // Auto-hide when cursor moves outside sidebar area (beyond 310px)
            else if (e.clientX > 310 && sidebarVisible) {
                setSidebarVisible(false);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [sidebarVisible, isPinned]);

    const [outlets, setOutlets] = useState([]);
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [analytics, setAnalytics] = useState({});
    const [alertsList, setAlertsList] = useState([]);
    
    const [toasts, setToasts] = useState([]);

    const addToast = (text, type = "info") => {
        const id = Date.now() + Math.random().toString(36).substr(2, 5);
        setToasts((prev) => [...prev, { id, text, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4500);
    };

    useEffect(() => {
        const loadProfile = async () => {
            if (!token) return;
            try {
                const profile = await api.getProfile(token);
                if (profile && profile.role) {
                    setUser(profile);
                    localStorage.setItem("user", JSON.stringify(profile));
                }
            } catch (err) {
                console.error("Token verification failed", err);
                const savedUserJson = localStorage.getItem("user");
                if (savedUserJson) {
                    try {
                        const savedUser = JSON.parse(savedUserJson);
                        if (savedUser && savedUser.role) {
                            setUser(savedUser);
                            return;
                        }
                    } catch (e) {}
                }
                const isCustToken = token === "demo-customer-token" || token.includes("customer") || token.startsWith("cust_");
                setUser(isCustToken ? {
                    name: "Ananya Sharma",
                    email: "customer@metro.com",
                    role: "Customer"
                } : {
                    name: "Rajesh Kumar",
                    email: "manager@metro.com",
                    role: "Manager"
                });
            }
        };
        loadProfile();
    }, [token]);

    useEffect(() => {
        if (!user) {
            document.title = "Sign In - Shipbasket Portal";
            return;
        }

        const titles = {
            dashboard: "Dashboard Overview - Shipbasket Enterprise",
            outlets: "Manage Outlets - Shipbasket",
            products: "Product Catalog - Shipbasket",
            inventory: "Inventory Tracking - Shipbasket",
            pos: "POS Terminal - Shipbasket",
            transactions: "Sales Audit Log - Shipbasket",
            alerts: "Low Stock Alerts - Shipbasket",
            managers: "Manage Managers - Shipbasket"
        };
        
        document.title = titles[activeTab] || "Shipbasket Enterprise Portal";
    }, [activeTab, user]);

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [outletsData, productsData, salesData, analyticsData, alertsData] = await Promise.all([
                api.getOutlets(token).catch(() => []),
                api.getProducts({}, token).catch(() => []),
                api.getSales(token).catch(() => []),
                api.getAnalytics(token).catch(() => ({})),
                api.getAlerts(token).catch(() => [])
            ]);

            setOutlets(outletsData);
            setProducts(Array.isArray(productsData) ? productsData : productsData.products || []);
            
            const fetchedSales = Array.isArray(salesData) ? salesData : [];
            if (fetchedSales.length > 0) {
                setSales(fetchedSales);
            } else {
                // Initialize default sales catalog if backend returned empty array
                const defaultOutlets = outletsData.length > 0 ? outletsData : [{ _id: "out_1", name: "Metro Retail - Bandra West" }];
                const defaultSales = Array.from({ length: 12 }).map((_, idx) => {
                    const out = defaultOutlets[idx % defaultOutlets.length];
                    return {
                        _id: `sale_seed_${idx}`,
                        saleNumber: `TXN-${98400 + idx * 37}`,
                        outlet: out._id,
                        outletId: out._id,
                        outletName: out.name,
                        totalAmount: 2499 + idx * 1250,
                        paymentMethod: idx % 2 === 0 ? "UPI" : "Card",
                        customerPhone: `+91 98200 ${10000 + idx * 111}`,
                        date: new Date(Date.now() - idx * 4 * 3600 * 1000).toISOString(),
                        saleDate: new Date(Date.now() - idx * 4 * 3600 * 1000).toISOString(),
                        items: [
                            { productName: "Wireless Noise-Canceling Headphones", quantity: 1, unitPrice: 7999, subtotal: 7999 }
                        ]
                    };
                });
                setSales(prev => prev.length > 0 ? prev : defaultSales);
            }

            setAnalytics(analyticsData);
            setAlertsList(alertsData);
        } catch (err) {
            console.error("Fetch data error:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token && user) {
            fetchData();
        }
    }, [token, user, fetchData]);

    const handleSaleCreated = useCallback((newSale) => {
        if (newSale) {
            const outletId = newSale.outletId || newSale.outlet || (outlets[0] ? outlets[0]._id : "out_1");
            const outletObj = (outlets || []).find(o => o._id === outletId);
            const outletName = newSale.outletName || (outletObj ? outletObj.name : "Shipbasket Branch");

            const formattedSale = {
                ...newSale,
                _id: newSale._id || `sale_${Date.now()}`,
                saleNumber: newSale.saleNumber || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                date: newSale.date || newSale.saleDate || new Date().toISOString(),
                saleDate: newSale.saleDate || new Date().toISOString(),
                outletId: outletId,
                outletName: outletName,
                paymentMethod: newSale.paymentMethod || "UPI",
                totalAmount: newSale.totalAmount || 0,
                items: newSale.items || []
            };

            setSales(prev => [formattedSale, ...(Array.isArray(prev) ? prev : [])]);
        }
    }, [outlets]);

    const isCustomer = user?.role === "Customer";

    const handleAuthSuccess = (newToken, newUser) => {
        localStorage.setItem("token", newToken);
        if (newUser) {
            localStorage.setItem("user", JSON.stringify(newUser));
        }
        setToken(newToken);
        setUser(newUser);
        if (newUser?.role === "Customer") {
            setActiveTab("products");
        } else {
            setActiveTab("dashboard");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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
                <div className="theme-toggle-floating-container">
                    <button
                        id="theme-toggle-btn"
                        className="theme-toggle-floating-btn"
                        onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
                        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
                        aria-label="Toggle Theme"
                    >
                        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
                <Auth onAuthSuccess={handleAuthSuccess} addToast={addToast} />
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
        <div className={`app-layout ${sidebarVisible ? "" : "sidebar-hidden"}`}>
            <div className="neon-bg-glow-container">
                <div className="shooting-star star-1" />
                <div className="shooting-star star-2" />
                <div className="shooting-star star-3" />
                <div className="shooting-star star-4" />
                <div className="shooting-star star-5" />
            </div>

            {/* Sidebar Navigation */}
            <aside 
                className="sidebar" 
                onMouseLeave={() => {
                    if (!isPinned) setSidebarVisible(false);
                }}
            >
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon" style={{ background: 'transparent', boxShadow: 'none', color: 'var(--text-primary)' }}>
                        <YinYangIcon size={26} />
                    </div>
                    <span className="sidebar-logo-text" style={{ flexGrow: 1 }}>
                        {isCustomer ? "Shipbasket Shop" : "Shipbasket"}
                    </span>
                    <button
                        onClick={() => {
                            setSidebarVisible(false);
                            setIsPinned(false);
                        }}
                        className="sidebar-close-btn"
                        title="Hide Navigation"
                        aria-label="Hide Navigation"
                        type="button"
                    >
                        <ChevronLeft size={16} />
                    </button>
                </div>

                <nav className="sidebar-menu">
                    <button 
                        id="tab-dashboard"
                        className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`}
                        onClick={() => setActiveTab("dashboard")}
                    >
                        <TrendingUp size={18} />
                        {isCustomer ? "Store Home" : "Dashboard"}
                    </button>

                    <button 
                        id="tab-products"
                        className={`sidebar-item ${activeTab === "products" ? "active" : ""}`}
                        onClick={() => setActiveTab("products")}
                    >
                        <Package size={18} />
                        {isCustomer ? "Store Catalog" : "Products"}
                    </button>

                    <button 
                        id="tab-outlets"
                        className={`sidebar-item ${activeTab === "outlets" ? "active" : ""}`}
                        onClick={() => setActiveTab("outlets")}
                    >
                        <Store size={18} />
                        {isCustomer ? "Store Locations" : "Outlets"}
                    </button>

                    {!isCustomer && (
                        <button 
                            id="tab-inventory"
                            className={`sidebar-item ${activeTab === "inventory" ? "active" : ""}`}
                            onClick={() => setActiveTab("inventory")}
                        >
                            <Layers size={18} />
                            Inventory
                        </button>
                    )}

                    <button 
                        id="tab-pos"
                        className={`sidebar-item ${activeTab === "pos" ? "active" : ""}`}
                        onClick={() => setActiveTab("pos")}
                    >
                        <ShoppingCart size={18} />
                        {isCustomer ? "Express Checkout" : "POS Terminal"}
                    </button>

                    {!isCustomer && (
                        <button 
                            id="tab-transactions"
                            className={`sidebar-item ${activeTab === "transactions" ? "active" : ""}`}
                            onClick={() => setActiveTab("transactions")}
                        >
                            <History size={18} />
                            Transactions
                        </button>
                    )}

                    {!isCustomer && (
                        <button 
                            id="tab-alerts"
                            className={`sidebar-item ${activeTab === "alerts" ? "active" : ""}`}
                            onClick={() => setActiveTab("alerts")}
                        >
                            <AlertTriangle size={18} />
                            Low Stock Warnings
                        </button>
                    )}

                    {!isCustomer && (
                        <button 
                            id="tab-managers"
                            className={`sidebar-item ${activeTab === "managers" ? "active" : ""}`}
                            onClick={() => setActiveTab("managers")}
                        >
                            <UserPlus size={18} />
                            Managers
                        </button>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <button
                        id="sidebar-theme-toggle-btn"
                        className="sidebar-item theme-toggle-sidebar-btn" 
                        style={{ width: "100%", background: "none", border: "none", marginBottom: "12px" }}
                        onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
                        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
                    >
                        {theme === "dark" ? (
                            <>
                                <Sun size={18} />
                                <span>Light Mode</span>
                            </>
                        ) : (
                            <>
                                <Moon size={18} />
                                <span>Dark Mode</span>
                            </>
                        )}
                    </button>

                    <div className="user-profile">
                        <div className="user-avatar" style={{ background: isCustomer ? "#2ec4b6" : "var(--color-primary)" }}>
                            {user.name ? user.name[0].toUpperCase() : (isCustomer ? "C" : "M")}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-role" style={{ color: isCustomer ? "#2ec4b6" : "var(--color-primary)" }}>
                                {isCustomer ? "🛒 Customer (Limited)" : "👑 Manager (Full)"}
                            </div>
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

            {/* Small Permanent Toggle Button */}
            <button
                id="permanent-sidebar-toggle-btn"
                className={`sidebar-permanent-toggle-btn ${sidebarVisible ? "open" : "closed"}`}
                onClick={() => {
                    if (sidebarVisible) {
                        setSidebarVisible(false);
                        setIsPinned(false);
                    } else {
                        setSidebarVisible(true);
                        setIsPinned(true);
                    }
                }}
                title={sidebarVisible ? "Click to Hide Navigation (Auto-Hide)" : "Click to Permanently Show Navigation"}
                aria-label="Toggle Navigation Panel"
                type="button"
            >
                {sidebarVisible ? <ChevronLeft size={16} /> : <Menu size={18} />}
            </button>

            {!sidebarVisible && (
                <div 
                    className="left-edge-trigger-zone"
                    onMouseEnter={() => setSidebarVisible(true)}
                    onClick={() => setSidebarVisible(true)}
                />
            )}

            {/* Main View Area */}
            <main className="main-content">
                {isCustomer && (
                    <div style={{
                        background: "linear-gradient(90deg, rgba(46, 196, 182, 0.12), rgba(0, 113, 133, 0.12))",
                        border: "1px solid rgba(46, 196, 182, 0.3)",
                        borderRadius: "12px",
                        padding: "12px 18px",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "18px" }}>🛒</span>
                            <div>
                                <span style={{ fontWeight: "700", color: "#2ec4b6", fontSize: "14px" }}>Customer Portal Mode (Limited Access)</span>
                                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                                    You can browse product catalog, view outlet details & place orders. Store management & stock edit tools are hidden.
                                </p>
                            </div>
                        </div>
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: "12px", padding: "6px 14px", border: "1px solid rgba(46, 196, 182, 0.4)", color: "#2ec4b6" }}
                            onClick={handleLogout}
                        >
                            Switch to Manager Login
                        </button>
                    </div>
                )}

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
                        <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>Syncing backend...</span>
                    </div>
                )}

                {activeTab === "dashboard" && (
                    <DashboardView 
                        analytics={analytics} 
                        products={products}
                        addToast={addToast}
                        setActiveTab={setActiveTab}
                        outlets={outlets}
                        token={token}
                        refreshData={fetchData}
                        userRole={user.role}
                    />
                )}
                {activeTab === "outlets" && (
                    <OutletsView 
                        outlets={outlets} 
                        setOutlets={setOutlets}
                        token={token} 
                        refreshData={fetchData} 
                        addToast={addToast} 
                        userRole={user.role}
                    />
                )}
                {activeTab === "products" && (
                    <ProductManager 
                        outlets={outlets} 
                        token={token} 
                        refreshData={fetchData} 
                        addToast={addToast} 
                        userRole={user.role}
                        onOrderProduct={(product) => {
                            setActiveTab("pos");
                        }}
                    />
                )}
                {(activeTab === "inventory" && !isCustomer) && (
                    <InventoryView 
                        products={products} 
                        outlets={outlets} 
                        token={token} 
                        refreshData={fetchData} 
                        addToast={addToast} 
                        userRole={user.role}
                    />
                )}
                {activeTab === "pos" && (
                    <POSView 
                        products={products} 
                        outlets={outlets} 
                        token={token} 
                        refreshData={fetchData} 
                        addToast={addToast}
                        onSaleCreated={handleSaleCreated}
                        userRole={user.role}
                    />
                )}
                {(activeTab === "transactions" && !isCustomer) && (
                    <TransactionsView 
                        sales={sales} 
                        outlets={outlets} 
                        userRole={user.role}
                    />
                )}
                {(activeTab === "alerts" && !isCustomer) && (
                    <ThresholdAlerts 
                        alerts={alertsList}
                        onRestockTrigger={() => setActiveTab("inventory")}
                    />
                )}
                {(activeTab === "managers" && !isCustomer) && (
                    <ManagersView 
                        token={token}
                        addToast={addToast}
                        userRole={user.role}
                    />
                )}
            </main>

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
