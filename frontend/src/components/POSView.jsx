import { useState, useEffect } from "react";
import { api } from "../api";
import { ShoppingCart, Plus, Minus, Trash2, Search, Tag, AlertCircle } from "lucide-react";

export default function POSView({ products, outlets, token, refreshData, addToast }) {
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);

    // Reset cart when selected outlet changes
    useEffect(() => {
        setCart([]);
    }, [selectedOutlet]);

    // Set initial outlet if available
    useEffect(() => {
        if (outlets.length > 0 && !selectedOutlet) {
            setSelectedOutlet(outlets[0]._id);
        }
    }, [outlets, selectedOutlet]);

    // Filter products belonging to selected outlet
    const outletProducts = products.filter(
        (p) => (p.outlet?._id === selectedOutlet || p.outlet === selectedOutlet)
    );

    // Apply search query
    const filteredProducts = outletProducts.filter((product) => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q);
        }
        return true;
    });

    const addToCart = (product) => {
        if (product.stockLevel <= 0) {
            addToast("This product is out of stock!", "error");
            return;
        }

        const existingItem = cart.find((item) => item.product === product._id);

        if (existingItem) {
            if (existingItem.quantity >= product.stockLevel) {
                addToast(`Cannot add more. Only ${product.stockLevel} units available in stock.`, "warning");
                return;
            }
            setCart(
                cart.map((item) =>
                    item.product === product._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
        } else {
            setCart([...cart, {
                product: product._id,
                name: product.name,
                price: product.price,
                stockLevel: product.stockLevel,
                quantity: 1
            }]);
        }
        addToast(`${product.name} added to cart`, "success");
    };

    const updateQuantity = (productId, delta) => {
        const item = cart.find((i) => i.product === productId);
        if (!item) return;

        const newQty = item.quantity + delta;

        if (newQty <= 0) {
            removeFromCart(productId);
            return;
        }

        if (newQty > item.stockLevel) {
            addToast(`Only ${item.stockLevel} units available in stock.`, "warning");
            return;
        }

        setCart(
            cart.map((i) => (i.product === productId ? { ...i, quantity: newQty } : i))
        );
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter((item) => item.product !== productId));
        addToast("Item removed from cart", "warning");
    };

    const clearCart = () => {
        setCart([]);
        addToast("Cart cleared", "warning");
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            addToast("Your cart is empty", "warning");
            return;
        }

        setLoading(true);
        try {
            const saleData = {
                outlet: selectedOutlet,
                items: cart.map((item) => ({
                    product: item.product,
                    quantity: item.quantity
                }))
            };

            await api.recordSale(saleData, token);
            addToast("Checkout successful! Inventory levels updated.", "success");
            setCart([]);
            refreshData(); // Refresh products and analytics globally
        } catch (err) {
            addToast(err.message || "Checkout failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Point of Sale (POS) Terminal</h2>
                    <p className="page-subtitle">Select outlet branch, add items to cart, and record live retail transactions</p>
                </div>
            </div>

            {outlets.length === 0 ? (
                <div className="card-panel empty-state">
                    <AlertCircle className="empty-state-icon text-warning" size={60} />
                    <h2>Setup Outlets First</h2>
                    <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                        You must add at least one outlet branch before you can access the POS terminal.
                    </p>
                </div>
            ) : (
                <div className="pos-layout">
                    {/* Left: Product Selector */}
                    <div>
                        <div className="card-panel mb-4" style={{ padding: "16px 20px" }}>
                            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                <div style={{ minWidth: "220px", flexGrow: 1 }}>
                                    <select
                                        id="pos-outlet-select"
                                        className="form-select"
                                        value={selectedOutlet}
                                        onChange={(e) => setSelectedOutlet(e.target.value)}
                                    >
                                        <option value="">Select Branch...</option>
                                        {outlets.map((o) => (
                                            <option key={o._id} value={o._id}>{o.name} ({o.city})</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flexGrow: 2, minWidth: "260px", position: "relative" }}>
                                    <Search 
                                        size={18} 
                                        style={{ 
                                            position: "absolute", 
                                            left: "14px", 
                                            top: "50%", 
                                            transform: "translateY(-50%)", 
                                            color: "var(--text-secondary)" 
                                        }} 
                                    />
                                    <input
                                        id="pos-search-input"
                                        type="text"
                                        className="form-input"
                                        placeholder="Search products by name or SKU..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ paddingLeft: "42px" }}
                                        disabled={!selectedOutlet}
                                    />
                                </div>
                            </div>
                        </div>

                        {!selectedOutlet ? (
                            <div className="card-panel empty-state" style={{ height: "400px" }}>
                                <ShoppingCart className="empty-state-icon" size={60} />
                                <h3>Select Branch Outlet</h3>
                                <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                                    Please select an outlet from the dropdown to load its catalog.
                                </p>
                            </div>
                        ) : outletProducts.length === 0 ? (
                            <div className="card-panel empty-state" style={{ height: "400px" }}>
                                <Tag className="empty-state-icon" size={60} />
                                <h3>No Products Available</h3>
                                <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                                    This branch outlet has no products in stock. Go to the Inventory page to add products.
                                </p>
                            </div>
                        ) : (
                            <div className="pos-products-grid" id="pos-products-list">
                                {filteredProducts.map((product) => {
                                    const cartQty = cart.find(i => i.product === product._id)?.quantity || 0;
                                    const available = product.stockLevel - cartQty;
                                    return (
                                        <div 
                                            key={product._id} 
                                            className="pos-product-card"
                                            onClick={() => addToCart(product)}
                                            style={{ 
                                                opacity: product.stockLevel <= 0 ? 0.6 : 1,
                                                position: "relative"
                                            }}
                                        >
                                            <h4 style={{ color: "white", fontSize: "15px", marginBottom: "4px" }}>{product.name}</h4>
                                            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "12px" }}>
                                                SKU: {product.sku}
                                            </span>
                                            
                                            <div className="flex-between">
                                                <span style={{ fontWeight: "700", color: "var(--color-primary)" }}>
                                                    {formatCurrency(product.price)}
                                                </span>
                                                <span 
                                                    style={{ 
                                                        fontSize: "12px", 
                                                        color: available <= 5 ? "var(--color-danger)" : "var(--text-secondary)" 
                                                    }}
                                                >
                                                    {product.stockLevel <= 0 ? "Out of Stock" : `${available} left`}
                                                </span>
                                            </div>
                                            {cartQty > 0 && (
                                                <div 
                                                    style={{ 
                                                        position: "absolute", 
                                                        top: "-8px", 
                                                        right: "-8px", 
                                                        background: "var(--color-primary)", 
                                                        color: "white", 
                                                        borderRadius: "50%", 
                                                        width: "22px", 
                                                        height: "22px", 
                                                        display: "flex", 
                                                        alignItems: "center", 
                                                        justifyContent: "center",
                                                        fontSize: "12px",
                                                        fontWeight: "bold",
                                                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                                                    }}
                                                >
                                                    {cartQty}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right: Checkout Sidebar */}
                    <div className="card-panel pos-cart-panel" id="pos-cart-container">
                        <div className="chart-header" style={{ marginBottom: "16px" }}>
                            <h3 className="chart-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <ShoppingCart size={20} />
                                Shopping Cart
                            </h3>
                            {cart.length > 0 && (
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: "6px 12px", fontSize: "12px", color: "var(--color-danger)" }}
                                    onClick={clearCart}
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex-center" style={{ flexGrow: 1, flexDirection: "column", height: "300px", color: "var(--text-secondary)" }}>
                                <ShoppingCart size={40} style={{ marginBottom: "12px", opacity: 0.3 }} />
                                <span>Cart is empty.</span>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Click on products to add.</span>
                            </div>
                        ) : (
                            <>
                                <div className="pos-cart-items">
                                    {cart.map((item) => (
                                        <div key={item.product} className="pos-cart-item">
                                            <div style={{ flexGrow: 1, maxWidth: "60%" }}>
                                                <h4 style={{ color: "white", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {item.name}
                                                </h4>
                                                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                                    {formatCurrency(item.price)} each
                                                </span>
                                            </div>
                                            
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <button 
                                                    className="pos-cart-qty-btn"
                                                    onClick={() => updateQuantity(item.product, -1)}
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span style={{ fontWeight: "600", width: "20px", textAlign: "center" }}>
                                                    {item.quantity}
                                                </span>
                                                <button 
                                                    className="pos-cart-qty-btn"
                                                    onClick={() => updateQuantity(item.product, 1)}
                                                >
                                                    <Plus size={12} />
                                                </button>
                                                
                                                <button 
                                                    style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", marginLeft: "6px" }}
                                                    onClick={() => removeFromCart(item.product)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pos-cart-summary">
                                    <div className="flex-between">
                                        <span style={{ color: "var(--text-secondary)" }}>Subtotal ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                                        <span style={{ fontWeight: "500" }}>{formatCurrency(calculateTotal())}</span>
                                    </div>
                                    <div className="flex-between" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "4px" }}>
                                        <span style={{ fontSize: "16px", fontWeight: "600", color: "white" }}>Total Amount</span>
                                        <span style={{ fontSize: "20px", fontWeight: "700", color: "var(--color-success)" }}>
                                            {formatCurrency(calculateTotal())}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    id="checkout-submit-btn"
                                    className="btn btn-success"
                                    style={{ width: "100%", padding: "14px", fontSize: "16px" }}
                                    onClick={handleCheckout}
                                    disabled={loading}
                                >
                                    {loading ? "Processing Sale..." : `Checkout - Place Order`}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
